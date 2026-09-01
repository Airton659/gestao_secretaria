using Secretaria.Api.Data;
using Secretaria.Api.Repositories;
using Secretaria.Api.Repositories.Interfaces;
using Secretaria.Api.Services;

namespace Secretaria.Api.Configuration;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddSingleton<DbConnectionFactory>();
        services.AddSingleton<IDbConnectionFactory>(sp => sp.GetRequiredService<DbConnectionFactory>());

        services.AddSingleton<DbCorpConnectionFactory>();
        services.AddSingleton<IDbCorpConnectionFactory>(sp => sp.GetRequiredService<DbCorpConnectionFactory>());

        services.AddScoped<IPerfilAcessoRepository, PerfilAcessoRepository>();
        services.AddScoped<IUsuarioPerfilRepository, UsuarioPerfilRepository>();
        services.AddScoped<ISubturmasRepository, SubturmasRepository>();
        services.AddScoped<IIndicadoresRepository, IndicadoresRepository>();
        services.AddScoped<IPermissaoService, PermissaoService>();

        return services;
    }
}
