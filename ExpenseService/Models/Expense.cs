using System;

namespace ExpenseService.Models;

public class Expense
{
    public int Id { get; set; }
    public int TravelPlanId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ExpenseCategory
{
    Transport = 0,
    Accommodation = 1,
    Food = 2,
    Tickets = 3,
    Shopping = 4,
    Other = 5
}