using System.ComponentModel.DataAnnotations;

namespace Secretaria.Api.DTOs.Subturmas;

public class SubturmaLimitarRequest
{
    [Required]
    public int CodColigada { get; set; }

    /// <summary>IDTURMADISC da turma gerencial.</summary>
    [Required]
    public int IdTurmaDisc { get; set; }

    /// <summary>IDTURMADISC da turma gerenciada específica (usado quando ApenasEsta = true).</summary>
    [Required]
    public int IdTurmaDiscGerenciada { get; set; }

    [Required, MinLength(1)]
    public string CodSubturma { get; set; } = string.Empty;

    [Required, Range(0, int.MaxValue)]
    public int MaxAlunos { get; set; }

    /// <summary>Quando true, atualiza somente a gerenciada informada; quando false, atualiza gerencial + todas as gerenciadas.</summary>
    public bool ApenasEsta { get; set; }
}
