using AutoMapper;
using Microsoft.ServiceFabric.Data;
using Microsoft.ServiceFabric.Data.Collections;
using QRCoder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelService.DTOs;
using TravelService.Models;

namespace TravelService.Services;

public interface IShareService
{
    Task<ShareTokenDto> CreateShareTokenAsync(int planId, int userId, CreateShareTokenDto dto, string baseUrl);
    Task<IEnumerable<ShareTokenDto>> GetShareTokensAsync(int planId, int userId, string baseUrl);
    Task DeleteShareTokenAsync(int tokenId, int planId, int userId);
    Task<(bool exists, bool canEdit)> ValidateTokenAsync(string token);
}

public class ShareService : IShareService
{
    private readonly IReliableStateManager _stateManager;
    private const string DictionaryName = "travelPlansDictionary";

    public ShareService(IReliableStateManager stateManager, IMapper mapper)
    {
        _stateManager = stateManager;
    }

    private async Task<TravelPlan> GetPlanOrThrowAsync(ITransaction tx, IReliableDictionary<int, TravelPlan> dict, int planId, int userId)
    {
        var result = await dict.TryGetValueAsync(tx, planId);
        if (!result.HasValue || result.Value.UserId != userId)
            throw new KeyNotFoundException("Travel plan not found.");
        return result.Value;
    }

    public async Task<ShareTokenDto> CreateShareTokenAsync(int planId, int userId, CreateShareTokenDto dto, string baseUrl)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);

            var accessType = Enum.TryParse<ShareAccessType>(dto.AccessType, true, out var at) ? at : ShareAccessType.View;
            var token = new ShareToken
            {
                Id = Guid.NewGuid().GetHashCode() & int.MaxValue,
                TravelPlanId = planId,
                Token = Guid.NewGuid().ToString("N"),
                AccessType = accessType,
                ExpiresAt = dto.ExpiryDays.HasValue ? DateTime.UtcNow.AddDays(dto.ExpiryDays.Value) : null
            };

            plan.ShareTokens.Add(token);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return BuildShareTokenDto(token, baseUrl);
        }
    }

    public async Task<IEnumerable<ShareTokenDto>> GetShareTokensAsync(int planId, int userId, string baseUrl)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            return plan.ShareTokens.Select(t => BuildShareTokenDto(t, baseUrl)).ToList();
        }
    }

    public async Task DeleteShareTokenAsync(int tokenId, int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var token = plan.ShareTokens.FirstOrDefault(s => s.Id == tokenId)
                ?? throw new KeyNotFoundException("Share token not found.");

            plan.ShareTokens.Remove(token);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();
        }
    }

    public async Task<(bool exists, bool canEdit)> ValidateTokenAsync(string token)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var enumerable = await travelPlansDict.CreateEnumerableAsync(tx);
            using (var enumerator = enumerable.GetAsyncEnumerator())
            {
                while (await enumerator.MoveNextAsync(default))
                {
                    var plan = enumerator.Current.Value;
                    var shareToken = plan.ShareTokens.FirstOrDefault(s => s.Token == token && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow));
                    if (shareToken != null)
                    {
                        return (true, shareToken.AccessType == ShareAccessType.Edit);
                    }
                }
            }
        }
        return (false, false);
    }

    private static ShareTokenDto BuildShareTokenDto(ShareToken token, string baseUrl)
    {
        var shareUrl = $"{baseUrl}/shared/{token.Token}";
        string qrBase64 = string.Empty;
        try
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode(shareUrl, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrData);
            var pngBytes = qrCode.GetGraphic(20);
            qrBase64 = Convert.ToBase64String(pngBytes);
        }
        catch { /* Opciono */ }

        return new ShareTokenDto
        {
            Id = token.Id,
            TravelPlanId = token.TravelPlanId,
            Token = token.Token,
            AccessType = token.AccessType.ToString(),
            CreatedAt = token.CreatedAt,
            ExpiresAt = token.ExpiresAt,
            ShareUrl = shareUrl,
            QrCodeBase64 = qrBase64
        };
    }
}