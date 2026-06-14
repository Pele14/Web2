namespace TravelService.DTOs;

// ── TravelPlan ──────────────────────────────────────────────────────────────

public class TravelPlanDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal Budget { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int DestinationCount { get; set; }
    public int ActivityCount { get; set; }
}

public class TravelPlanDetailDto : TravelPlanDto
{
    public IEnumerable<DestinationDto> Destinations { get; set; } = new List<DestinationDto>();
    public IEnumerable<ActivityDto> Activities { get; set; } = new List<ActivityDto>();
    public IEnumerable<ChecklistItemDto> ChecklistItems { get; set; } = new List<ChecklistItemDto>();
}

public class CreateTravelPlanDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal Budget { get; set; }
    public string? Notes { get; set; }
}

public class UpdateTravelPlanDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Budget { get; set; }
    public string? Notes { get; set; }
}

// ── Destination ─────────────────────────────────────────────────────────────

public class DestinationDto
{
    public int Id { get; set; }
    public int TravelPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDestinationDto
{
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
}

public class UpdateDestinationDto
{
    public string? Name { get; set; }
    public string? Location { get; set; }
    public DateTime? ArrivalDate { get; set; }
    public DateTime? DepartureDate { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
}

// ── Activity ────────────────────────────────────────────────────────────────

public class ActivityDto
{
    public int Id { get; set; }
    public int TravelPlanId { get; set; }
    public int? DestinationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Time { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateActivityDto
{
    public int? DestinationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Time { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string Status { get; set; } = "Planned";
}

public class UpdateActivityDto
{
    public int? DestinationId { get; set; }
    public string? Name { get; set; }
    public DateTime? Date { get; set; }
    public string? Time { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Status { get; set; }
}

// ── Checklist ───────────────────────────────────────────────────────────────

public class ChecklistItemDto
{
    public int Id { get; set; }
    public int TravelPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateChecklistItemDto
{
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; } = 0;
}

public class UpdateChecklistItemDto
{
    public string? Name { get; set; }
    public bool? IsCompleted { get; set; }
    public int? Order { get; set; }
}

// ── Share ────────────────────────────────────────────────────────────────────

public class ShareTokenDto
{
    public int Id { get; set; }
    public int TravelPlanId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string AccessType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string ShareUrl { get; set; } = string.Empty;
    public string QrCodeBase64 { get; set; } = string.Empty;
}

public class CreateShareTokenDto
{
    public string AccessType { get; set; } = "View";
    public int? ExpiryDays { get; set; }
}
