using Secretaria.Api.DTOs.Perfis;

namespace Secretaria.Api.Repositories.Interfaces;

public interface IPerfilAcessoRepository
{
    Task<IEnumerable<PerfilAcessoResponse>> GetAllAsync();
    Task<PerfilAcessoResponse?> GetByIdAsync(int id);
    Task<int> CreateAsync(PerfilAcessoRequest request, string? criadoPor = null);
    Task<bool> UpdateAsync(int id, PerfilAcessoRequest request, string? alteradoPor = null);
    Task<bool> DeleteAsync(int id);
}
