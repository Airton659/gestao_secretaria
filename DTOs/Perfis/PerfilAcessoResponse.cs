namespace Secretaria.Api.DTOs.Perfis;

public class PerfilAcessoResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Permissoes { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CriadoPor { get; set; }
    public string? AlteradoPor { get; set; }
}
