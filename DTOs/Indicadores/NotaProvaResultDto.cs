namespace Secretaria.Api.DTOs.Indicadores;

public class NotaProvaResultDto
{
    public string NomeAluno        { get; set; } = string.Empty;
    public string Ra               { get; set; } = string.Empty;
    public string PeriodoLetivo    { get; set; } = string.Empty;
    public string Turma            { get; set; } = string.Empty;
    public string CodigoDisciplina { get; set; } = string.Empty;
    public string NomeDisciplina   { get; set; } = string.Empty;
    public string Etapa            { get; set; } = string.Empty;
    public string TipoEtapa        { get; set; } = string.Empty;
    public int    Prova            { get; set; }
    public decimal? Nota           { get; set; }
    public string? Codconceito      { get; set; }
    public string  StatusMatricula  { get; set; } = string.Empty;
}
