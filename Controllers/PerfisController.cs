using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Secretaria.Api.DTOs.Perfis;
using Secretaria.Api.Repositories.Interfaces;
using Secretaria.Api.Services;

namespace Secretaria.Api.Controllers;

/// <summary>Gerenciamento de Perfis de Acesso (RBAC) e vinculação de usuários.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PerfisController : ControllerBase
{
    private readonly IPerfilAcessoRepository  _perfis;
    private readonly IUsuarioPerfilRepository _usuarios;
    private readonly IPermissaoService        _permissoes;

    public PerfisController(IPerfilAcessoRepository perfis, IUsuarioPerfilRepository usuarios, IPermissaoService permissoes)
    {
        _perfis     = perfis;
        _usuarios   = usuarios;
        _permissoes = permissoes;
    }

    // ── Perfis ────────────────────────────────────────────────────────────────

    /// <summary>Lista todos os perfis de acesso.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PerfilAcessoResponse>), 200)]
    public async Task<IActionResult> GetAll()
        => Ok(await _perfis.GetAllAsync());

    /// <summary>Retorna um perfil pelo ID.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PerfilAcessoResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int id)
    {
        var perfil = await _perfis.GetByIdAsync(id);
        return perfil is null ? NotFound() : Ok(perfil);
    }

    /// <summary>Cria um novo perfil de acesso. Requer permissão acessos:create.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(object), 201)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> Create([FromBody] PerfilAcessoRequest request)
    {
        var username = User.FindFirst("preferred_username")?.Value ?? "";
        if (!await _permissoes.TemPermissaoAsync(username, "acessos", "create")) return Forbid();

        var id = await _perfis.CreateAsync(request, username);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>Atualiza um perfil existente. O perfil Admin é fixo. Requer permissão acessos:update.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, [FromBody] PerfilAcessoRequest request)
    {
        var existing = await _perfis.GetByIdAsync(id);
        if (existing?.Nome.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true)
            return Problem("O perfil Admin é fixo e não pode ser editado.", statusCode: 403);

        var username = User.FindFirst("preferred_username")?.Value ?? "";
        if (!await _permissoes.TemPermissaoAsync(username, "acessos", "update")) return Forbid();

        var updated = await _perfis.UpdateAsync(id, request, username);
        return updated ? NoContent() : NotFound();
    }

    /// <summary>Remove um perfil de acesso. O perfil Admin é fixo. Requer permissão acessos:delete.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _perfis.GetByIdAsync(id);
        if (existing?.Nome.Equals("Admin", StringComparison.OrdinalIgnoreCase) == true)
            return Problem("O perfil Admin é fixo e não pode ser excluído.", statusCode: 403);

        var username = User.FindFirst("preferred_username")?.Value ?? "";
        if (!await _permissoes.TemPermissaoAsync(username, "acessos", "delete")) return Forbid();

        var deleted = await _perfis.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    // ── Usuários vinculados ───────────────────────────────────────────────────

    /// <summary>Lista usuários vinculados a um perfil.</summary>
    [HttpGet("{id:int}/usuarios")]
    [ProducesResponseType(typeof(IEnumerable<UsuarioPerfilResponse>), 200)]
    public async Task<IActionResult> GetUsuarios(int id)
        => Ok(await _usuarios.GetByPerfilAsync(id));

    /// <summary>Vincula um usuário ao perfil. Requer permissão acessos:update.</summary>
    [HttpPost("{id:int}/usuarios")]
    [ProducesResponseType(typeof(object), 201)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> AddUsuario(int id, [FromBody] UsuarioPerfilRequest request)
    {
        var username = User.FindFirst("preferred_username")?.Value ?? "";
        if (!await _permissoes.TemPermissaoAsync(username, "acessos", "update")) return Forbid();

        var usuarioId = await _usuarios.CreateAsync(id, request, username);
        return CreatedAtAction(nameof(GetUsuarios), new { id }, new { id = usuarioId });
    }

    /// <summary>Remove a vinculação de um usuário do perfil. Requer permissão acessos:update.</summary>
    [HttpDelete("{id:int}/usuarios/{usuarioId:int}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveUsuario(int id, int usuarioId)
    {
        var username = User.FindFirst("preferred_username")?.Value ?? "";
        if (!await _permissoes.TemPermissaoAsync(username, "acessos", "update")) return Forbid();

        var deleted = await _usuarios.DeleteAsync(usuarioId);
        return deleted ? NoContent() : NotFound();
    }
}
