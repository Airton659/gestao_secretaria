using System.ComponentModel.DataAnnotations;

namespace Secretaria.Api.DTOs.Subturmas;

public class SubturmaLimitarRequest
{
    [Required]
    public int CodColigada { get; set; }

    [Required]
    public int IdTurmaDisc { get; set; }

    [Required, MinLength(1)]
    public string CodSubturma { get; set; } = string.Empty;

    [Required, Range(0, int.MaxValue)]
    public int MaxAlunos { get; set; }
}
