using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using ExpenseService.DTOs;
using ExpenseService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseService.Controllers;

[ApiController]
[Route("api/travel-plans/{planId:int}/expenses")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _service;
    public ExpensesController(IExpenseService service) => _service = service;

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("userId")
            ?? throw new UnauthorizedAccessException());

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(int planId)
    {
        var summary = await _service.GetSummaryAsync(planId, GetUserId());
        return Ok(summary);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int planId) =>
        Ok(await _service.GetAllAsync(planId, GetUserId()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int planId, int id)
    {
        var exp = await _service.GetByIdAsync(id, planId, GetUserId());
        return exp == null ? NotFound() : Ok(exp);
    }

    [HttpPost]
    public async Task<IActionResult> Create(int planId, [FromBody] CreateExpenseDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(planId, GetUserId(), dto);
            return CreatedAtAction(nameof(GetById), new { planId, id = result.Id }, result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int planId, int id, [FromBody] UpdateExpenseDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(id, planId, GetUserId(), dto);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int planId, int id)
    {
        try
        {
            await _service.DeleteAsync(id, planId, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}