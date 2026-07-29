using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Controllers;

/// <summary>Informações do usuário autenticado via Keycloak.</summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUsuarioPerfilRepository _usuarioPerfilRepo;
    private readonly IPerfilAcessoRepository  _perfilAcessoRepo;

    public AuthController(IUsuarioPerfilRepository usuarioPerfilRepo, IPerfilAcessoRepository perfilAcessoRepo)
    {
        _usuarioPerfilRepo = usuarioPerfilRepo;
        _perfilAcessoRepo  = perfilAcessoRepo;
    }

    /// <summary>Retorna os dados do usuário logado extraídos do token Keycloak.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public IActionResult Me()
    {
        var sub      = User.FindFirst("sub")?.Value;
        var username = User.FindFirst("preferred_username")?.Value;
        var email    = User.FindFirst("email")?.Value;
        var name     = User.FindFirst("name")?.Value;

        return Ok(new { sub, username, email, name });
    }

    /// <summary>
    /// Retorna o perfil de acesso do usuário logado. 403 se não tiver vínculo em UsuariosPerfil.
    /// </summary>
    [HttpGet("perfil")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> Perfil()
    {
        var username = User.FindFirst("preferred_username")?.Value ?? "";
        var name     = User.FindFirst("name")?.Value ?? username;

        var vinculos = await _usuarioPerfilRepo.GetByLoginAdAsync(username);
        var vinculo  = vinculos.FirstOrDefault();
        if (vinculo == null) return Forbid();

        var perfil = await _perfilAcessoRepo.GetByIdAsync(vinculo.PerfilAcessoId);
        if (perfil == null) return Forbid();

        var isAdmin = perfil.Nome.Equals("Admin", StringComparison.OrdinalIgnoreCase);

        return Ok(new {
            username,
            name,
            perfilId   = perfil.Id,
            perfilNome = perfil.Nome,
            isAdmin,
            permissoes = perfil.Permissoes,
        });
    }
}
