using System;
using System.Collections.Generic;
using System.Fabric;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.ServiceFabric.Services.Communication.AspNetCore;
using Microsoft.ServiceFabric.Services.Communication.Runtime;
using Microsoft.ServiceFabric.Services.Runtime;
using Microsoft.ServiceFabric.Data;
using TravelService.Services;     // Osigurava pristup tvojim servisima i MappingProfile-u
using TravelService.Middleware;
using ExpenseService;   // Osigurava pristup ShareTokenMiddleware-u

namespace TravelService
{
    /// <summary>
    /// FabricRuntime kreira instancu ove klase za svaku instancu tipa servisa.
    /// </summary>
    internal sealed class TravelService : StatefulService
    {
        public TravelService(StatefulServiceContext context)
            : base(context)
        { }

        /// <summary>
        /// Opciono pregaženo za kreiranje slušalaca (poput tcp, http) za ovu instancu servisa.
        /// </summary>
        /// <returns>Kolekcija slušalaca.</returns>
        protected override IEnumerable<ServiceReplicaListener> CreateServiceReplicaListeners()
        {
            return new ServiceReplicaListener[]
            {
        // 1. Ovde obavezno prosledi naziv "ServiceEndpoint"
        new ServiceReplicaListener(serviceContext =>
            new KestrelCommunicationListener(serviceContext, "ServiceEndpoint", (url, listener) =>
            {
                ServiceEventSource.Current.ServiceMessage(serviceContext, $"Starting Kestrel on {url}");

                var builder = WebApplication.CreateBuilder();

                builder.Services
                    .AddSingleton<StatefulServiceContext>(serviceContext)
                    .AddSingleton<IReliableStateManager>(this.StateManager);

                builder.Services.AddScoped<ITravelPlanService, TravelPlanService>();
                builder.Services.AddScoped<IDestinationService, DestinationService>();
                builder.Services.AddScoped<IActivityService, ActivityService>();
                builder.Services.AddScoped<IChecklistService, ChecklistService>();
                builder.Services.AddScoped<IShareService, ShareService>();
                builder.Services.AddAutoMapper(typeof(MappingProfile));

                builder.WebHost
                    .UseKestrel()
                    .UseContentRoot(Directory.GetCurrentDirectory())
                    // 2. PROMENI UseUniqueServiceUrl U None
                    .UseServiceFabricIntegration(listener, ServiceFabricIntegrationOptions.None)
                    .UseUrls(url);

                builder.Services.AddControllers();
                builder.Services.AddEndpointsApiExplorer();
                builder.Services.AddSwaggerGen();

                var app = builder.Build();

                if (app.Environment.IsDevelopment())
                {
                    app.UseSwagger();
                    app.UseSwaggerUI();
                }

                app.UseMiddleware<ShareTokenMiddleware>();
                app.UseAuthorization();
                app.MapControllers();

                return app;
            }))
            };
        }
    }
}