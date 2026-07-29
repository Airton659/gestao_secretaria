using System.ComponentModel.DataAnnotations;

namespace Secretaria.Api.DTOs.Perfis;

/// <summary>Dados para criação ou atualização de um perfil de acesso.</summary>
public class PerfilAcessoRequest
{
    /// <summary>Nome descritivo do perfil. Ex: <c>Coordenador de Secretaria</c>.</summary>
    [Required, MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    /// <summary>
    /// Matriz de permissões em JSON. Estrutura: <c>{ "modulo": ["read","create","update","delete"] }</c>.
    /// Módulos disponíveis: <c>subturmas</c>, <c>acessos</c>.
    /// </summary>
    public string Permissoes { get; set; } = "{}";
}
