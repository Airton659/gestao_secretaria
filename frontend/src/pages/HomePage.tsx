import { useNavigate } from 'react-router-dom';
import { usePerfil } from '../contexts/PerfilContext';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  disabled?: boolean;
}

function FeatureCard({ title, description, icon, to, disabled }: FeatureCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => !disabled && navigate(to)}
      disabled={disabled}
      className={`
        group text-left bg-white rounded-2xl border border-slate-200 p-6
        transition-all duration-200
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-funcesi-blue hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
        }
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-4
        bg-funcesi-blue/10 text-funcesi-blue
        ${!disabled && 'group-hover:bg-funcesi-blue group-hover:text-white'}
        transition-colors duration-200
      `}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      {disabled && (
        <span className="inline-block mt-3 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          Em breve
        </span>
      )}
    </button>
  );
}

function IconSubturmas() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function HomePage() {
  const { perfil } = usePerfil();

  const firstName = perfil?.name?.split(' ')[0] ?? perfil?.username ?? '';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Olá{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecione uma funcionalidade para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          title="Controle de Subturmas"
          description="Gerencie subturmas de disciplinas no Totvs de forma simplificada."
          icon={<IconSubturmas />}
          to="/subturmas"
        />
        {/* Novas funcionalidades serão adicionadas aqui */}
      </div>
    </div>
  );
}
