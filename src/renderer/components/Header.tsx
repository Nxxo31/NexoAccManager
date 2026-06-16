import { useTranslation } from 'react-i18next';

interface HeaderProps {
  activeView: 'accounts' | 'servers' | 'settings' | 'presence' | 'auth';
  onViewChange: (view: 'accounts' | 'servers' | 'settings' | 'presence' | 'auth') => void;
}

export default function Header({ activeView, onViewChange }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#2f3640] border-b border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center font-bold text-sm">
          NX
        </div>
        <h1 className="text-lg font-semibold tracking-tight">NexoAccManager</h1>
      </div>

      <nav className="flex gap-1">
        <button
          onClick={() => onViewChange('accounts')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'accounts' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navAccounts')}
        </button>
        <button
          onClick={() => onViewChange('servers')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'servers' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navServers')}
        </button>
        <button
          onClick={() => onViewChange('presence')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'presence' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navPresence')}
        </button>
        <button
          onClick={() => onViewChange('auth')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'auth' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navAuth')}
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'settings' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navSettings')}
        </button>
      </nav>
    </header>
  );
}