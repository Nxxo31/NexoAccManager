// Application View: AccountsView — hub with grid + JoinBar + detail

import { useState, useMemo, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { Globe, Shuffle, Skull, Plus, Users } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';
import { useAccounts } from '../hooks/useAccounts';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountDetailPanel } from '../components/AccountDetailPanel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import type { Account } from '../../domain/entities/Account';

interface AccountsViewProps {
  searchQuery: string;
}

export function AccountsView({ searchQuery }: AccountsViewProps): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const selectedId = useAccountStore((s) => s.selectedId);
  const select = useAccountStore((s) => s.select);
  const update = useAccountStore((s) => s.update);
  const setAccounts = useAccountStore((s) => s.setAccounts);
  const notify = useUIStore((s) => s.notify);
  const { removeAccount, loginBrowser } = useAccounts();
  const [placeId, setPlaceId] = useState('');
  const [jobId, setJobId] = useState('');
  const [shuffle, setShuffle] = useState(false);

  const selected = useMemo(() => accounts.find((a) => a.id === selectedId) ?? null, [accounts, selectedId]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter((a) =>
      a.username.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q),
    );
  }, [accounts, searchQuery]);

  const groups = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const acc of filtered) {
      const g = acc.group || 'Default';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(acc);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const agingDays = useCallback((acc: Account) => {
    const last = new Date(acc.lastUsed);
    return Math.floor((Date.now() - last.getTime()) / 86400000);
  }, []);

  const handleLaunch = async () => {
    if (!selected) return;
    let finalJobId = jobId;
    if (shuffle && placeId) {
      finalJobId = Math.random().toString(36).substring(2, 18);
      setJobId(finalJobId);
    }
    const result = await window.api.roblox.launch(selected.id, placeId || undefined, finalJobId || undefined);
    if (result.success) notify('success', `${selected.username} lanzado`);
    else notify('error', result.error);
  };

  const handleKillAll = async () => {
    const result = await window.api.roblox.killAll();
    if (result.success) notify('success', 'Procesos cerrados');
    else notify('error', result.error);
  };

  const handleToggleFavorite = async (acc: Account) => {
    const newVal = !acc.isFavorite;
    update(acc.id, { isFavorite: newVal });
    await window.api.account.setFavorite(acc.id, newVal);
  };

  const handleRefreshCookie = async () => {
    if (!selected) return;
    const result = await window.api.cookie.refresh(selected.id);
    if (result.success) notify('success', 'Cookie actualizada');
    else notify('error', result.error);
  };

  const handleLogoutAll = async () => {
    if (!selected) return;
    notify('info', 'Cerrando sesiones remotas...');
    notify('warning', 'Función no disponible desde el renderer directamente');
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Users size={48} style={{ opacity: 0.2 }} />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No hay cuentas agregadas</p>
        <Button variant="primary" onClick={() => loginBrowser()}><Plus size={14} /> Iniciar sesión</Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map(([groupName, accs]) => (
          <div key={groupName}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{groupName}</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({accs.length})</span>
            </div>
            <Reorder.Group
              axis="y"
              values={accs}
              onReorder={(newOrder: Account[]) => {
                const others = accounts.filter((a) => a.group !== groupName);
                setAccounts([...newOrder, ...others]);
              }}
              className="space-y-2"
            >
              {accs.map((acc) => (
                <Reorder.Item key={acc.id} value={acc}>
                  <AccountCard
                    account={acc}
                    selected={acc.id === selectedId}
                    onClick={() => select(acc.id)}
                    onRemove={() => removeAccount(acc.id)}
                    onToggleFavorite={() => handleToggleFavorite(acc)}
                    agingDays={agingDays(acc)}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        ))}
      </div>

      {/* JoinBar */}
      <div className="flex items-center gap-2 p-3 border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <Globe size={14} className="flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        <Input value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="Place ID" className="h-8 w-32 text-xs" />
        <Input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ID (opcional)" className="h-8 flex-1 text-xs" />
        <Button variant="ghost" size="sm" onClick={() => setShuffle(!shuffle)} aria-pressed={shuffle}>
          <Shuffle size={14} className={shuffle ? 'text-blue-500' : ''} />
        </Button>
        <Button variant="primary" size="sm" onClick={handleLaunch} disabled={!selected}>Jugar</Button>
        <Button variant="danger" size="sm" onClick={handleKillAll}><Skull size={14} /></Button>
      </div>

      {/* Detail Panel */}
      <AccountDetailPanel
        account={selected}
        onClose={() => select(null)}
        onLaunch={handleLaunch}
        onRefreshCookie={handleRefreshCookie}
        onLogoutAll={handleLogoutAll}
      />
    </div>
  );
}
