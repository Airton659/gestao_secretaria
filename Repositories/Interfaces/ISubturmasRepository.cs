using Secretaria.Api.DTOs.Subturmas;

namespace Secretaria.Api.Repositories.Interfaces;

public interface ISubturmasRepository
{
    Task<IEnumerable<SubturmaResultDto>> GetSubturmasAsync(SubturmaFiltroRequest filtro);
    Task UpdateMaxAlunosAsync(int codColigada, int idTurmaDisc, string codSubturma, int maxAlunos);
}
