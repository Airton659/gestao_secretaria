import { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { SubturmasPage } from './pages/subturmas/SubturmasPage';
import { PerfisScreen } from './pages/admin/PerfisScreen';
import { SemAcessoPage } from './pages/SemAcessoPage';
import keycloak from './keycloak';

function ProtectedRoute() {
  useEffect(() => {
    if (!keycloak.authenticated) {
      keycloak.login({ redirectUri: window.location.href });
    }
  }, []);

  if (!keycloak.authenticated) return null;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/sem-acesso', element: <SemAcessoPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/',              element: <HomePage /> },
          { path: '/subturmas',     element: <SubturmasPage /> },
          { path: '/admin/perfis',  element: <PerfisScreen /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
], {
  basename: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined,
});
