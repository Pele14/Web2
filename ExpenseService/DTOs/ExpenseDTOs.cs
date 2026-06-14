using System;
using System.Collections.Generic;

namespace ExpenseService.DTOs;

public class ExpenseDto
{
    public int Id { get; set; }
    public int TravelPlanId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateExpenseDto
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Description { get; set; }
}

public class UpdateExpenseDto
{
    public string? Name { get; set; }
    public string? Category { get; set; }
    public decimal? Amount { get; set; }
    public DateTime? Date { get; set; }
    public string? Description { get; set; }
}

public class BudgetSummaryDto
{
    public int TravelPlanId { get; set; }
    public decimal TotalExpenses { get; set; }
    public Dictionary<string, decimal> ByCategory { get; set; } = new();
    public IEnumerable<ExpenseDto> Expenses { get; set; } = new List<ExpenseDto>();
}