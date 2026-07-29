import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { PerfilDto } from '../types/auth';
import keycloak from '../keycloak';

interface PerfilCtx {
  perfil: PerfilDto | null;
  loading: boolean;
  recarregar: () => void;
}

const PerfilContext = createContext<PerfilCtx>({ perfil: null, loading: true, recarregar: () => {} });

const RETRY_DELAYS = [2000, 4000, 8000]; // 3 tentativas: 2s, 4s, 8s

async function fetchPerfilComRetry(): Promise<PerfilDto | null> {
  for (let tentativa = 0; tentativa <= RETRY_DELAYS.length; tentativa++) {
    try {
      return await api.auth.perfil();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const status = msg.match(/HTTP (\d+)/)?.[1];

      // 401 → redireciona para login, não retenta
      if (status === '401') {
        if (!keycloak.authenticated) keycloak.login({ redirectUri: window.location.href });
        return null;
      }

      // 403 → autenticado mas sem perfil cadastrado, não retenta
      if (status === '403') return null;

      // Erro de rede / API ainda subindo → retenta se ainda há tentativas
      if (tentativa < RETRY_DELAYS.length) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS[tentativa]));
      }
    }
  }
  return null;
}

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil]   = useState<PerfilDto | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    const p = await fetchPerfilComRetry();
    setPerfil(p);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  return (
    <PerfilContext.Provider value={{ perfil, loading, recarregar: carregar }}>
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil() {
  return useContext(PerfilContext);
}
