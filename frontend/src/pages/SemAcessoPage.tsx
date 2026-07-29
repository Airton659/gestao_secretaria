import keycloak from '../keycloak';

export function SemAcessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-base font-bold text-slate-800 mb-2">Acesso não autorizado</h1>
        <p className="text-sm text-slate-500 mb-6">
          Sua conta não tem permissão para acessar este sistema. Solicite acesso ao administrador.
        </p>
        <button
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
          className="btn-secondary text-sm px-6 py-2.5 w-full"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
