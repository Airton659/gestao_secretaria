namespace Secretaria.Api.DTOs.Perfis;

public class UsuarioPerfilResponse
{
    public int    Id             { get; set; }
    public string LoginAd        { get; set; } = string.Empty;
    public int    PerfilAcessoId { get; set; }
    public string PerfilNome     { get; set; } = string.Empty;
    public DateTime CreatedAt    { get; set; }
    public DateTime UpdatedAt    { get; set; }
    public string? CriadoPor     { get; set; }
    public string? AlteradoPor   { get; set; }
}
