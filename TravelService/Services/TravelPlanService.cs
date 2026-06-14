using AutoMapper;
using Microsoft.ServiceFabric.Data;
using Microsoft.ServiceFabric.Data.Collections;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelService.DTOs;
using TravelService.Models;

namespace TravelService.Services;

public interface ITravelPlanService
{
    Task<IEnumerable<TravelPlanDto>> GetAllForUserAsync(int userId);
    Task<TravelPlanDetailDto?> GetByIdAsync(int id, int userId);
    Task<TravelPlanDto> CreateAsync(int userId, CreateTravelPlanDto dto);
    Task<TravelPlanDto> UpdateAsync(int id, int userId, UpdateTravelPlanDto dto);
    Task DeleteAsync(int id, int userId);
    Task<TravelPlanDetailDto?> GetByShareTokenAsync(string token);
}

public class TravelPlanService : ITravelPlanService
{
    private readonly IReliableStateManager _stateManager;
    private readonly IMapper _mapper;
    private const string DictionaryName = "travelPlansDictionary";

    public TravelPlanService(IReliableStateManager stateManager, IMapper mapper)
    {
        _stateManager = stateManager;
        _mapper = mapper;
    }

    public async Task<TravelPlanDto> CreateAsync(int userId, CreateTravelPlanDto dto)
    {
        if (dto.EndDate < dto.StartDate)
            throw new ArgumentException("End date cannot be before start date.");

        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);

        var plan = _mapper.Map<TravelPlan>(dto);
        plan.UserId = userId;
        plan.Id = Guid.NewGuid().GetHashCode() & int.MaxValue;

        using (var tx = _stateManager.CreateTransaction())
        {
            await travelPlansDict.AddAsync(tx, plan.Id, plan);
            await tx.CommitAsync();
        }

        return _mapper.Map<TravelPlanDto>(plan);
    }

    public async Task<IEnumerable<TravelPlanDto>> GetAllForUserAsync(int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        var userPlans = new List<TravelPlan>();

        using (var tx = _stateManager.CreateTransaction())
        {
            var enumerable = await travelPlansDict.CreateEnumerableAsync(tx);
            using (var enumerator = enumerable.GetAsyncEnumerator())
            {
                while (await enumerator.MoveNextAsync(default))
                {
                    if (enumerator.Current.Value.UserId == userId)
                    {
                        userPlans.Add(enumerator.Current.Value);
                    }
                }
            }
        }

        return userPlans
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => {
                var dto = _mapper.Map<TravelPlanDto>(p);
                dto.DestinationCount = p.Destinations.Count;
                dto.ActivityCount = p.Activities.Count;
                return dto;
            });
    }

    public async Task<TravelPlanDetailDto?> GetByIdAsync(int id, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);

        using (var tx = _stateManager.CreateTransaction())
        {
            var result = await travelPlansDict.TryGetValueAsync(tx, id);
            if (!result.HasValue || result.Value.UserId != userId) return null;

            return _mapper.Map<TravelPlanDetailDto>(result.Value);
        }
    }

    public async Task<TravelPlanDto> UpdateAsync(int id, int userId, UpdateTravelPlanDto dto)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);

        using (var tx = _stateManager.CreateTransaction())
        {
            var result = await travelPlansDict.TryGetValueAsync(tx, id);
            if (!result.HasValue || result.Value.UserId != userId)
                throw new KeyNotFoundException("Travel plan not found.");

            var plan = result.Value;

            if (dto.Name != null) plan.Name = dto.Name;
            if (dto.Description != null) plan.Description = dto.Description;
            if (dto.Notes != null) plan.Notes = dto.Notes;
            if (dto.StartDate.HasValue) plan.StartDate = dto.StartDate.Value;
            if (dto.EndDate.HasValue) plan.EndDate = dto.EndDate.Value;
            if (dto.Budget.HasValue)
            {
                if (dto.Budget < 0) throw new ArgumentException("Budget cannot be negative.");
                plan.Budget = dto.Budget.Value;
            }

            if (plan.EndDate < plan.StartDate)
                throw new ArgumentException("End date cannot be before start date.");

            plan.UpdatedAt = DateTime.UtcNow;

            await travelPlansDict.SetAsync(tx, id, plan);
            await tx.CommitAsync();

            return _mapper.Map<TravelPlanDto>(plan);
        }
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);

        using (var tx = _stateManager.CreateTransaction())
        {
            var result = await travelPlansDict.TryGetValueAsync(tx, id);
            if (!result.HasValue || result.Value.UserId != userId)
                throw new KeyNotFoundException("Travel plan not found.");

            await travelPlansDict.TryRemoveAsync(tx, id);
            await tx.CommitAsync();
        }
    }

    public async Task<TravelPlanDetailDto?> GetByShareTokenAsync(string token)
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
                    var activeToken = plan.ShareTokens.FirstOrDefault(s => s.Token == token && (s.ExpiresAt == null || s.ExpiresAt > DateTime.UtcNow));
                    if (activeToken != null) return _mapper.Map<TravelPlanDetailDto>(plan);
                }
            }
        }
        return null;
    }
}