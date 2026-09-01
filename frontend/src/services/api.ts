import keycloak from '../keycloak';
import type { PerfilDto } from '../types/auth';
import type {
  PerfilAcessoResponse, PerfilAcessoRequest,
  UsuarioPerfilResponse, UsuarioPerfilRequest,
} from '../types/perfis';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = keycloak.token;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    me:     () => request<{ sub: string; username: string; email: string; name: string }>('/api/auth/me'),
    perfil: () => request<PerfilDto>('/api/auth/perfil'),
  },

  perfis: {
    list:         ()           => request<PerfilAcessoResponse[]>('/api/perfis'),
    getById:      (id: number) => request<PerfilAcessoResponse>(`/api/perfis/${id}`),
    create:       (body: PerfilAcessoRequest)  => request<{ id: number }>('/api/perfis', { method: 'POST', body: JSON.stringify(body) }),
    update:       (id: number, body: PerfilAcessoRequest) => request<void>(`/api/perfis/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete:       (id: number) => request<void>(`/api/perfis/${id}`, { method: 'DELETE' }),
    getUsuarios:  (id: number) => request<UsuarioPerfilResponse[]>(`/api/perfis/${id}/usuarios`),
    addUsuario:   (id: number, body: UsuarioPerfilRequest) => request<{ id: number }>(`/api/perfis/${id}/usuarios`, { method: 'POST', body: JSON.stringify(body) }),
    removeUsuario:(perfilId: number, usuarioId: number) => request<void>(`/api/perfis/${perfilId}/usuarios/${usuarioId}`, { method: 'DELETE' }),
  },

  indicadores: {
    notasProvas: (codPerlet: string, ra: string, codTurma: string) => {
      const qs = new URLSearchParams({ codPerlet, ra, codTurma });
      return request<import('../types/indicadores').NotaProvaResult[]>(`/api/indicadores/notas-provas?${qs}`);
    },
    notasEtapas: (codPerlet: string, ra: string, codTurma: string, tipoEtapa: string) => {
      const qs = new URLSearchParams({ codPerlet, ra, codTurma, ...(tipoEtapa ? { tipoEtapa } : {}) });
      return request<import('../types/indicadores').NotaEtapaResult[]>(`/api/indicadores/notas-etapas?${qs}`);
    },
  },

  subturmas: {
    list: (codPerlet: string, codTurma: string, maxAlunos: number) => {
      const qs = new URLSearchParams({ codPerlet, codTurma, maxAlunos: String(maxAlunos) });
      return request<import('../types/subturmas').SubturmaResult[]>(`/api/subturmas?${qs}`);
    },
    limitar: (body: { codColigada: number; idTurmaDisc: number; idTurmaDiscGerenciada: number; codSubturma: string; maxAlunos: number; apenasEsta: boolean }) =>
      request<void>('/api/subturmas/maxalunos', { method: 'PUT', body: JSON.stringify(body) }),
  },
};
