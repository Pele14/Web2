using AutoMapper;
using ExpenseService.DTOs;
using ExpenseService.Models;

namespace ExpenseService.Services;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Expense, ExpenseDto>()
            .ForMember(d => d.Category, opt => opt.MapFrom(s => s.Category.ToString()));
    }
}