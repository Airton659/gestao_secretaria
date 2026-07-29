import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { usePerfil } from '../../contexts/PerfilContext';
import type { PerfilAcessoResponse, PerfilAcessoRequest, UsuarioPerfilResponse } from '../../types/perfis';

const MODULOS = [
  { id: 'subturmas', label: 'Controle de Subturmas', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'acessos',   label: 'Perfis e Acesso',        actions: ['read', 'create', 'update', 'delete'] },
];

const ACTION_LABELS: Record<string, string> = {
  read: 'Ver', create: 'Criar', update: 'Editar', delete: 'Excluir',
};

const inputCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-funcesi-blue focus:border-transparent w-full';

function parsePerms(raw: string): Record<string, string[]> {
  try { return JSON.parse(raw) as Record<string, string[]>; }
  catch { return {}; }
}

function toggleAction(perms: Record<string, string[]>, modulo: string, action: string): Record<string, string[]> {
  const current = perms[modulo] ?? [];
  const next = current.includes(action)
    ? current.filter(a => a !== action)
    : [...current, action];
  const updated = { ...perms, [modulo]: next };
  if (updated[modulo].length === 0) delete updated[modulo];
  return updated;
}

export function PerfisScreen() {
  const { perfil: perfilAtual } = usePerfil();
  const isAdmin = perfilAtual?.isAdmin ?? false;

  const [perfis, setPerfis]     = useState<PerfilAcessoResponse[]>([]);
  const [selected, setSelected] = useState<PerfilAcessoResponse | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioPerfilResponse[]>([]);
  const [loading, setLoading]   = useState(true);

  // form estado
  const [editando, setEditando]         = useState(false);
  const [nomeForm, setNomeForm]         = useState('');
  const [permsForm, setPermsForm]       = useState<Record<string, string[]>>({});
  const [novoLogin, setNovoLogin]       = useState('');
  const [salvando, setSalvando]         = useState(false);

  useEffect(() => {
    api.perfis.list()
      .then(setPerfis)
      .finally(() => setLoading(false));
  }, []);

  async function selectPerfil(p: PerfilAcessoResponse) {
    setSelected(p);
    setEditando(false);
    setUsuarios([]);
    const us = await api.perfis.getUsuarios(p.id);
    setUsuarios(us);
  }

  function startEdit(p: PerfilAcessoResponse) {
    setNomeForm(p.nome);
    setPermsForm(parsePerms(p.permissoes));
    setEditando(true);
  }

  async function handleSave() {
    if (!selected) return;
    setSalvando(true);
    try {
      const body: PerfilAcessoRequest = { nome: nomeForm, permissoes: JSON.stringify(permsForm) };
      await api.perfis.update(selected.id, body);
      const updated = await api.perfis.list();
      setPerfis(updated);
      const fresh = updated.find(p => p.id === selected.id) ?? null;
      setSelected(fresh);
      setEditando(false);
    } finally { setSalvando(false); }
  }

  async function handleCreate() {
    setSalvando(true);
    try {
      await api.perfis.create({ nome: nomeForm, permissoes: JSON.stringify(permsForm) });
      const updated = await api.perfis.list();
      setPerfis(updated);
      setNomeForm('');
      setPermsForm({});
    } finally { setSalvando(false); }
  }

  async function handleDelete(p: PerfilAcessoResponse) {
    if (!confirm(`Excluir perfil "${p.nome}"?`)) return;
    await api.perfis.delete(p.id);
    const updated = await api.perfis.list();
    setPerfis(updated);
    if (selected?.id === p.id) setSelected(null);
  }

  async function handleAddUsuario() {
    if (!selected || !novoLogin.trim()) return;
    await api.perfis.addUsuario(selected.id, { loginAd: novoLogin.trim() });
    setNovoLogin('');
    const us = await api.perfis.getUsuarios(selected.id);
    setUsuarios(us);
  }

  async function handleRemoveUsuario(usuarioId: number) {
    if (!selected) return;
    await api.perfis.removeUsuario(selected.id, usuarioId);
    setUsuarios(us => us.filter(u => u.id !== usuarioId));
  }

  if (loading) return <div className="text-sm text-slate-400">Carregando...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Perfis e Acesso</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie perfis de acesso e vincule usuários.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Lista de perfis */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Perfis</span>
              {isAdmin && (
                <button
                  onClick={() => { setSelected(null); setEditando(true); setNomeForm(''); setPermsForm({}); }}
                  className="text-xs text-funcesi-blue font-semibold hover:underline"
                >
                  + Novo
                </button>
              )}
            </div>
            <ul>
              {perfis.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => selectPerfil(p)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group ${
                      selected?.id === p.id
                        ? 'bg-funcesi-blue/5 text-funcesi-blue font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{p.nome}</span>
                    {p.nome === 'Admin' && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">fixo</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detalhe / edição */}
        <div className="md:col-span-2 space-y-4">

          {/* Criar novo perfil */}
          {editando && !selected && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Novo Perfil</h2>
              <div className="space-y-4">
                <input className={inputCls} placeholder="Nome do perfil" value={nomeForm} onChange={e => setNomeForm(e.target.value)} />
                <PermissoesEditor perms={permsForm} onChange={setPermsForm} />
                <div className="flex gap-2">
                  <button onClick={handleCreate} disabled={salvando || !nomeForm.trim()} className="btn-primary text-xs px-4 py-2">Criar</button>
                  <button onClick={() => setEditando(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Editar perfil existente */}
          {selected && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-700">{selected.nome}</h2>
                  {isAdmin && selected.nome !== 'Admin' && !editando && (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(selected)} className="text-xs text-funcesi-blue font-semibold hover:underline">Editar</button>
                      <button onClick={() => handleDelete(selected)} className="text-xs text-red-500 font-semibold hover:underline">Excluir</button>
                    </div>
                  )}
                </div>

                {editando ? (
                  <div className="space-y-4">
                    <input className={inputCls} placeholder="Nome do perfil" value={nomeForm} onChange={e => setNomeForm(e.target.value)} />
                    <PermissoesEditor perms={permsForm} onChange={setPermsForm} />
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={salvando} className="btn-primary text-xs px-4 py-2">Salvar</button>
                      <button onClick={() => setEditando(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  selected.nome === 'Admin'
                    ? <p className="text-xs text-slate-500">O perfil Admin tem acesso total ao sistema.</p>
                    : <PermissoesViewer permissoes={selected.permissoes} />
                )}
              </div>

              {/* Usuários vinculados */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Usuários vinculados</h2>

                {isAdmin && (
                  <div className="flex gap-2 mb-4">
                    <input
                      className={inputCls}
                      placeholder="Login de rede (ex: joao.silva)"
                      value={novoLogin}
                      onChange={e => setNovoLogin(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddUsuario()}
                    />
                    <button
                      onClick={handleAddUsuario}
                      disabled={!novoLogin.trim()}
                      className="btn-primary text-xs px-4 py-2 whitespace-nowrap"
                    >
                      Adicionar
                    </button>
                  </div>
                )}

                {usuarios.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhum usuário vinculado.</p>
                ) : (
                  <ul className="space-y-1">
                    {usuarios.map(u => (
                      <li key={u.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <span className="text-sm text-slate-700">{u.loginAd}</span>
                        {isAdmin && (
                          <button onClick={() => handleRemoveUsuario(u.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                            Remover
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {!selected && !editando && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex items-center justify-center">
              <p className="text-sm text-slate-400">Selecione um perfil para ver os detalhes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissoesViewer({ permissoes }: { permissoes: string }) {
  const perms = parsePerms(permissoes);
  const entries = Object.entries(perms);

  if (entries.length === 0) return <p className="text-xs text-slate-400">Sem permissões definidas.</p>;

  return (
    <div className="space-y-2">
      {entries.map(([modulo, actions]) => {
        const def = MODULOS.find(m => m.id === modulo);
        return (
          <div key={modulo} className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{def?.label ?? modulo}</span>
            <div className="flex gap-1">
              {(actions as string[]).map(a => (
                <span key={a} className="text-[10px] bg-funcesi-blue/10 text-funcesi-blue px-1.5 py-0.5 rounded font-medium">
                  {ACTION_LABELS[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PermissoesEditor({ perms, onChange }: {
  perms: Record<string, string[]>;
  onChange: (p: Record<string, string[]>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-600">Permissões</p>
      {MODULOS.map(modulo => (
        <div key={modulo.id} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-600 w-40 flex-shrink-0">{modulo.label}</span>
          <div className="flex gap-2 flex-wrap">
            {modulo.actions.map(action => {
              const active = (perms[modulo.id] ?? []).includes(action);
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => onChange(toggleAction(perms, modulo.id, action))}
                  className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    active
                      ? 'bg-funcesi-blue text-white border-funcesi-blue'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {ACTION_LABELS[action]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
