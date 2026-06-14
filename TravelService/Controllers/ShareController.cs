using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TravelService.DTOs;
using TravelService.Services;

namespace TravelService.Controllers;

[ApiController]
[Route("api/travel-plans/{planId:int}/share-tokens")]
[Authorize]
public class ShareController : BaseController
{
    private readonly IShareService _service;
    private readonly IConfiguration _config;

    public ShareController(IShareService service, IConfiguration config)
    {
        _service = service;
        _config = config;
    }

    private string GetBaseUrl() =>
        _config["FrontendBaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";

    [HttpGet]
    public async Task<IActionResult> GetAll(int planId)
    {
        try
        {
            var tokens = await _service.GetShareTokensAsync(planId, GetUserId(), GetBaseUrl());
            return Ok(tokens);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<IActionResult> Create(int planId, [FromBody] CreateShareTokenDto dto)
    {
        try
        {
            var result = await _service.CreateShareTokenAsync(planId, GetUserId(), dto, GetBaseUrl());
            return Ok(result);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{tokenId:int}")]
    public async Task<IActionResult> Delete(int planId, int tokenId)
    {
        try
        {
            await _service.DeleteShareTokenAsync(tokenId, planId, GetUserId());
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}