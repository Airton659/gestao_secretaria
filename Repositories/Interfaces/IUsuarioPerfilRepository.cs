using Secretaria.Api.DTOs.Perfis;

namespace Secretaria.Api.Repositories.Interfaces;

public interface IUsuarioPerfilRepository
{
    Task<IEnumerable<UsuarioPerfilResponse>> GetByPerfilAsync(int perfilId);
    Task<IEnumerable<UsuarioPerfilResponse>> GetByLoginAdAsync(string loginAd);
    Task<int> CreateAsync(int perfilId, UsuarioPerfilRequest request, string? criadoPor = null);
    Task<bool> DeleteAsync(int id);
}
