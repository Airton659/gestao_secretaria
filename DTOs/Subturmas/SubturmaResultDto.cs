namespace Secretaria.Api.DTOs.Subturmas;

public class SubturmaResultDto
{
    public int    CodColigada                 { get; set; }
    public int    IdPerlet                    { get; set; }
    public string CodTurmaGerencial           { get; set; } = string.Empty;
    public string NomeTurmaGerencial          { get; set; } = string.Empty;
    public string CodTurmaGerenciada          { get; set; } = string.Empty;
    public int    IdTurmaDiscGerencial        { get; set; }
    public int    IdTurmaDiscGerenciada       { get; set; }
    public string CodSubturma                 { get; set; } = string.Empty;
    public int?   MaxAlunosGer                { get; set; }
    public int    MaxAlunosGerd               { get; set; }
    public int    QtdAlunosNestaSubturma      { get; set; }
    public int    TotalAlunosMesmoCodSubturma { get; set; }
}
