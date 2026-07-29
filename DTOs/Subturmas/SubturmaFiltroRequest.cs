using System.ComponentModel.DataAnnotations;

namespace Secretaria.Api.DTOs.Subturmas;

public class SubturmaFiltroRequest
{
    /// <summary>Período letivo. Ex: <c>2024/1</c></summary>
    [Required]
    public string CodPerlet { get; set; } = string.Empty;

    /// <summary>Código da turma gerencial. Suporta % para wildcard. Ex: <c>TG001</c></summary>
    [Required]
    public string CodTurma { get; set; } = string.Empty;

    /// <summary>Corte mínimo de alunos para exibir a subturma.</summary>
    [Required, Range(1, int.MaxValue)]
    public int MaxAlunos { get; set; }
}
