using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Secretaria.Api.DTOs.Indicadores;
using Secretaria.Api.Repositories.Interfaces;

namespace Secretaria.Api.Controllers;

/// <summary>Indicadores de Alunos.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IndicadoresController : ControllerBase
{
    private readonly IIndicadoresRepository _repo;

    public IndicadoresController(IIndicadoresRepository repo) => _repo = repo;

    /// <summary>Lista notas de provas por aluno/disciplina/etapa.</summary>
    [HttpGet("notas-provas")]
    [ProducesResponseType(typeof(IEnumerable<NotaProvaResultDto>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> GetNotasProvas([FromQuery] NotaProvaFiltroRequest filtro)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _repo.GetNotasProvasAsync(filtro);
        return Ok(result);
    }

    /// <summary>Lista notas de etapas por aluno/disciplina. TipoEtapa: N=Nota, F=Frequência, vazio=todos.</summary>
    [HttpGet("notas-etapas")]
    [ProducesResponseType(typeof(IEnumerable<NotaEtapaResultDto>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> GetNotasEtapas([FromQuery] NotaEtapaFiltroRequest filtro)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _repo.GetNotasEtapasAsync(filtro);
        return Ok(result);
    }
}
