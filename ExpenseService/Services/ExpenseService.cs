using AutoMapper;
using ExpenseService.Data;
using ExpenseService.DTOs;
using ExpenseService.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ExpenseService.Services;

public interface IExpenseService
{
    Task<BudgetSummaryDto> GetSummaryAsync(int planId, int userId);
    Task<IEnumerable<ExpenseDto>> GetAllAsync(int planId, int userId);
    Task<ExpenseDto?> GetByIdAsync(int id, int planId, int userId);
    Task<ExpenseDto> CreateAsync(int planId, int userId, CreateExpenseDto dto);
    Task<ExpenseDto> UpdateAsync(int id, int planId, int userId, UpdateExpenseDto dto);
    Task DeleteAsync(int id, int planId, int userId);
}

public class ExpenseManagementService : IExpenseService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public ExpenseManagementService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<BudgetSummaryDto> GetSummaryAsync(int planId, int userId)
    {
        var expenses = await _db.Expenses
            .Where(e => e.TravelPlanId == planId && e.UserId == userId)
            .ToListAsync();

        return new BudgetSummaryDto
        {
            TravelPlanId = planId,
            TotalExpenses = expenses.Sum(e => e.Amount),
            ByCategory = expenses.GroupBy(e => e.Category.ToString())
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount)),
            Expenses = expenses.Select(e => _mapper.Map<ExpenseDto>(e))
        };
    }

    public async Task<IEnumerable<ExpenseDto>> GetAllAsync(int planId, int userId) =>
        await _db.Expenses.Where(e => e.TravelPlanId == planId && e.UserId == userId)
            .OrderByDescending(e => e.Date)
            .Select(e => _mapper.Map<ExpenseDto>(e)).ToListAsync();

    public async Task<ExpenseDto?> GetByIdAsync(int id, int planId, int userId)
    {
        var exp = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.TravelPlanId == planId && e.UserId == userId);
        return exp == null ? null : _mapper.Map<ExpenseDto>(exp);
    }

    public async Task<ExpenseDto> CreateAsync(int planId, int userId, CreateExpenseDto dto)
    {
        if (dto.Amount <= 0) throw new ArgumentException("Amount must be positive.");

        var expense = new Expense
        {
            TravelPlanId = planId,
            UserId = userId,
            Name = dto.Name,
            Category = Enum.TryParse<ExpenseCategory>(dto.Category, true, out var cat) ? cat : ExpenseCategory.Other,
            Amount = dto.Amount,
            Date = dto.Date,
            Description = dto.Description
        };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();
        return _mapper.Map<ExpenseDto>(expense);
    }

    public async Task<ExpenseDto> UpdateAsync(int id, int planId, int userId, UpdateExpenseDto dto)
    {
        var exp = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.TravelPlanId == planId && e.UserId == userId)
            ?? throw new KeyNotFoundException("Expense not found.");

        if (dto.Name != null) exp.Name = dto.Name;
        if (dto.Description != null) exp.Description = dto.Description;
        if (dto.Date.HasValue) exp.Date = dto.Date.Value;
        if (dto.Amount.HasValue)
        {
            if (dto.Amount <= 0) throw new ArgumentException("Amount must be positive.");
            exp.Amount = dto.Amount.Value;
        }
        if (!string.IsNullOrWhiteSpace(dto.Category) && Enum.TryParse<ExpenseCategory>(dto.Category, true, out var cat))
            exp.Category = cat;

        await _db.SaveChangesAsync();
        return _mapper.Map<ExpenseDto>(exp);
    }

    public async Task DeleteAsync(int id, int planId, int userId)
    {
        var exp = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.TravelPlanId == planId && e.UserId == userId)
            ?? throw new KeyNotFoundException("Expense not found.");
        _db.Expenses.Remove(exp);
        await _db.SaveChangesAsync();
    }
}