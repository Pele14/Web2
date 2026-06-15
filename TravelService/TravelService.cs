using System;
using System.Collections.Generic;
using System.Fabric;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using Microsoft.ServiceFabric.Data;
using TravelService.Services;
using TravelService.Middleware;
using ExpenseService;

namespace TravelService
{
    internal sealed class TravelService : StatefulService
    {
        public TravelService(StatefulServiceContext context)
            : base(context)
        { }

        protected override IEnumerable<ServiceReplicaListener> CreateServiceReplicaListeners()
        {
            return new ServiceReplicaListener[]
            {
                new ServiceReplicaListener(serviceContext =>
                    new KestrelCommunicationListener(serviceContext, "ServiceEndpoint", (url, listener) =>
                    {
                        // Logujemo tačan port iz manifesta, ali Kestrelu eksplicitno zakucavamo localhost adresu
                        ServiceEventSource.Current.ServiceMessage(serviceContext, $"Starting Kestrel on http://localhost:5002");

                        var builder = WebApplication.CreateBuilder();

                        // ── JWT Authentication ───────────────────────────────────
                        var jwtConfig = builder.Configuration.GetSection("Jwt");
                        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                            .AddJwtBearer(options =>
                            {
                                options.TokenValidationParameters = new TokenValidationParameters
                                {
                                    ValidateIssuerSigningKey = true,
                                    IssuerSigningKey = new SymmetricSecurityKey(
                                        Encoding.UTF8.GetBytes(jwtConfig["Secret"] ?? "fallback-secret-key")),
                                    ValidateIssuer = true,
                                    ValidIssuer = jwtConfig["Issuer"],
                                    ValidateAudience = true,
                                    ValidAudience = jwtConfig["Audience"],
                                    ValidateLifetime = true,
                                    ClockSkew = TimeSpan.Zero
                                };
                            });
                        builder.Services.AddAuthorization();

                        // ── CORS (STRIKTNO I USKLAĐENO SA CREDENTIALS) ────────────
                        builder.Services.AddCors(options =>
                        {
                            options.AddDefaultPolicy(policy =>
                            {
                                policy
                                    .WithOrigins("http://localhost:5173") // Tvoj Vite port
                                    .AllowAnyMethod()
                                    .AllowAnyHeader()
                                    .AllowCredentials(); // Obavezno za prosleđivanje tokena kroz Axios
                            });
                        });

                        // ── Service Fabric StateManager ──────────────────────────
                        builder.Services
                            .AddSingleton<StatefulServiceContext>(serviceContext)
                            .AddSingleton<IReliableStateManager>(this.StateManager);

                        // ── Services DI ──────────────────────────────────────────
                        builder.Services.AddScoped<ITravelPlanService, TravelPlanService>();
                        builder.Services.AddScoped<IDestinationService, DestinationService>();
                        builder.Services.AddScoped<IActivityService, ActivityService>();
                        builder.Services.AddScoped<IChecklistService, ChecklistService>();
                        builder.Services.AddScoped<IShareService, ShareService>();
                        builder.Services.AddAutoMapper(typeof(MappingProfile));

                        // ── Controllers & Swagger ────────────────────────────────
                        builder.Services.AddControllers();
                        builder.Services.AddEndpointsApiExplorer();
                        builder.Services.AddSwaggerGen(c =>
                        {
                            c.SwaggerDoc("v1", new OpenApiInfo
                            {
                                Title = "TravelService API",
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

                        // ── Kestrel & Service Fabric Konfiguracija ───────────────
                        builder.WebHost
                            .UseKestrel()
                            .UseContentRoot(Directory.GetCurrentDirectory())
                            // 💡 KLJUČNA IZMENA: Menjamo UseUniqueServiceUrl u None da očistimo URL strukturu
                            .UseServiceFabricIntegration(listener, ServiceFabricIntegrationOptions.None)
                            // 💡 KLJUČNA IZMENA: Slušamo direktno na čistom localhostu i portu 5002
                            .UseUrls("http://localhost:5002");

                        var app = builder.Build();

                        // ── Middleware Pipeline (REDOSLED SADA RADI SAVRŠENO) ────
                        if (app.Environment.IsDevelopment())
                        {
                            app.UseSwagger();
                            app.UseSwaggerUI(c =>
                            {
                                c.SwaggerEndpoint("/swagger/v1/swagger.json", "TravelService API V1");
                            });
                        }

                        app.UseRouting();
                        app.UseCors(); // ← CORS mora biti odmah ispod UseRouting, a iznad svega ostalog

                        app.UseMiddleware<ShareTokenMiddleware>();
                        app.UseAuthentication();
                        app.UseAuthorization();
                        app.MapControllers();

                        return app;
                    }))
            };
        }

        protected override async Task RunAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromMinutes(5), cancellationToken);
            }
        }
    }
}