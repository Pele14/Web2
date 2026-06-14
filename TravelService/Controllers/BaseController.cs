using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace TravelService.Controllers;

public abstract class BaseController : ControllerBase
{
    protected int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("userId")
            ?? throw new UnauthorizedAccessException());
}