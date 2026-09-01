using System.ComponentModel.DataAnnotations;

namespace Secretaria.Api.DTOs.Indicadores;

public class NotaProvaFiltroRequest
{
    [Required, MinLength(1)]
    public string CodPerlet { get; set; } = string.Empty;

    /// <summary>Filtro por RA. Use % para todos.</summary>
    public string Ra { get; set; } = "%";

    /// <summary>Filtro por código de turma. Use % para todas.</summary>
    public string CodTurma { get; set; } = "%";
}
