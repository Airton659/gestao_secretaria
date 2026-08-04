using Dapper;
using Secretaria.Api.Data;
using Secretaria.Api.DTOs.Subturmas;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Repositories;

// OdbcConnection não suporta @param nomeado — usa ? posicional + DynamicParameters em ordem
// Ordem dos parâmetros GET: CODTURMA → CODPERLET → MAXALUNOS
public class SubturmasRepository : ISubturmasRepository
{
    private readonly IDbCorpConnectionFactory _factory;

    public SubturmasRepository(IDbCorpConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<SubturmaResultDto>> GetSubturmasAsync(SubturmaFiltroRequest filtro)
    {
        const string sql = """
            WITH BaseSubturmas AS (
                -- Todas as subturmas definidas nas gerenciadas (com ou sem alunos)
                SELECT
                    TG.CODCOLIGADA,
                    TG.IDPERLET,
                    TG.CODTURMA              AS COD_TURMA_GERENCIAL,
                    TG.NOME                  AS NOME_TURMA_GERENCIAL,
                    TG.IDTURMADISC           AS IDTURMADISC_GERENCIAL,
                    TGD.CODTURMA             AS COD_TURMA_GERENCIADA,
                    TGD.IDTURMADISC          AS IDTURMADISC_GERENCIADA,
                    SGE.CODSUBTURMA,
                    SG.MAXALUNOS             AS MAXALUNOS_GER,
                    SGE.MAXALUNOS            AS MAXALUNOS_GERD
                FROM STURMADISC TG (NOLOCK)
                INNER JOIN STURMADISCGERENCIADA G (NOLOCK)
                        ON TG.CODCOLIGADA = G.CODCOLIGADA
                       AND TG.IDTURMADISC = G.IDTURMADISC
                INNER JOIN STURMADISC TGD (NOLOCK)
                        ON G.CODCOLIGADA           = TGD.CODCOLIGADA
                       AND G.IDTURMADISCGERENCIADA = TGD.IDTURMADISC
                       AND TG.IDPERLET             = TGD.IDPERLET
                INNER JOIN SSUBTURMA SGE (NOLOCK)
                        ON TGD.CODCOLIGADA = SGE.CODCOLIGADA
                       AND TGD.IDTURMADISC = SGE.IDTURMADISC
                LEFT JOIN SSUBTURMA SG (NOLOCK)
                        ON TG.CODCOLIGADA  = SG.CODCOLIGADA
                       AND TG.IDTURMADISC  = SG.IDTURMADISC
                       AND SGE.CODSUBTURMA = SG.CODSUBTURMA
                INNER JOIN SPLETIVO SPL (NOLOCK)
                        ON TG.IDPERLET = SPL.IDPERLET
                WHERE TG.GERENCIAL   = 'S'
                  AND TG.CODCOLIGADA = 1
                  AND TG.CODTURMA    LIKE ?
                  AND SPL.CODPERLET  = ?
            ),
            BaseComAlunos AS (
                -- LEFT JOIN matriculas: subturmas sem alunos ficam com RA = NULL
                SELECT
                    BS.CODCOLIGADA,
                    BS.IDPERLET,
                    BS.COD_TURMA_GERENCIAL,
                    BS.NOME_TURMA_GERENCIAL,
                    BS.IDTURMADISC_GERENCIAL,
                    BS.COD_TURMA_GERENCIADA,
                    BS.IDTURMADISC_GERENCIADA,
                    BS.CODSUBTURMA,
                    BS.MAXALUNOS_GER,
                    BS.MAXALUNOS_GERD,
                    M.RA
                FROM BaseSubturmas BS
                LEFT JOIN SMATRICULA M (NOLOCK)
                       ON M.CODCOLIGADA = BS.CODCOLIGADA
                      AND M.IDTURMADISC = BS.IDTURMADISC_GERENCIADA
                      AND M.IDPERLET    = BS.IDPERLET
                      AND M.CODSUBTURMA = BS.CODSUBTURMA
                      AND M.CODSTATUS   = 1
            ),
            TotalPorCodSubturma AS (
                SELECT
                    CODCOLIGADA,
                    IDPERLET,
                    CODSUBTURMA,
                    COUNT(DISTINCT RA) AS TOTAL_ALUNOS_GRUPO
                FROM BaseComAlunos
                GROUP BY CODCOLIGADA, IDPERLET, CODSUBTURMA
            )
            SELECT
                BC.CODCOLIGADA,
                BC.IDPERLET,
                BC.COD_TURMA_GERENCIAL,
                BC.NOME_TURMA_GERENCIAL,
                BC.COD_TURMA_GERENCIADA,
                BC.IDTURMADISC_GERENCIAL,
                BC.IDTURMADISC_GERENCIADA,
                BC.CODSUBTURMA,
                BC.MAXALUNOS_GER,
                BC.MAXALUNOS_GERD,
                COUNT(DISTINCT BC.RA)    AS QTD_ALUNOS_NESTA_SUBTURMA,
                T.TOTAL_ALUNOS_GRUPO     AS TOTAL_ALUNOS_MESMO_CODSUBTURMA
            FROM BaseComAlunos BC
            INNER JOIN TotalPorCodSubturma T
                    ON T.CODCOLIGADA = BC.CODCOLIGADA
                   AND T.IDPERLET    = BC.IDPERLET
                   AND T.CODSUBTURMA = BC.CODSUBTURMA
            WHERE T.TOTAL_ALUNOS_GRUPO = 0
               OR T.TOTAL_ALUNOS_GRUPO >= ?
            GROUP BY
                BC.CODCOLIGADA,
                BC.IDPERLET,
                BC.COD_TURMA_GERENCIAL,
                BC.NOME_TURMA_GERENCIAL,
                BC.COD_TURMA_GERENCIADA,
                BC.IDTURMADISC_GERENCIAL,
                BC.IDTURMADISC_GERENCIADA,
                BC.CODSUBTURMA,
                BC.MAXALUNOS_GER,
                BC.MAXALUNOS_GERD,
                T.TOTAL_ALUNOS_GRUPO
            ORDER BY
                BC.CODSUBTURMA,
                BC.IDTURMADISC_GERENCIADA
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
        // Atualiza SSUBTURMA da turma gerencial E de todas as gerenciadas vinculadas
        const string updateSql = """
            UPDATE SSUBTURMA
            SET MAXALUNOS = ?
            WHERE CODCOLIGADA = ?
              AND CODSUBTURMA  = ?
              AND (
                    IDTURMADISC = ?
                    OR IDTURMADISC IN (
                        SELECT G.IDTURMADISCGERENCIADA
                        FROM STURMADISCGERENCIADA G (NOLOCK)
                        WHERE G.CODCOLIGADA = ?
                          AND G.IDTURMADISC  = ?
                    )
                  )
            """;

        // Ordem posicional dos ? : MaxAlunos, CodColigada, CodSubturma,
        //   IdTurmaDisc (direto), CodColigada (subquery), IdTurmaDisc (subquery)
        var p = new DynamicParameters();
        p.Add("p1", maxAlunos);
        p.Add("p2", codColigada);
        p.Add("p3", codSubturma);
        p.Add("p4", idTurmaDisc);
        p.Add("p5", codColigada);
        p.Add("p6", idTurmaDisc);

        using var conn = _factory.Create();
        await conn.ExecuteAsync(updateSql, p);
    }
}
