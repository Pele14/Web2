using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TravelService.DTOs;
using TravelService.Services;

namespace TravelService.Controllers;

[ApiController]
[Route("api/travel-plans/{planId:int}/checklist")]
[Authorize]
public class ChecklistController : BaseController
{
    private readonly IChecklistService _service;

    public ChecklistController(IChecklistService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(int planId)
    {
        try { return Ok(await _service.GetAllAsync(planId, GetUserId())); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(int planId, [FromBody] CreateChecklistItemDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(planId, GetUserId(), dto);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int planId, int id, [FromBody] UpdateChecklistItemDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(id, planId, GetUserId(), dto);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
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