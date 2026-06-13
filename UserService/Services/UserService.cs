using AutoMapper;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;

namespace UserService.Services;

public interface IAuthService
{
    Task<TokenResponseDto> RegisterAsync(RegisterDto dto);
    Task<TokenResponseDto> LoginAsync(LoginDto dto);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwt;
    private readonly IMapper _mapper;

    public AuthService(AppDbContext db, IJwtService jwt, IMapper mapper)
    {
        _db = db;
        _jwt = jwt;
        _mapper = mapper;
    }

    public async Task<TokenResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
            throw new InvalidOperationException("Email already in use.");

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.");

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.User
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwt.GenerateToken(user);
        return new TokenResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<TokenResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
        if (user == null)
            throw new UnauthorizedAccessException("Email nije registrovan.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Pogrešna lozinka.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated.");

        var token = _jwt.GenerateToken(user);
        return new TokenResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = _mapper.Map<UserDto>(user)
        };
    }
}

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, int requestingUserId);
    Task AdminUpdateAsync(int id, AdminUpdateUserDto dto);
    Task DeleteAsync(int id);
}

public class UserManagementService : IUserService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public UserManagementService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
        => await _db.Users.Select(u => _mapper.Map<UserDto>(u)).ToListAsync();

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _db.Users.FindAsync(id);
        return user == null ? null : _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, int requestingUserId)
    {
        if (id != requestingUserId) throw new UnauthorizedAccessException("Cannot update another user.");
        var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException("User not found.");

        if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var emailExists = await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower() && u.Id != id);
            if (emailExists) throw new InvalidOperationException("Email already in use.");
            user.Email = dto.Email.ToLower().Trim();
        }
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            if (dto.Password.Length < 6) throw new ArgumentException("Password must be at least 6 characters.");
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await _db.SaveChangesAsync();
        return _mapper.Map<UserDto>(user);
    }

    public async Task AdminUpdateAsync(int id, AdminUpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException("User not found.");
        if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email.ToLower().Trim();
        if (!string.IsNullOrWhiteSpace(dto.Role) && Enum.TryParse<UserRole>(dto.Role, true, out var role)) user.Role = role;
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException("User not found.");
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
    }
}
