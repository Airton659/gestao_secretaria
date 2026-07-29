using System.ComponentModel.DataAnnotations;

namespace Secretaria.Api.DTOs.Perfis;

/// <summary>Dados para vincular um usuário ao perfil de acesso.</summary>
public class UsuarioPerfilRequest
{
    /// <summary>Login de rede do usuário (sem domínio). Ex: <c>jose.marques</c>.</summary>
    [Required, MaxLength(200)]
    public string LoginAd { get; set; } = string.Empty;
}
