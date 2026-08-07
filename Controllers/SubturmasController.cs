using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Secretaria.Api.DTOs.Subturmas;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Controllers;

/// <summary>Controle de Subturmas.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubturmasController : ControllerBase
{
    private readonly ISubturmasRepository _repo;

    public SubturmasController(ISubturmasRepository repo) => _repo = repo;

    /// <summary>
    /// Lista subturmas e quantidades de alunos alocados com base nos filtros informados.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SubturmaResultDto>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Get([FromQuery] SubturmaFiltroRequest filtro)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _repo.GetSubturmasAsync(filtro);
        return Ok(result);
    }

    /// <summary>
    /// Atualiza o MAXALUNOS de uma subturma gerencial.
    /// </summary>
    [HttpPut("maxalunos")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateMaxAlunos([FromBody] SubturmaLimitarRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        await _repo.UpdateMaxAlunosAsync(req.CodColigada, req.IdTurmaDisc, req.IdTurmaDiscGerenciada, req.CodSubturma, req.MaxAlunos, req.ApenasEsta);
        return NoContent();
    }
}
