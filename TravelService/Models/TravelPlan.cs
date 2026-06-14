using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace TravelService.Models;

[DataContract]
public class TravelPlan
{
    [DataMember]
    public int Id { get; set; }

    [DataMember]
    public int UserId { get; set; }

    [DataMember]
    public string Name { get; set; } = string.Empty;

    [DataMember]
    public string? Description { get; set; }

    [DataMember]
    public DateTime StartDate { get; set; }

    [DataMember]
    public DateTime EndDate { get; set; }

    [DataMember]
    public decimal Budget { get; set; }

    [DataMember]
    public string? Notes { get; set; }

    [DataMember]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [DataMember]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // U čistom Stateful pristupu, sve povezane tabele postaju kolekcije unutar agregata
    [DataMember]
    public ICollection<Destination> Destinations { get; set; } = new List<Destination>();

    [DataMember]
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();

    [DataMember]
    public ICollection<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();

    [DataMember]
    public ICollection<ShareToken> ShareTokens { get; set; } = new List<ShareToken>();
}
[DataContract]
public class Destination
{
    [DataMember]
    public int Id { get; set; }

    [DataMember]
    public int TravelPlanId { get; set; }

    [DataMember]
    public string Name { get; set; } = string.Empty;

    [DataMember]
    public string? Location { get; set; }

    [DataMember]
    public DateTime ArrivalDate { get; set; }

    [DataMember]
    public DateTime DepartureDate { get; set; }

    [DataMember]
    public string? Description { get; set; }

    [DataMember]
    public string? Notes { get; set; }

    [DataMember]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [DataMember]
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
[DataContract]
public class Activity
{
    [DataMember]
    public int Id { get; set; }

    [DataMember]
    public int TravelPlanId { get; set; }

    [DataMember]
    public int? DestinationId { get; set; }

    [DataMember]
    public string Name { get; set; } = string.Empty;

    [DataMember]
    public DateTime Date { get; set; }

    [DataMember]
    public TimeSpan? Time { get; set; }

    [DataMember]
    public string? Location { get; set; }

    [DataMember]
    public string? Description { get; set; }

    [DataMember]
    public decimal? EstimatedCost { get; set; }

    [DataMember]
    public ActivityStatus Status { get; set; } = ActivityStatus.Planned;

    [DataMember]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[DataContract]
public enum ActivityStatus
{
    [EnumMember] Planned = 0,
    [EnumMember] Reserved = 1,
    [EnumMember] Completed = 2,
    [EnumMember] Cancelled = 3
}

[DataContract]
public class ChecklistItem
{
    [DataMember]
    public int Id { get; set; }

    [DataMember]
    public int TravelPlanId { get; set; }

    [DataMember]
    public string Name { get; set; } = string.Empty;

    [DataMember]
    public bool IsCompleted { get; set; } = false;

    [DataMember]
    public int Order { get; set; } = 0;

    [DataMember]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[DataContract]
public class ShareToken
{
    [DataMember]
    public int Id { get; set; }

    [DataMember]
    public int TravelPlanId { get; set; }

    [DataMember]
    public string Token { get; set; } = string.Empty;

    [DataMember]
    public ShareAccessType AccessType { get; set; }

    [DataMember]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [DataMember]
    public DateTime? ExpiresAt { get; set; }
}

[DataContract]
public enum ShareAccessType
{
    [EnumMember] View = 0,
    [EnumMember] Edit = 1
}