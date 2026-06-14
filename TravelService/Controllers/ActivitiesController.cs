using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TravelService.DTOs;
using TravelService.Services;

namespace TravelService.Controllers;

[ApiController]
[Route("api/travel-plans/{planId:int}/activities")]
[Authorize]
public class ActivitiesController : BaseController
{
    private readonly IActivityService _service;

    public ActivitiesController(IActivityService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(int planId)
    {
        try { return Ok(await _service.GetAllAsync(planId, GetUserId())); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int planId, int id)
    {
        try
        {
            var act = await _service.GetByIdAsync(id, planId, GetUserId());
            return act == null ? NotFound() : Ok(act);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(int planId, [FromBody] CreateActivityDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(planId, GetUserId(), dto);
            return CreatedAtAction(nameof(GetById), new { planId, id = result.Id }, result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int planId, int id, [FromBody] UpdateActivityDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(id, planId, GetUserId(), dto);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
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