using System.Fabric;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using UserService.Data;
using UserService.Services;

namespace UserService;

internal sealed class UserService : StatelessService
{
    public UserService(StatelessServiceContext context) : base(context) { }

    protected override IEnumerable<ServiceInstanceListener> CreateServiceInstanceListeners()
    {
        return new[]
        {
            new ServiceInstanceListener(serviceContext =>
                new KestrelCommunicationListener(serviceContext, "ServiceEndpoint",
                    (url, listener) =>
                    {
                        var builder = WebApplication.CreateBuilder();
  
                        // DbContext
                        builder.Services.AddDbContext<AppDbContext>(options =>
                        options.UseSqlServer(
                            builder.Configuration.GetConnectionString("DefaultConnection"),
                            sqlOptions => sqlOptions.EnableRetryOnFailure(
                                maxRetryCount: 5,
                                maxRetryDelay: TimeSpan.FromSeconds(10),
                                errorNumbersToAdd: null)));
                                            // JWT
                        var jwtConfig = builder.Configuration.GetSection("Jwt");
                        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                            .AddJwtBearer(options =>
                            {
                                options.TokenValidationParameters = new TokenValidationParameters
                                {
                                    ValidateIssuerSigningKey = true,
                                    IssuerSigningKey = new SymmetricSecurityKey(
                                        Encoding.UTF8.GetBytes(jwtConfig["Secret"]!)),
                                    ValidateIssuer = true,
                                    ValidIssuer = jwtConfig["Issuer"],
                                    ValidateAudience = true,
                                    ValidAudience = jwtConfig["Audience"],
                                    ValidateLifetime = true,
                                    ClockSkew = TimeSpan.Zero
                                };
                            });
                        builder.Services.AddAuthorization();

                        // Servisi
                        builder.Services.AddScoped<IJwtService, JwtService>();
                        builder.Services.AddScoped<IAuthService, AuthService>();
                        builder.Services.AddScoped<IUserService, UserManagementService>();
                        builder.Services.AddAutoMapper(typeof(MappingProfile));

                        // CORS
                        builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
                            p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

                        // Swagger
                        builder.Services.AddControllers();
                        builder.Services.AddEndpointsApiExplorer();
                        builder.Services.AddSwaggerGen(c =>
                        {
                            c.SwaggerDoc("v1", new OpenApiInfo
                            {
                                Title = "UserService API",
                                Version = "v1"
                            });
                            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                            {
                                Type = SecuritySchemeType.Http,
                                Scheme = "bearer",
                                BearerFormat = "JWT"
                            });
                            c.AddSecurityRequirement(new OpenApiSecurityRequirement
                            {
                                {
                                    new OpenApiSecurityScheme
                                    {
                                        Reference = new OpenApiReference
                                        {
                                            Type = ReferenceType.SecurityScheme,
                                            Id = "Bearer"
                                        }
                                    },
                                    Array.Empty<string>()
                                }
                            });
                        });

                        // SF Kestrel
                        builder.WebHost
                            .UseKestrel()
                            .UseServiceFabricIntegration(listener,
                                ServiceFabricIntegrationOptions.None)
                            .UseUrls(url);

                        var app = builder.Build();

                   

                        // Pipeline
                        app.UseSwagger();
                        app.UseSwaggerUI();
                        app.UseCors();
                        app.UseAuthentication();
                        app.UseAuthorization();
                        app.MapControllers();

                        return app;
                    }))
        };
    }
}