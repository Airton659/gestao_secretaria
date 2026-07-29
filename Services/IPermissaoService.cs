namespace Secretaria.Api.Services;

public interface IPermissaoService
{
    /// <summary>
    /// Verifica se o usuário tem a permissão. Admin bypass automático.
    /// </summary>
    Task<bool> TemPermissaoAsync(string username, string modulo, string action);
}
