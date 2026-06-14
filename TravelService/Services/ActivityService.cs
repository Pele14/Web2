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

public interface IActivityService
{
    Task<IEnumerable<ActivityDto>> GetAllAsync(int planId, int userId);
    Task<ActivityDto?> GetByIdAsync(int id, int planId, int userId);
    Task<ActivityDto> CreateAsync(int planId, int userId, CreateActivityDto dto);
    Task<ActivityDto> UpdateAsync(int id, int planId, int userId, UpdateActivityDto dto);
    Task DeleteAsync(int id, int planId, int userId);
}

public class ActivityService : IActivityService
{
    private readonly IReliableStateManager _stateManager;
    private readonly IMapper _mapper;
    private const string DictionaryName = "travelPlansDictionary";

    public ActivityService(IReliableStateManager stateManager, IMapper mapper)
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

    public async Task<IEnumerable<ActivityDto>> GetAllAsync(int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            return plan.Activities
                .OrderBy(a => a.Date).ThenBy(a => a.Time)
                .Select(a => _mapper.Map<ActivityDto>(a)).ToList();
        }
    }

    public async Task<ActivityDto?> GetByIdAsync(int id, int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var act = plan.Activities.FirstOrDefault(a => a.Id == id);
            return act == null ? null : _mapper.Map<ActivityDto>(act);
        }
    }

    public async Task<ActivityDto> CreateAsync(int planId, int userId, CreateActivityDto dto)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);

            var act = new Activity
            {
                Id = Guid.NewGuid().GetHashCode() & int.MaxValue,
                TravelPlanId = planId,
                DestinationId = dto.DestinationId,
                Name = dto.Name,
                Date = dto.Date,
                Location = dto.Location,
                Description = dto.Description,
                EstimatedCost = dto.EstimatedCost,
                Status = Enum.TryParse<ActivityStatus>(dto.Status, true, out var status) ? status : ActivityStatus.Planned
            };

            if (!string.IsNullOrWhiteSpace(dto.Time) && TimeSpan.TryParse(dto.Time, out var time))
                act.Time = time;

            plan.Activities.Add(act);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return _mapper.Map<ActivityDto>(act);
        }
    }

    public async Task<ActivityDto> UpdateAsync(int id, int planId, int userId, UpdateActivityDto dto)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var act = plan.Activities.FirstOrDefault(a => a.Id == id)
                ?? throw new KeyNotFoundException("Activity not found.");

            if (act.Status == ActivityStatus.Completed)
                throw new InvalidOperationException("Completed activities cannot be edited.");

            if (dto.Name != null) act.Name = dto.Name;
            if (dto.Date.HasValue) act.Date = dto.Date.Value;
            if (dto.Location != null) act.Location = dto.Location;
            if (dto.Description != null) act.Description = dto.Description;
            if (dto.EstimatedCost.HasValue) act.EstimatedCost = dto.EstimatedCost;
            if (dto.DestinationId.HasValue) act.DestinationId = dto.DestinationId;
            if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<ActivityStatus>(dto.Status, true, out var status))
                act.Status = status;
            if (!string.IsNullOrWhiteSpace(dto.Time) && TimeSpan.TryParse(dto.Time, out var time))
                act.Time = time;

            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return _mapper.Map<ActivityDto>(act);
        }
    }

    public async Task DeleteAsync(int id, int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var act = plan.Activities.FirstOrDefault(a => a.Id == id)
                ?? throw new KeyNotFoundException("Activity not found.");

            plan.Activities.Remove(act);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();
        }
    }
}