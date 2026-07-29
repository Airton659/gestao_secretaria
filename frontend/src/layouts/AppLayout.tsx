import { Outlet, Navigate } from 'react-router-dom';
import { PerfilProvider, usePerfil } from '../contexts/PerfilContext';
import { AppNavbar } from '../components/AppNavbar';

function AppLayoutContent() {
  const { perfil, loading } = usePerfil();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-sm text-slate-400">Verificando acesso...</div>
    </div>
  );

  if (!perfil) return <Navigate to="/sem-acesso" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppNavbar />
      <main className="flex-1 w-full">
        <div className="px-4 py-6 md:px-8 md:py-8 md:max-w-[1140px] md:mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <PerfilProvider>
      <AppLayoutContent />
    </PerfilProvider>
  );
}
