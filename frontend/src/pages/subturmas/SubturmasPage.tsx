import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { SubturmaResult } from '../../types/subturmas';

const inputCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-funcesi-blue focus:border-transparent w-full';

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

// Chave única por linha (gerenciada é o que difere dentro do mesmo grupo)
function rowKey(r: SubturmaResult) {
  return `${r.idTurmaDiscGerenciada}_${r.codSubturma}`;
}

// Chave do "lado gerencial" — compartilhada por todas as linhas do mesmo grupo/subturma
function gerencialKey(r: SubturmaResult) {
  return `${r.idTurmaDiscGerencial}_${r.codSubturma}`;
}

// Agrupa os resultados por turma gerencial
function agrupar(rows: SubturmaResult[]): Map<string, { nome: string; rows: SubturmaResult[] }> {
  const map = new Map<string, { nome: string; rows: SubturmaResult[] }>();
  for (const r of rows) {
    const key = r.codTurmaGerencial;
    if (!map.has(key)) map.set(key, { nome: r.nomeTurmaGerencial, rows: [] });
    map.get(key)!.rows.push(r);
  }
  return map;
}

export function SubturmasPage() {
  const navigate = useNavigate();

  const [codPerlet, setCodPerlet] = useState('');
  const [codTurma,  setCodTurma]  = useState('%');
  const [maxAlunos, setMaxAlunos] = useState(30);
  const [resultado, setResultado] = useState<SubturmaResult[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estado de edição inline por linha
  const [editandoKey, setEditandoKey]     = useState<string | null>(null);
  const [editandoValor, setEditandoValor] = useState(0);
  const [apenasEsta, setApenasEsta]       = useState(false);
  const [salvando, setSalvando]           = useState(false);
  const [erroLimitar, setErroLimitar]     = useState<string | null>(null);
  const [erroKey, setErroKey]             = useState<string | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!codPerlet.trim()) return;
    setCarregando(true);
    setErro(null);
    setEditandoKey(null);
    try {
      const data = await api.subturmas.list(codPerlet.trim(), codTurma.trim() || '%', maxAlunos);
      setResultado(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao buscar dados.');
      setResultado(null);
    } finally {
      setCarregando(false);
    }
  }

  function iniciarEdicao(r: SubturmaResult) {
    setEditandoKey(rowKey(r));
    setEditandoValor(0);
    setApenasEsta(false);
    setErroLimitar(null);
    setErroKey(null);
  }

  function cancelarEdicao() {
    setEditandoKey(null);
    setErroLimitar(null);
    setErroKey(null);
  }

  async function confirmarLimite(r: SubturmaResult) {
    setSalvando(true);
    setErroLimitar(null);
    try {
      await api.subturmas.limitar({
        codColigada: r.codColigada,
        idTurmaDisc: r.idTurmaDiscGerencial,
        idTurmaDiscGerenciada: r.idTurmaDiscGerenciada,
        codSubturma: r.codSubturma,
        maxAlunos: editandoValor,
        apenasEsta,
      });
      // Atualiza maxAlunosGer: somente esta linha ou todas do mesmo grupo
      const rKey  = rowKey(r);
      const gKey  = gerencialKey(r);
      setResultado(prev =>
        prev?.map(item => {
          if (apenasEsta) return rowKey(item) === rKey ? { ...item, maxAlunosGer: editandoValor } : item;
          return gerencialKey(item) === gKey ? { ...item, maxAlunosGer: editandoValor } : item;
        }) ?? null
      );
      setEditandoKey(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      setErroLimitar(msg);
      setErroKey(rowKey(r));
    } finally {
      setSalvando(false);
    }
  }

  const grupos = resultado ? agrupar(resultado) : null;

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
        <h1 className="text-xl font-bold text-slate-900">Controle de Subturmas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualize a ocupação de subturmas por turma gerencial.
        </p>
      </div>

      {/* Formulário de filtros */}
      <form onSubmit={buscar} className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Período Letivo <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="Ex: 2024/1"
              value={codPerlet}
              onChange={e => setCodPerlet(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Código da Turma Gerencial
            </label>
            <input
              className={inputCls}
              placeholder="Ex: TG001 ou % para todas"
              value={codTurma}
              onChange={e => setCodTurma(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">Use % como coringa</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Corte mínimo de alunos <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              type="number"
              min={1}
              value={maxAlunos}
              onChange={e => setMaxAlunos(Number(e.target.value))}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Exibe subturmas com ≥ este valor</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={carregando || !codPerlet.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2 text-sm"
          >
            <IconSearch />
            {carregando ? 'Buscando...' : 'Buscar'}
          </button>
          {resultado !== null && (
            <span className="text-xs text-slate-400">
              {resultado.length} {resultado.length === 1 ? 'registro' : 'registros'} encontrados
            </span>
          )}
        </div>
      </form>

      {/* Erro de busca */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {erro}
        </div>
      )}

      {/* Resultados */}
      {grupos && grupos.size === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">Nenhuma subturma encontrada para os filtros informados.</p>
        </div>
      )}

      {grupos && grupos.size > 0 && (
        <div className="space-y-5">
          {Array.from(grupos.entries()).map(([codTurmaGer, grupo]) => (
            <div key={codTurmaGer} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Cabeçalho do grupo */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-funcesi-blue uppercase tracking-wide">{codTurmaGer}</span>
                  <span className="text-sm text-slate-600 ml-2">{grupo.nome}</span>
                </div>
                <span className="text-xs text-slate-400">{grupo.rows.length} subturma(s)</span>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Subturma</th>
                      <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Turma Gerenciada</th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Alunos na subturma</th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Total mesma subturma</th>
                      <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Máx. Ger.</th>
                      <th className="text-center text-xs font-semibold text-slate-500 px-5 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-800">{r.codSubturma}</td>
                        <td className="px-5 py-3 text-slate-600">{r.codTurmaGerenciada}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">{r.qtdAlunosNestaSubturma}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{r.totalAlunosMesmoCodSubturma}</td>
                        <td className="px-5 py-3 text-right text-slate-500">
                          {r.maxAlunosGer ?? ''}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {editandoKey === rowKey(r) ? (
                            <div className="flex flex-col items-center gap-1">
                            {erroKey === rowKey(r) && (
                              <span className="text-[10px] text-red-600 max-w-[160px] text-center leading-tight">{erroLimitar}</span>
                            )}
                            <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={apenasEsta}
                                onChange={e => setApenasEsta(e.target.checked)}
                                disabled={salvando}
                                className="accent-funcesi-blue w-3 h-3"
                              />
                              Somente esta
                            </label>
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={editandoValor}
                                onChange={e => setEditandoValor(Number(e.target.value))}
                                className="w-20 border border-slate-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-funcesi-blue"
                                disabled={salvando}
                                autoFocus
                              />
                              <button
                                onClick={() => confirmarLimite(r)}
                                disabled={salvando || editandoValor < 0}
                                className="text-xs bg-funcesi-blue text-white font-semibold px-2 py-1 rounded hover:bg-funcesi-dark transition-colors disabled:opacity-50"
                              >
                                {salvando ? '...' : 'OK'}
                              </button>
                              <button
                                onClick={cancelarEdicao}
                                disabled={salvando}
                                className="text-xs text-slate-400 hover:text-slate-700 px-1 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicao(r)}
                              className="text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1 rounded-full hover:bg-amber-200 transition-colors"
                            >
                              Limitar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
