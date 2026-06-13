using Microsoft.ServiceFabric.Services.Runtime;

internal static class Program
{
    private static void Main()
    {
        ServiceRuntime.RegisterServiceAsync(
            "UserServiceType",
            context => new UserService.UserService(context)
        ).GetAwaiter().GetResult();

        Thread.Sleep(Timeout.Infinite);
    }
}