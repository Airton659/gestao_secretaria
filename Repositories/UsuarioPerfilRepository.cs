using Dapper;
using Secretaria.Api.Data;
using Secretaria.Api.DTOs.Perfis;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Repositories;

// OdbcConnection não suporta @param nomeado — usa ? posicional + DynamicParameters em ordem
public class UsuarioPerfilRepository : IUsuarioPerfilRepository
{
    private readonly IDbConnectionFactory _factory;

    public UsuarioPerfilRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<UsuarioPerfilResponse>> GetByPerfilAsync(int perfilId)
    {
        const string sql = """
            SELECT up.Id, up.LoginAd, up.PerfilAcessoId, pa.Nome AS PerfilNome,
                   up.CreatedAt, up.UpdatedAt, up.CriadoPor, up.AlteradoPor
            FROM UsuariosPerfil up
            INNER JOIN PerfisAcesso pa ON pa.Id = up.PerfilAcessoId
            WHERE up.PerfilAcessoId = ?
            ORDER BY up.LoginAd
            """;

        var p = new DynamicParameters();
        p.Add("PerfilAcessoId", perfilId);

        using var conn = _factory.Create();
        return await conn.QueryAsync<UsuarioPerfilResponse>(sql, p);
    }

    public async Task<IEnumerable<UsuarioPerfilResponse>> GetByLoginAdAsync(string loginAd)
    {
        const string sql = """
            SELECT up.Id, up.LoginAd, up.PerfilAcessoId, pa.Nome AS PerfilNome,
                   up.CreatedAt, up.UpdatedAt, up.CriadoPor, up.AlteradoPor
            FROM UsuariosPerfil up
            INNER JOIN PerfisAcesso pa ON pa.Id = up.PerfilAcessoId
            WHERE up.LoginAd = ?
            ORDER BY pa.Nome
            """;

        var p = new DynamicParameters();
        p.Add("LoginAd", loginAd);

        using var conn = _factory.Create();
        return await conn.QueryAsync<UsuarioPerfilResponse>(sql, p);
    }

    public async Task<int> CreateAsync(int perfilId, UsuarioPerfilRequest request, string? criadoPor = null)
    {
        const string sql = """
            INSERT INTO UsuariosPerfil (LoginAd, PerfilAcessoId, CreatedAt, UpdatedAt, CriadoPor, AlteradoPor)
            VALUES (?, ?, ?, ?, ?, ?);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """;

        var now = DateTime.Now;
        var p = new DynamicParameters();
        p.Add("LoginAd",        request.LoginAd);
        p.Add("PerfilAcessoId", perfilId);
        p.Add("CreatedAt",      now);
        p.Add("UpdatedAt",      now);
        p.Add("CriadoPor",      criadoPor);
        p.Add("AlteradoPor",    (string?)null);

        using var conn = _factory.Create();
        return await conn.ExecuteScalarAsync<int>(sql, p);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM UsuariosPerfil WHERE Id = ?";

        var p = new DynamicParameters();
        p.Add("Id", id);

        using var conn = _factory.Create();
        var rows = await conn.ExecuteAsync(sql, p);
        return rows > 0;
    }
}
