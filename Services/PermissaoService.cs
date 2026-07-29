using System.Text.Json;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Services;

public class PermissaoService : IPermissaoService
{
    private readonly IUsuarioPerfilRepository _usuarioPerfilRepo;
    private readonly IPerfilAcessoRepository  _perfilAcessoRepo;

    public PermissaoService(IUsuarioPerfilRepository u, IPerfilAcessoRepository p)
    {
        _usuarioPerfilRepo = u;
        _perfilAcessoRepo  = p;
    }

    public async Task<bool> TemPermissaoAsync(string username, string modulo, string action)
    {
        if (string.IsNullOrWhiteSpace(username)) return false;

        var vinculos = await _usuarioPerfilRepo.GetByLoginAdAsync(username);
        var vinculo  = vinculos.FirstOrDefault();
        if (vinculo == null) return false;

        var perfil = await _perfilAcessoRepo.GetByIdAsync(vinculo.PerfilAcessoId);
        if (perfil == null) return false;

        // Admin bypassa tudo
        if (perfil.Nome.Equals("Admin", StringComparison.OrdinalIgnoreCase)) return true;

        try
        {
            var perms = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(perfil.Permissoes)
                        ?? [];
            return perms.TryGetValue(modulo, out var actions) && actions.Contains(action);
        }
        catch { return false; }
    }
}
