using ExpenseService;
using Microsoft.ServiceFabric.Services.Runtime;
using System;
using System.Diagnostics;
using System.Threading;

namespace TravelService
{
    internal static class Program
    {
        /// <summary>
        /// Ovo je ulazna taèka procesa hosta servisa.
        /// </summary>
        private static void Main()
        {
            try
            {
                // Registracija servisa mapira ime tipa servisa iz ServiceManifest.xml na .NET tip.
                // Kada Service Fabric kreira instancu ovog tipa, instanca klase se kreira u ovom procesu.
                ServiceRuntime.RegisterServiceAsync("TravelServiceType",
                    context => new TravelService(context)).GetAwaiter().GetResult();

                ServiceEventSource.Current.ServiceTypeRegistered(Process.GetCurrentProcess().Id, typeof(TravelService).Name);

                // Spreèava gašenje procesa hosta kako bi servisi nastavili da rade.
                Thread.Sleep(Timeout.Infinite);
            }
            catch (Exception e)
            {
                ServiceEventSource.Current.ServiceHostInitializationFailed(e.ToString());
                throw;
            }
        }
    }
}