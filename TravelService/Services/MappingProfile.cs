using AutoMapper;
using TravelService.DTOs;
using TravelService.Models;

namespace TravelService.Services;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── TravelPlan Mappings ──────────────────────────────────────────────────
        CreateMap<TravelPlan, TravelPlanDto>()
            .ForMember(d => d.DestinationCount, opt => opt.MapFrom(s => s.Destinations.Count))
            .ForMember(d => d.ActivityCount, opt => opt.MapFrom(s => s.Activities.Count));

        CreateMap<TravelPlan, TravelPlanDetailDto>()
            .ForMember(d => d.DestinationCount, opt => opt.MapFrom(s => s.Destinations.Count))
            .ForMember(d => d.ActivityCount, opt => opt.MapFrom(s => s.Activities.Count));

        CreateMap<CreateTravelPlanDto, TravelPlan>();

        // ── Destination Mappings ─────────────────────────────────────────────────
        CreateMap<Destination, DestinationDto>();
        CreateMap<CreateDestinationDto, Destination>();

        // ── Activity Mappings ────────────────────────────────────────────────────
        CreateMap<Activity, ActivityDto>()
            .ForMember(d => d.Time, opt => opt.MapFrom(s => s.Time.HasValue ? s.Time.Value.ToString(@"hh\:mm") : null))
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));

        // ── Checklist Mappings ───────────────────────────────────────────────────
        CreateMap<ChecklistItem, ChecklistItemDto>();

        // ── Share Token Mappings ─────────────────────────────────────────────────
        CreateMap<ShareToken, ShareTokenDto>()
            .ForMember(d => d.AccessType, opt => opt.MapFrom(s => s.AccessType.ToString()))
            .ForMember(d => d.ShareUrl, opt => opt.Ignore())       // Ovo se ručno mapira u servisu
            .ForMember(d => d.QrCodeBase64, opt => opt.Ignore());  // Ovo se takođe ručno mapira
    }
}