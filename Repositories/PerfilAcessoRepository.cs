using Dapper;
using Secretaria.Api.Data;
using Secretaria.Api.DTOs.Perfis;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Repositories;

// OdbcConnection não suporta @param nomeado — usa ? posicional + DynamicParameters em ordem
public class PerfilAcessoRepository : IPerfilAcessoRepository
{
    private readonly IDbConnectionFactory _factory;

    public PerfilAcessoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<PerfilAcessoResponse>> GetAllAsync()
    {
        const string sql = """
            SELECT Id, Nome, Permissoes, CreatedAt, UpdatedAt, CriadoPor, AlteradoPor
            FROM PerfisAcesso
            ORDER BY Nome
            """;

        using var conn = _factory.Create();
        return await conn.QueryAsync<PerfilAcessoResponse>(sql);
    }

    public async Task<PerfilAcessoResponse?> GetByIdAsync(int id)
    {
        const string sql = """
            SELECT Id, Nome, Permissoes, CreatedAt, UpdatedAt, CriadoPor, AlteradoPor
            FROM PerfisAcesso
            WHERE Id = ?
            """;

        var p = new DynamicParameters();
        p.Add("Id", id);

        using var conn = _factory.Create();
        return await conn.QuerySingleOrDefaultAsync<PerfilAcessoResponse>(sql, p);
    }

    public async Task<int> CreateAsync(PerfilAcessoRequest request, string? criadoPor = null)
    {
        const string sql = """
            INSERT INTO PerfisAcesso (Nome, Permissoes, CreatedAt, UpdatedAt, CriadoPor, AlteradoPor)
            VALUES (?, ?, ?, ?, ?, ?);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """;

        var now = DateTime.Now;
        var p = new DynamicParameters();
        p.Add("Nome",       request.Nome);
        p.Add("Permissoes", request.Permissoes);
        p.Add("CreatedAt",  now);
        p.Add("UpdatedAt",  now);
        p.Add("CriadoPor",  criadoPor);
        p.Add("AlteradoPor",(string?)null);

        using var conn = _factory.Create();
        return await conn.ExecuteScalarAsync<int>(sql, p);
    }

    public async Task<bool> UpdateAsync(int id, PerfilAcessoRequest request, string? alteradoPor = null)
    {
        const string sql = """
            UPDATE PerfisAcesso
            SET Nome = ?, Permissoes = ?, UpdatedAt = ?, AlteradoPor = ?
            WHERE Id = ?
            """;

        var p = new DynamicParameters();
        p.Add("Nome",       request.Nome);
        p.Add("Permissoes", request.Permissoes);
        p.Add("UpdatedAt",  DateTime.Now);
        p.Add("AlteradoPor",alteradoPor);
        p.Add("Id",         id);

        using var conn = _factory.Create();
        var rows = await conn.ExecuteAsync(sql, p);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        const string sql = "DELETE FROM PerfisAcesso WHERE Id = ?";

        var p = new DynamicParameters();
        p.Add("Id", id);

        using var conn = _factory.Create();
        var rows = await conn.ExecuteAsync(sql, p);
        return rows > 0;
    }
}
