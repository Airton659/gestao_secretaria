using Dapper;
using Secretaria.Api.Data;
using Secretaria.Api.DTOs.Subturmas;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Repositories;

// OdbcConnection não suporta @param nomeado — usa ? posicional + DynamicParameters em ordem
// Ordem dos parâmetros: CODTURMA → CODPERLET → MAXALUNOS
public class SubturmasRepository : ISubturmasRepository
{
    private readonly IDbCorpConnectionFactory _factory;

    public SubturmasRepository(IDbCorpConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<SubturmaResultDto>> GetSubturmasAsync(SubturmaFiltroRequest filtro)
    {
        const string sql = """
            WITH BaseMatriculas AS (
                SELECT
                    TG.CODCOLIGADA,
                    TG.IDPERLET,
                    TG.CODTURMA              AS COD_TURMA_GERENCIAL,
                    TG.NOME                  AS NOME_TURMA_GERENCIAL,
                    TG.IDTURMADISC           AS IDTURMADISC_GERENCIAL,
                    TGD.CODTURMA             AS COD_TURMA_GERENCIADA,
                    TGD.IDTURMADISC          AS IDTURMADISC_GERENCIADA,
                    M.CODSUBTURMA,
                    SG.MAXALUNOS             AS MAXALUNOS_GER,
                    SGE.MAXALUNOS            AS MAXALUNOS_GERD,
                    M.RA
                FROM STURMADISC TG (NOLOCK)
                INNER JOIN STURMADISCGERENCIADA G (NOLOCK)
                        ON TG.CODCOLIGADA = G.CODCOLIGADA
                       AND TG.IDTURMADISC = G.IDTURMADISC
                INNER JOIN STURMADISC TGD (NOLOCK)
                        ON G.CODCOLIGADA           = TGD.CODCOLIGADA
                       AND G.IDTURMADISCGERENCIADA = TGD.IDTURMADISC
                       AND TG.IDPERLET             = TGD.IDPERLET
                INNER JOIN SMATRICULA M (NOLOCK)
                        ON TGD.CODCOLIGADA = M.CODCOLIGADA
                       AND TGD.IDTURMADISC = M.IDTURMADISC
                       AND TGD.IDPERLET    = M.IDPERLET
                INNER JOIN SSUBTURMA SG (NOLOCK)
                        ON TG.CODCOLIGADA = SG.CODCOLIGADA
                       AND TG.IDTURMADISC = SG.IDTURMADISC
                       AND M.CODSUBTURMA  = SG.CODSUBTURMA
                INNER JOIN SSUBTURMA SGE (NOLOCK)
                        ON TGD.CODCOLIGADA = SGE.CODCOLIGADA
                       AND TGD.IDTURMADISC = SGE.IDTURMADISC
                       AND M.CODSUBTURMA   = SGE.CODSUBTURMA
                INNER JOIN SPLETIVO SPL (NOLOCK)
                      ON M.IDPERLET = SPL.IDPERLET
                WHERE TG.GERENCIAL    = 'S'
                  AND TG.CODCOLIGADA  = 1
                  AND TG.CODTURMA     LIKE ?
                  AND M.CODSTATUS     = 1
                  AND SPL.CODPERLET   = ?                  

            ),
            TotalPorCodSubturma AS (
                SELECT
                    CODCOLIGADA,
                    IDPERLET,
                    CODSUBTURMA,
                    COUNT(DISTINCT RA) AS TOTAL_ALUNOS_GRUPO
                FROM BaseMatriculas
                GROUP BY CODCOLIGADA, IDPERLET, CODSUBTURMA
            )
            SELECT
                BM.CODCOLIGADA,
                BM.IDPERLET,
                BM.COD_TURMA_GERENCIAL,
                BM.NOME_TURMA_GERENCIAL,
                BM.COD_TURMA_GERENCIADA,
                BM.IDTURMADISC_GERENCIAL,
                BM.IDTURMADISC_GERENCIADA,
                BM.CODSUBTURMA,
                BM.MAXALUNOS_GER,
                BM.MAXALUNOS_GERD,
                COUNT(DISTINCT BM.RA)    AS QTD_ALUNOS_NESTA_SUBTURMA,
                T.TOTAL_ALUNOS_GRUPO     AS TOTAL_ALUNOS_MESMO_CODSUBTURMA
            FROM BaseMatriculas BM
            INNER JOIN TotalPorCodSubturma T
                    ON T.CODCOLIGADA = BM.CODCOLIGADA
                   AND T.IDPERLET    = BM.IDPERLET
                   AND T.CODSUBTURMA = BM.CODSUBTURMA
            WHERE T.TOTAL_ALUNOS_GRUPO >= ?
            GROUP BY
                BM.CODCOLIGADA,
                BM.IDPERLET,
                BM.COD_TURMA_GERENCIAL,
                BM.NOME_TURMA_GERENCIAL,
                BM.COD_TURMA_GERENCIADA,
                BM.IDTURMADISC_GERENCIAL,
                BM.IDTURMADISC_GERENCIADA,
                BM.CODSUBTURMA,
                BM.MAXALUNOS_GER,
                BM.MAXALUNOS_GERD,
                T.TOTAL_ALUNOS_GRUPO
            ORDER BY
                BM.CODSUBTURMA,
                BM.IDTURMADISC_GERENCIADA
            """;

        var p = new DynamicParameters();
        p.Add("CodTurma",  filtro.CodTurma);
        p.Add("CodPerlet", filtro.CodPerlet);
        p.Add("MaxAlunos", filtro.MaxAlunos);

        using var conn = _factory.Create();
        return await conn.QueryAsync<SubturmaResultDto>(sql, p);
    }

    public async Task UpdateMaxAlunosAsync(int codColigada, int idTurmaDisc, string codSubturma, int maxAlunos)
    {
        const string updateSql = """
            UPDATE SSUBTURMA
            SET MAXALUNOS = ?
            WHERE CODCOLIGADA = ?
              AND IDTURMADISC = ?
              AND CODSUBTURMA = ?
            """;

        var p = new DynamicParameters();
        p.Add("MaxAlunos",   maxAlunos);
        p.Add("CodColigada", codColigada);
        p.Add("IdTurmaDisc", idTurmaDisc);
        p.Add("CodSubturma", codSubturma);

        using var conn = _factory.Create();
        await conn.ExecuteAsync(updateSql, p);
    }
}
