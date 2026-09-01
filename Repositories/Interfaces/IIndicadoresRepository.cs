using Secretaria.Api.DTOs.Indicadores;

namespace Secretaria.Api.Repositories.Interfaces;

public interface IIndicadoresRepository
{
    Task<IEnumerable<NotaProvaResultDto>>  GetNotasProvasAsync(NotaProvaFiltroRequest filtro);
    Task<IEnumerable<NotaEtapaResultDto>>  GetNotasEtapasAsync(NotaEtapaFiltroRequest filtro);
}
