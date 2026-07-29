import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePerfil } from '../contexts/PerfilContext';
import keycloak from '../keycloak';

function getInitials(name: string | null | undefined, username: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return (username?.[0] ?? '?').toUpperCase();
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}

function canSee(isAdmin: boolean, permissoes: string, modulos: string[]): boolean {
  if (isAdmin) return true;
  try {
    const perms = JSON.parse(permissoes) as Record<string, string[]>;
    return modulos.some(m => perms[m]?.includes('read'));
  } catch { return false; }
}

export function AppNavbar() {
  const { perfil }    = usePerfil();
  const navigate      = useNavigate();
  const { pathname }  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials    = getInitials(perfil?.name, perfil?.username);
  const displayName = perfil?.name?.split(' ').slice(0, 2).join(' ') ?? perfil?.username ?? '…';
  const perfilLabel = perfil?.perfilNome ?? '…';

  const showAdmin = perfil && canSee(perfil.isAdmin, perfil.permissoes, ['acessos']);

  function logout() {
    keycloak.logout({ redirectUri: window.location.origin + import.meta.env.BASE_URL });
  }

  function navLink(label: string, to: string) {
    const active = pathname === to || pathname.startsWith(to + '/');
    return (
      <button
        key={to}
        onClick={() => { navigate(to); setMenuOpen(false); }}
        className={`text-[13px] px-3 py-1.5 rounded-md transition-colors ${
          active ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <>
      {/* Desktop */}
      <header className="hidden md:flex bg-funcesi-blue text-white px-8 h-12 items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-base font-extrabold tracking-tight">FUNCESI</span>
          <span className="w-px h-5 bg-white/25 flex-shrink-0" />
          <span className="text-sm text-white/75">Secretaria</span>
        </div>

        <nav className="flex items-center gap-1">
          {navLink('Início', '/')}
          {showAdmin && navLink('Acesso', '/admin/perfis')}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right hidden lg:block">
            <div className="text-xs font-medium leading-tight">{displayName}</div>
            <div className="text-[11px] text-white/50 leading-tight">{perfilLabel}</div>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-[11px] font-bold">
            {initials}
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition-colors"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      {/* Mobile */}
      <header className="md:hidden bg-funcesi-blue text-white px-5 h-12 flex items-center justify-between flex-shrink-0 shadow-sm relative z-50">
        <div className="flex items-center gap-3">
          <span className="text-base font-extrabold tracking-tight">FUNCESI</span>
          <span className="text-sm text-white/60">Secretaria</span>
        </div>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="text-white text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMenuOpen(false)} />
          <div className="md:hidden fixed top-12 left-0 right-0 bottom-0 bg-funcesi-blue text-white z-50 flex flex-col px-6 pt-4 pb-6">
            <nav className="flex flex-col gap-1">
              {navLink('Início', '/')}
              {showAdmin && navLink('Acesso', '/admin/perfis')}
            </nav>
            <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/10">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-[11px] font-bold">{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{displayName}</div>
                <div className="text-[11px] text-white/50">{perfilLabel}</div>
              </div>
              <button onClick={logout} className="text-white/60 hover:text-white p-1.5 rounded-md transition-colors">
                <IconLogout />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
