// Application Component: AddAccountModal — tabs: login browser / cookie / bulk

import { useState } from 'react';
import { Globe, Cookie, Upload, Loader2 } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useUIStore } from '../store/uiStore';
import { useAccounts } from '../hooks/useAccounts';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoginBrowser: () => Promise<{ success: boolean; error?: string }>;
}

type Tab = 'browser' | 'cookie' | 'bulk';

export function AddAccountModal({ open, onClose, onLoginBrowser }: Props): JSX.Element {
  const notify = useUIStore((s) => s.notify);
  const { addAccount } = useAccounts();
  const [tab, setTab] = useState<Tab>('browser');
  const [cookie, setCookie] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBrowser = async () => {
    setLoading(true);
    notify('info', 'Abriendo navegador de login...');
    await onLoginBrowser();
    setLoading(false);
    onClose();
  };

  const handleCookie = async () => {
    if (!cookie.trim()) { notify('error', 'Pega una cookie válida'); return; }
    setLoading(true);
    const result = await addAccount(cookie.trim());
    if (result.success) { setCookie(''); onClose(); }
    setLoading(false);
  };

  const handleBulk = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const accounts = lines.map((line) => {
      const [username, password] = line.split(':');
      return { username: username?.trim() ?? '', password: password?.trim() ?? '' };
    }).filter((a) => a.username && a.password);
    
    if (accounts.length === 0) { notify('error', 'Formato: usuario:password por línea'); setLoading(false); return; }
    
    let added = 0;
    for (const a of accounts) {
      try {
        const loginResult = await window.api.account.login(a.username, a.password);
        if (loginResult.success) {
          const cookieResult = (loginResult as { data: { cookie: string } }).data?.cookie;
          if (cookieResult) {
            const addResult = await addAccount(cookieResult);
            if (addResult.success) added++;
          }
        }
      } catch { /* skip failed */ }
    }
    notify(added > 0 ? 'success' : 'error', `${added} cuentas agregadas`);
    if (added > 0) { setBulkText(''); onClose(); }
    setLoading(false);
  };

  const tabs: { key: Tab; icon: typeof Globe; label: string }[] = [
    { key: 'browser', icon: Globe, label: 'Navegador' },
    { key: 'cookie', icon: Cookie, label: 'Cookie' },
    { key: 'bulk', icon: Upload, label: 'Bulk Import' },
  ];

  return (
    <ModalShell open={open} onClose={onClose} title="Agregar cuenta" width={440}>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#2a2a4e] pb-2">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key ? 'text-[#3b82f6] border-b-2 border-[#3b82f6] -mb-2' : 'text-[#666] hover:text-[#eee]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Browser tab */}
      {tab === 'browser' && (
        <div className="space-y-4">
          <p className="text-xs text-[#aaa]">Se abrirá un navegador para iniciar sesión en Roblox. La cookie se capturará automáticamente.</p>
          <Button variant="primary" onClick={handleBrowser} disabled={loading} className="w-full">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Abrir navegador
          </Button>
        </div>
      )}

      {/* Cookie tab */}
      {tab === 'cookie' && (
        <div className="space-y-3">
          <textarea
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="Pega la cookie .ROBLOSECURITY aquí..."
            className="w-full h-24 px-3 py-2 text-xs bg-[#0d0d1a] border border-[#2a2a4e] rounded text-[#eee] placeholder:text-[#666] focus:outline-none focus:border-[#3b82f6] resize-none"
          />
          <Button variant="primary" onClick={handleCookie} disabled={loading || !cookie.trim()} className="w-full">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Cookie size={14} />}
            Agregar cookie
          </Button>
        </div>
      )}

      {/* Bulk tab */}
      {tab === 'bulk' && (
        <div className="space-y-3">
          <p className="text-xs text-[#aaa]">Formato: una cuenta por línea como usuario:password</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'usuario1:password1\nusuario2:password2'}
            className="w-full h-32 px-3 py-2 text-xs bg-[#0d0d1a] border border-[#2a2a4e] rounded text-[#eee] placeholder:text-[#666] focus:outline-none focus:border-[#3b82f6] resize-none font-mono"
          />
          <Button variant="primary" onClick={handleBulk} disabled={loading || !bulkText.trim()} className="w-full">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Importar
          </Button>
        </div>
      )}
    </ModalShell>
  );
}
