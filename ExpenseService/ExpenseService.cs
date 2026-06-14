using System;
using System.Collections.Generic;
using System.Fabric;
using System.IO;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using ExpenseService.Data;
using ExpenseService.Services;

namespace ExpenseService
{
    internal sealed class ExpenseService : StatelessService
    {
        public ExpenseService(StatelessServiceContext context)
            : base(context)
        { }

        protected override IEnumerable<ServiceInstanceListener> CreateServiceInstanceListeners()
        {
            return new ServiceInstanceListener[]
            {
                new ServiceInstanceListener(serviceContext =>
                    new KestrelCommunicationListener(serviceContext, "ServiceEndpoint", (url, listener) =>
                    {
                        var builder = WebApplication.CreateBuilder();

                        // 1. Registracija SF konteksta i baze podataka
                        builder.Services.AddSingleton<StatelessServiceContext>(serviceContext);
                        builder.Services.AddDbContext<AppDbContext>(options =>
                            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

                        // 2. JWT Autentikacija
                        var jwtConfig = builder.Configuration.GetSection("Jwt");
                        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                            .AddJwtBearer(options =>
                            {
                                options.TokenValidationParameters = new TokenValidationParameters
                                {
                                    ValidateIssuerSigningKey = true,
                                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["Secret"]!)),
                                    ValidateIssuer = true, ValidIssuer = jwtConfig["Issuer"],
                                    ValidateAudience = true, ValidAudience = jwtConfig["Audience"],
                                    ValidateLifetime = true, ClockSkew = TimeSpan.Zero
                                };
                            });

                        builder.Services.AddAuthorization();
                        builder.Services.AddScoped<IExpenseService, ExpenseManagementService>();
                        builder.Services.AddAutoMapper(typeof(MappingProfile));
                        builder.Services.AddControllers();
                        builder.Services.AddEndpointsApiExplorer();

                        // 3. Swagger sa ukljuèenim Bearer Token poljem
                        builder.Services.AddSwaggerGen(c =>
                        {
                            c.SwaggerDoc("v1", new OpenApiInfo { Title = "ExpenseService API", Version = "v1" });
                            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                            {
                                Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT"
                            });
                            c.AddSecurityRequirement(new OpenApiSecurityRequirement
                            {
                                { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
                            });
                        });

                        builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
                            p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

                        builder.WebHost
                            .UseKestrel()
                            .UseContentRoot(Directory.GetCurrentDirectory())
                            .UseServiceFabricIntegration(listener, ServiceFabricIntegrationOptions.None)
                            .UseUrls(url);

                        var app = builder.Build();

                        // 4. Izvršavanje SQL migracija pri pokretanju instance
                        using (var scope = app.Services.CreateScope())
                        {
                            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                            try
                            {
                                db.Database.EnsureCreated();

                                var migrationPath = Path.Combine(AppContext.BaseDirectory, "Migrations/001_CreateExpensesTable.sql");
                                if (File.Exists(migrationPath))
                                {
                                    var migrationScript = File.ReadAllText(migrationPath);
                                    var batches = System.Text.RegularExpressions.Regex.Split(
                                        migrationScript,
                                        @"^\s*GO\s*$",
                                        System.Text.RegularExpressions.RegexOptions.Multiline | System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                                    foreach (var batch in batches)
                                    {
                                        var trimmed = batch.Trim();
                                        if (!string.IsNullOrWhiteSpace(trimmed) && !trimmed.StartsWith("--"))
                                        {
                                            try { db.Database.ExecuteSqlRaw(trimmed); }
                                            catch { /* Ignoriši greške za idempotentne operacije */ }
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                ServiceEventSource.Current.ServiceMessage(serviceContext, $"Migration error: {ex.Message}");
                            }
                        }

                        if (app.Environment.IsDevelopment())
                        {
                            app.UseSwagger();
                            app.UseSwaggerUI();
                        }

                        app.UseCors();
                        app.UseAuthentication();
                        app.UseAuthorization();
                        app.MapControllers();

                        return app;
                    }))
            };
        }
    }
}