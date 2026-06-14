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

public interface IDestinationService
{
    Task<IEnumerable<DestinationDto>> GetAllAsync(int planId, int userId);
    Task<DestinationDto?> GetByIdAsync(int id, int planId, int userId);
    Task<DestinationDto> CreateAsync(int planId, int userId, CreateDestinationDto dto);
    Task<DestinationDto> UpdateAsync(int id, int planId, int userId, UpdateDestinationDto dto);
    Task DeleteAsync(int id, int planId, int userId);
}

public class DestinationService : IDestinationService
{
    private readonly IReliableStateManager _stateManager;
    private readonly IMapper _mapper;
    private const string DictionaryName = "travelPlansDictionary";

    public DestinationService(IReliableStateManager stateManager, IMapper mapper)
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

    public async Task<IEnumerable<DestinationDto>> GetAllAsync(int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            return plan.Destinations.Select(d => _mapper.Map<DestinationDto>(d)).ToList();
        }
    }

    public async Task<DestinationDto?> GetByIdAsync(int id, int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var dest = plan.Destinations.FirstOrDefault(d => d.Id == id);
            return dest == null ? null : _mapper.Map<DestinationDto>(dest);
        }
    }

    public async Task<DestinationDto> CreateAsync(int planId, int userId, CreateDestinationDto dto)
    {
        if (dto.DepartureDate < dto.ArrivalDate)
            throw new ArgumentException("Departure date cannot be before arrival date.");

        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);

            var dest = _mapper.Map<Destination>(dto);
            dest.TravelPlanId = planId;
            dest.Id = Guid.NewGuid().GetHashCode() & int.MaxValue;

            plan.Destinations.Add(dest);
            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return _mapper.Map<DestinationDto>(dest);
        }
    }

    public async Task<DestinationDto> UpdateAsync(int id, int planId, int userId, UpdateDestinationDto dto)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var dest = plan.Destinations.FirstOrDefault(d => d.Id == id)
                ?? throw new KeyNotFoundException("Destination not found.");

            if (dto.Name != null) dest.Name = dto.Name;
            if (dto.Location != null) dest.Location = dto.Location;
            if (dto.Description != null) dest.Description = dto.Description;
            if (dto.Notes != null) dest.Notes = dto.Notes;
            if (dto.ArrivalDate.HasValue) dest.ArrivalDate = dto.ArrivalDate.Value;
            if (dto.DepartureDate.HasValue) dest.DepartureDate = dto.DepartureDate.Value;

            if (dest.DepartureDate < dest.ArrivalDate)
                throw new ArgumentException("Departure date cannot be before arrival date.");

            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();

            return _mapper.Map<DestinationDto>(dest);
        }
    }

    public async Task DeleteAsync(int id, int planId, int userId)
    {
        var travelPlansDict = await _stateManager.GetOrAddAsync<IReliableDictionary<int, TravelPlan>>(DictionaryName);
        using (var tx = _stateManager.CreateTransaction())
        {
            var plan = await GetPlanOrThrowAsync(tx, travelPlansDict, planId, userId);
            var dest = plan.Destinations.FirstOrDefault(d => d.Id == id)
                ?? throw new KeyNotFoundException("Destination not found.");

            plan.Destinations.Remove(dest);

            // Cascade Delete: Pošto se briše destinacija, očisti i DestinationId sa njenih aktivnosti
            foreach (var act in plan.Activities.Where(a => a.DestinationId == id))
            {
                act.DestinationId = null;
            }

            await travelPlansDict.SetAsync(tx, planId, plan);
            await tx.CommitAsync();
        }
    }
}