using Dapper;
using Secretaria.Api.Data;
using Secretaria.Api.DTOs.Indicadores;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Repositories;

// OdbcConnection não suporta @param nomeado — usa ? posicional + DynamicParameters em ordem
public class IndicadoresRepository : IIndicadoresRepository
{
    private readonly IDbCorpConnectionFactory _factory;

    public IndicadoresRepository(IDbCorpConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<NotaProvaResultDto>> GetNotasProvasAsync(NotaProvaFiltroRequest filtro)
    {
        const string sql = """
            SELECT
                P.NOME              AS NOME_ALUNO,
                M.RA,
                SPL.CODPERLET       AS PERIODO_LETIVO,
                TD.CODTURMA         AS TURMA,
                TD.CODDISC          AS CODIGO_DISCIPLINA,
                SDIS.NOME           AS NOME_DISCIPLINA,
                SE.DESCRICAO        AS ETAPA,
                N.TIPOETAPA,
                N.CODPROVA          AS PROVA,
                N.NOTA,
                N.CODCONCEITO,
                ST.DESCRICAO        AS STATUS_MATRICULA
            FROM SNOTAS N (NOLOCK)
            INNER JOIN SMATRICULA M (NOLOCK)
                    ON M.CODCOLIGADA = N.CODCOLIGADA
                   AND M.IDTURMADISC = N.IDTURMADISC
                   AND M.RA          = N.RA
            INNER JOIN STURMADISC TD (NOLOCK)
                    ON TD.CODCOLIGADA = N.CODCOLIGADA
                   AND TD.IDTURMADISC = N.IDTURMADISC
            INNER JOIN SPLETIVO SPL (NOLOCK)
                    ON SPL.CODCOLIGADA = TD.CODCOLIGADA
                   AND SPL.IDPERLET    = TD.IDPERLET
            INNER JOIN SALUNO A (NOLOCK)
                    ON A.CODCOLIGADA = M.CODCOLIGADA
                   AND A.RA          = M.RA
            INNER JOIN PPESSOA P (NOLOCK)
                    ON P.CODIGO = A.CODPESSOA
            INNER JOIN SDISCIPLINA SDIS (NOLOCK)
                    ON SDIS.CODCOLIGADA = TD.CODCOLIGADA
                   AND SDIS.CODDISC     = TD.CODDISC
            INNER JOIN SETAPAS SE (NOLOCK)
                    ON SE.CODCOLIGADA = N.CODCOLIGADA
                   AND SE.IDTURMADISC = N.IDTURMADISC
                   AND SE.CODETAPA    = N.CODETAPA
                   AND SE.TIPOETAPA   = N.TIPOETAPA
            INNER JOIN SSTATUS ST (NOLOCK)
                    ON ST.CODCOLIGADA  = M.CODCOLIGADA
                   AND ST.CODSTATUS    = M.CODSTATUS
                   AND ST.CODTIPOCURSO = TD.CODTIPOCURSO
            WHERE N.CODCOLIGADA = 1
              AND SPL.CODPERLET = ?
              AND M.RA          LIKE ?
              AND TD.CODTURMA   LIKE ?
            ORDER BY P.NOME, TD.CODDISC, N.CODETAPA, N.CODPROVA
            """;

        var p = new DynamicParameters();
        p.Add("p1", filtro.CodPerlet);
        p.Add("p2", string.IsNullOrWhiteSpace(filtro.Ra) ? "%" : filtro.Ra);
        p.Add("p3", string.IsNullOrWhiteSpace(filtro.CodTurma) ? "%" : filtro.CodTurma);

        using var conn = _factory.Create();
        return await conn.QueryAsync<NotaProvaResultDto>(sql, p);
    }

    public async Task<IEnumerable<NotaEtapaResultDto>> GetNotasEtapasAsync(NotaEtapaFiltroRequest filtro)
    {
        // Monta o WHERE dinâmico: TipoEtapa é opcional
        var sql = """
            SELECT
                P.NOME              AS NOME_ALUNO,
                M.RA,
                SPL.CODPERLET       AS PERIODO_LETIVO,
                TD.CODTURMA         AS TURMA,
                TD.CODDISC          AS CODIGO_DISCIPLINA,
                SDIS.NOME           AS NOME_DISCIPLINA,
                SE.DESCRICAO        AS ETAPA,
                NE.TIPOETAPA,
                COALESCE(NE.CODCONCEITO, CAST(NE.NOTAFALTA AS VARCHAR(20))) AS NOTA_ETAPA,
                SE.MEDIA            AS MEDIA_MINIMA,
                ST.DESCRICAO        AS STATUS_MATRICULA
            FROM SNOTAETAPA NE (NOLOCK)
            INNER JOIN SMATRICULA M (NOLOCK)
                    ON M.CODCOLIGADA = NE.CODCOLIGADA
                   AND M.IDTURMADISC = NE.IDTURMADISC
                   AND M.RA          = NE.RA
            INNER JOIN STURMADISC TD (NOLOCK)
                    ON TD.CODCOLIGADA = NE.CODCOLIGADA
                   AND TD.IDTURMADISC = NE.IDTURMADISC
            INNER JOIN SPLETIVO SPL (NOLOCK)
                    ON SPL.CODCOLIGADA = TD.CODCOLIGADA
                   AND SPL.IDPERLET    = TD.IDPERLET
            INNER JOIN SALUNO A (NOLOCK)
                    ON A.CODCOLIGADA = M.CODCOLIGADA
                   AND A.RA          = M.RA
            INNER JOIN PPESSOA P (NOLOCK)
                    ON P.CODIGO = A.CODPESSOA
            INNER JOIN SDISCIPLINA SDIS (NOLOCK)
                    ON SDIS.CODCOLIGADA = TD.CODCOLIGADA
                   AND SDIS.CODDISC     = TD.CODDISC
            INNER JOIN SETAPAS SE (NOLOCK)
                    ON SE.CODCOLIGADA = NE.CODCOLIGADA
                   AND SE.IDTURMADISC = NE.IDTURMADISC
                   AND SE.CODETAPA    = NE.CODETAPA
                   AND SE.TIPOETAPA   = NE.TIPOETAPA
            INNER JOIN SSTATUS ST (NOLOCK)
                    ON ST.CODCOLIGADA  = M.CODCOLIGADA
                   AND ST.CODSTATUS    = M.CODSTATUS
                   AND ST.CODTIPOCURSO = TD.CODTIPOCURSO
            WHERE NE.CODCOLIGADA = 1
              AND SPL.CODPERLET  = ?
              AND M.RA           LIKE ?
              AND TD.CODTURMA    LIKE ?
            """;

        var p = new DynamicParameters();
        p.Add("p1", filtro.CodPerlet);
        p.Add("p2", string.IsNullOrWhiteSpace(filtro.Ra) ? "%" : filtro.Ra);
        p.Add("p3", string.IsNullOrWhiteSpace(filtro.CodTurma) ? "%" : filtro.CodTurma);

        if (!string.IsNullOrWhiteSpace(filtro.TipoEtapa))
        {
            sql += "\n  AND NE.TIPOETAPA = ?";
            p.Add("p4", filtro.TipoEtapa);
        }

        sql += "\nORDER BY P.NOME, TD.CODDISC, NE.CODETAPA";

        using var conn = _factory.Create();
        return await conn.QueryAsync<NotaEtapaResultDto>(sql, p);
    }
}
