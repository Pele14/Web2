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

public interface IChecklistService
{
    Task<IEnumerable<ChecklistItemDto>> GetAllAsync(int planId, int userId);
    Task<ChecklistItemDto> CreateAsync(int planId, int userId, CreateChecklistItemDto dto);
    Task<ChecklistItemDto> UpdateAsync(int id, int planId, int userId, UpdateChecklistItemDto dto);
    Task DeleteAsync(int id, int planId, int userId);
}

public class ChecklistService : IChecklistService
{
    private readonly IReliableStateManager _stateManager;
    private readonly IMapper _mapper;
    private const string DictionaryName = "travelPlansDictionary";

    public ChecklistService(IReliableStateManager stateManager, IMapper mapper)
    {
        _stateManager = stateManager;
        _mapper = mapper;
    }

    private async Task<TravelPlan> GetPlanOrThrowAsync(ITransaction tx, IReliableDictionary<int, TravelPlan> dict, int planId, int userId)
    {
        var result = await dict.TryGetValueAsync(tx, planId);
        if (!result.HasValue || result.Value.UserId != userId)
            throw new KeyNotFoundException("Travel plan not found.");
        return result.Value;
    }

    public async Task<IEnumerable<ChecklistItemDto>> GetAllAsync(int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            return plan.ChecklistItems.OrderBy(c => c.Order).Select(c => _mapper.Map<ChecklistItemDto>(c)).ToList();
        }
    }

    public async Task<ChecklistItemDto> CreateAsync(int planId, int userId, CreateChecklistItemDto dto)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);

            var item = new ChecklistItem
            {
                Id = Guid.NewGuid().GetHashCode() & int.MaxValue,
                TravelPlanId = planId,
                Name = dto.Name,
                Order = dto.Order
            };

            plan.ChecklistItems.Add(item);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return _mapper.Map<ChecklistItemDto>(item);
        }
    }

    public async Task<ChecklistItemDto> UpdateAsync(int id, int planId, int userId, UpdateChecklistItemDto dto)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var item = plan.ChecklistItems.FirstOrDefault(c => c.Id == id)
                ?? throw new KeyNotFoundException("Checklist item not found.");

            if (dto.Name != null) item.Name = dto.Name;
            if (dto.IsCompleted.HasValue) item.IsCompleted = dto.IsCompleted.Value;
            if (dto.Order.HasValue) item.Order = dto.Order.Value;

            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return _mapper.Map<ChecklistItemDto>(item);
        }
    }

    public async Task DeleteAsync(int id, int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var item = plan.ChecklistItems.FirstOrDefault(c => c.Id == id)
                ?? throw new KeyNotFoundException("Checklist item not found.");

            plan.ChecklistItems.Remove(item);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();
        }
    }
}