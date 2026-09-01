import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { NotaProvaResult, NotaEtapaResult } from '../../types/indicadores';

const inputCls  = 'border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-funcesi-blue focus:border-transparent w-full';
const selectCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-funcesi-blue focus:border-transparent w-full bg-white';

// ─── Ícones ──────────────────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Agrupamento de Notas de Provas ──────────────────────────────────────────

interface EtapaRow {
  etapa:    string;
  notas:    Record<number, number | null>;
  conceitos: Record<number, string | null>;
}
interface DisciplinaGroup {
  codigoDisciplina: string;
  nomeDisciplina:   string;
  statusMatricula:  string;
  provas:           number[];
  etapas:           EtapaRow[];
}
interface AlunoGroup {
  nomeAluno:  string;
  ra:         string;
  turma:      string;
  disciplinas: DisciplinaGroup[];
}

function agruparProvas(rows: NotaProvaResult[]): AlunoGroup[] {
  const alunoMap = new Map<string, AlunoGroup>();

  for (const r of rows) {
    if (!alunoMap.has(r.ra)) {
      alunoMap.set(r.ra, { nomeAluno: r.nomeAluno, ra: r.ra, turma: r.turma, disciplinas: [] });
    }
    const aluno = alunoMap.get(r.ra)!;

    let disc = aluno.disciplinas.find(d => d.codigoDisciplina === r.codigoDisciplina);
    if (!disc) {
      disc = { codigoDisciplina: r.codigoDisciplina, nomeDisciplina: r.nomeDisciplina, statusMatricula: r.statusMatricula, provas: [], etapas: [] };
      aluno.disciplinas.push(disc);
    }

    let etapa = disc.etapas.find(e => e.etapa === r.etapa);
    if (!etapa) {
      etapa = { etapa: r.etapa, notas: {}, conceitos: {} };
      disc.etapas.push(etapa);
    }

    etapa.notas[r.prova]     = r.nota;
    etapa.conceitos[r.prova] = r.codconceito;

    if (!disc.provas.includes(r.prova)) {
      disc.provas.push(r.prova);
      disc.provas.sort((a, b) => a - b);
    }
  }

  return Array.from(alunoMap.values());
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function DisciplinaCard({ disc }: { disc: DisciplinaGroup }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-funcesi-blue uppercase tracking-wide shrink-0">
            {disc.codigoDisciplina}
          </span>
          <span className="text-xs text-slate-600 truncate">{disc.nomeDisciplina}</span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 shrink-0 whitespace-nowrap">
          {disc.statusMatricula}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left font-semibold text-slate-500 px-4 py-2">Etapa</th>
              {disc.provas.map(p => (
                <th key={p} className="text-right font-semibold text-slate-500 px-4 py-2">P{p}</th>
              ))}
              <th className="text-right font-semibold text-slate-500 px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {disc.etapas.map((et, i) => {
              // Soma somente valores numéricos; se algum for conceito, total = null
              const numericos = disc.provas
                .map(p => et.conceitos[p] ? null : et.notas[p])
                .filter((v): v is number => v !== null && v !== undefined);
              const temConceito = disc.provas.some(p => !!et.conceitos[p]);
              const total = !temConceito && numericos.length > 0
                ? numericos.reduce((a, b) => a + b, 0)
                : null;

              return (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600">{et.etapa}</td>
                  {disc.provas.map(p => {
                    const nota     = et.notas[p];
                    const conceito = et.conceitos[p];
                    const valor    = conceito ?? (nota !== undefined && nota !== null ? nota.toFixed(2) : '—');
                    return (
                      <td key={p} className="px-4 py-2 text-right font-semibold text-slate-800">
                        {valor}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right font-bold text-funcesi-blue border-l border-slate-100">
                    {total !== null ? total.toFixed(2) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlunoAcordeon({ aluno }: { aluno: AlunoGroup }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div>
            <p className="text-sm font-semibold text-slate-800">{aluno.nomeAluno}</p>
            <p className="text-xs text-slate-400 mt-0.5">RA: {aluno.ra} · Turma: {aluno.turma}</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {aluno.disciplinas.length} disciplina{aluno.disciplinas.length !== 1 ? 's' : ''}
          </span>
        </div>
        <IconChevron open={aberto} />
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          {aluno.disciplinas.map(disc => (
            <DisciplinaCard key={disc.codigoDisciplina} disc={disc} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type Aba = 'provas' | 'etapas';

export function IndicadoresPage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('provas');

  const [codPerlet, setCodPerlet] = useState('');
  const [ra, setRa]               = useState('');
  const [codTurma, setCodTurma]   = useState('');
  const [tipoEtapa, setTipoEtapa] = useState('N');

  const [resultadoProvas, setResultadoProvas] = useState<NotaProvaResult[]  | null>(null);
  const [resultadoEtapas, setResultadoEtapas] = useState<NotaEtapaResult[]  | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState<string | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!codPerlet.trim()) return;
    setCarregando(true);
    setErro(null);
    try {
      const raFiltro    = ra.trim()       || '%';
      const turmaFiltro = codTurma.trim() || '%';

      if (aba === 'provas') {
        const data = await api.indicadores.notasProvas(codPerlet.trim(), raFiltro, turmaFiltro);
        setResultadoProvas(data);
        setResultadoEtapas(null);
      } else {
        const data = await api.indicadores.notasEtapas(codPerlet.trim(), raFiltro, turmaFiltro, tipoEtapa);
        setResultadoEtapas(data);
        setResultadoProvas(null);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao buscar dados.');
    } finally {
      setCarregando(false);
    }
  }

  function trocarAba(novaAba: Aba) {
    setAba(novaAba);
    setResultadoProvas(null);
    setResultadoEtapas(null);
    setErro(null);
  }

  const alunosAgrupados = resultadoProvas ? agruparProvas(resultadoProvas) : null;
  const totalRegistros  = aba === 'provas' ? alunosAgrupados?.length : resultadoEtapas?.length;

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <IconArrowLeft />
        Voltar ao início
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Indicadores de Alunos</h1>
        <p className="text-sm text-slate-500 mt-1">Consulte notas de provas e etapas por aluno e período letivo.</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {([['provas', 'Notas de Provas'], ['etapas', 'Notas de Etapas']] as [Aba, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => trocarAba(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              aba === id
                ? 'bg-white border border-b-white border-slate-200 text-funcesi-blue -mb-px'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <form onSubmit={buscar} className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Período Letivo <span className="text-red-400">*</span>
            </label>
            <input className={inputCls} placeholder="Ex: 20261A" value={codPerlet}
              onChange={e => setCodPerlet(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RA do Aluno</label>
            <input className={inputCls} placeholder="Ex: 720622 (vazio = todos)" value={ra}
              onChange={e => setRa(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Código da Turma</label>
            <input className={inputCls} placeholder="Ex: MED6 (vazio = todas)" value={codTurma}
              onChange={e => setCodTurma(e.target.value)} />
          </div>
          {aba === 'etapas' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Etapa</label>
              <select className={selectCls} value={tipoEtapa} onChange={e => setTipoEtapa(e.target.value)}>
                <option value="">Todos</option>
                <option value="N">Nota (N)</option>
                <option value="F">Frequência (F)</option>
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={carregando || !codPerlet.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2 text-sm">
            <IconSearch />
            {carregando ? 'Buscando...' : 'Buscar'}
          </button>
          {totalRegistros !== undefined && (
            <span className="text-xs text-slate-400">
              {totalRegistros} {aba === 'provas' ? 'aluno(s)' : 'registro(s)'} encontrado(s)
            </span>
          )}
        </div>
      </form>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{erro}</div>
      )}

      {/* Acordeão — Notas de Provas */}
      {aba === 'provas' && alunosAgrupados !== null && (
        alunosAgrupados.length === 0
          ? <EmptyState />
          : (
            <div className="space-y-3">
              {alunosAgrupados.map(aluno => (
                <AlunoAcordeon key={aluno.ra} aluno={aluno} />
              ))}
            </div>
          )
      )}

      {/* Tabela — Notas de Etapas */}
      {aba === 'etapas' && resultadoEtapas !== null && (
        resultadoEtapas.length === 0
          ? <EmptyState />
          : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Aluno</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">RA</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Turma</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Disciplina</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Etapa</th>
                      <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Nota/Conceito</th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Média Mín.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoEtapas.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-slate-800 font-medium">{r.nomeAluno}</td>
                        <td className="px-4 py-2 text-slate-600">{r.ra}</td>
                        <td className="px-4 py-2 text-slate-600">{r.turma}</td>
                        <td className="px-4 py-2 text-slate-600">{r.nomeDisciplina}</td>
                        <td className="px-4 py-2 text-slate-600">{r.etapa}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            r.tipoEtapa === 'N' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {r.tipoEtapa === 'N' ? 'Nota' : 'Freq.'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600">{r.statusMatricula}</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-800">{r.notaEtapa ?? '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{r.mediaMinima ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <p className="text-sm text-slate-400">Nenhum registro encontrado para os filtros informados.</p>
    </div>
  );
}
