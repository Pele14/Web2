using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TravelService.DTOs;
using TravelService.Services;

namespace TravelService.Controllers;

[ApiController]
[Route("api/travel-plans")]
[Authorize]
public class TravelPlansController : BaseController
{
    private readonly ITravelPlanService _service;

    public TravelPlansController(ITravelPlanService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllForUserAsync(GetUserId()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await _service.GetByIdAsync(id, GetUserId());
        return plan == null ? NotFound() : Ok(plan);
    }

    [HttpGet("shared/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByShareToken(string token)
    {
        var plan = await _service.GetByShareTokenAsync(token);
        return plan == null ? NotFound(new { message = "Invalid or expired share link." }) : Ok(plan);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTravelPlanDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(GetUserId(), dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTravelPlanDto dto)
    {
        try
        {
            var result = await _service.UpdateAsync(id, GetUserId(), dto);
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(id, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}