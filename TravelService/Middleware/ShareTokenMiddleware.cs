using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Threading.Tasks;
using TravelService.Services;

namespace TravelService.Middleware;

/// <summary>
/// Middleware koji validira share tokene prosleđene kroz X-Share-Token header.
/// Ubacuje share kontekst (canEdit) u HttpContext.Items.
/// </summary>
public class ShareTokenMiddleware
{
    private readonly RequestDelegate _next;

    public ShareTokenMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, IShareService shareService)
    {
        var shareToken = context.Request.Headers["X-Share-Token"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(shareToken))
        {
            var (exists, canEdit) = await shareService.ValidateTokenAsync(shareToken);

            if (exists)
            {
                context.Items["ShareToken"] = shareToken;
                context.Items["ShareCanEdit"] = canEdit;
            }
        }

        await _next(context);
    }
}