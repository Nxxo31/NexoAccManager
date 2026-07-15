import * as React from 'react';
import {
  Plus,
  Trash2,
  EyeOff,
  AppWindow,
  Shuffle,
  Server,
  Settings as SettingsIcon,
  Gamepad2,
  X,
  Copy,
  Check,
  Loader2,
  Play,
  UserPlus,
} from 'lucide-react';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';
import { Account } from '@/types/Account';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { ModalShell } from '@renderer/components/modal/ModalShell';
import { ChevronDown } from 'lucide-react';

interface DockProps {
  placeId: string;
  setPlaceId: (v: string) => void;
  jobId: string;
  setJobId: (v: string) => void;
  jobIdShuffle: boolean;
  toggleJobIdShuffle: () => void;
  launching: boolean;
  selectedAccount: Account | null;
  handleJoinServer: () => Promise<void>;
  handleLaunchApp: () => void;
  setActiveModal: (modal: 'servers' | 'settings' | null) => void;
  onAddAccount: () => void;
  hideUsernames: boolean;
  setHideUsernames: (v: boolean) => void;
  accounts: Account[];
  setSelectedAccount: (account: Account | null) => void;
  onPlayAccount: (account: Account) => void;
  // For the More dropdown
  onEditAlias: (account: Account) => void;
  onEditDescription: (account: Account) => void;
  onCopyPlaceId: (placeId: string) => void;
  onCopyRbxlLink: (account: Account) => void;
  onToggleAutoRelaunch: (account: Account) => void;
  onToggleConnectionWatcher: (account: Account) => void;
}

export const Dock: React.FC<DockProps> = ({
  placeId,
  setPlaceId,
  jobId,
  setJobId,
  jobIdShuffle,
  toggleJobIdShuffle,
  launching,
  selectedAccount,
  handleJoinServer,
  handleLaunchApp,
  setActiveModal,
  onAddAccount,
  hideUsernames,
  setHideUsernames,
  accounts,
  setSelectedAccount,
  onPlayAccount,
  onEditAlias,
  onEditDescription,
  onCopyPlaceId,
  onCopyRbxlLink,
  onToggleAutoRelaunch,
  onToggleConnectionWatcher,
}) => {
  const handleCopyPlaceId = () => {
    if (placeId) {
      navigator.clipboard.writeText(placeId);
      setCopiedPlaceId(true);
      setTimeout(() => setCopiedPlaceId(false), 2000);
    }
  };

  const [copiedPlaceId, setCopiedPlaceId] = React.useState(false);

  // Determine the label and icon for the Jugar button
  const jugarLabel = placeId ? 'Join Server' : 'Abrir App';
  const jugarIcon = placeId ? <Server className="h-3.5 w-3.5" aria-hidden="true" /> : <AppWindow className="h-3.5 w-3.5" aria-hidden="true" />;

  const handleJugarClick = async () => {
    if (placeId) {
      await handleJoinServer();
    } else {
      handleLaunchApp();
    }
  };

  return (
    <>
      {/* First row: Place ID, Job ID, Shuffle */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-t border-border bg-bg-card">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex-shrink-0" htmlFor="place-id-input">Place ID</label>
          <input
            id="place-id-input"
            type="text"
            placeholder="ej: 5315046213"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary font-mono-data"
            aria-label="Place ID"
          />
          <button
            onClick={handleCopyPlaceId}
            disabled={!placeId}
            className="p-1 rounded hover:bg-bg-surface text-muted-foreground disabled:opacity-30"
            aria-label={copiedPlaceId ? "Place ID copiado" : "Copiar Place ID"}
            title="Copiar Place ID"
          >
            {copiedPlaceId ? <Check className="h-3 w-3 text-success" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex-shrink-0" htmlFor="job-id-input">Job ID</label>
          <input
            id="job-id-input"
            type="text"
            placeholder="opcional"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary font-mono-data"
            aria-label="Job ID"
          />
        </div>
        <button
          onClick={toggleJobIdShuffle}
          className={`p-1.5 rounded transition-colors ${jobIdShuffle ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-bg-surface'}`}
          aria-label={jobIdShuffle ? 'Shuffle desactivar' : 'Shuffle activar'}
          title={jobIdShuffle ? 'Shuffle activado' : 'Activar JobId Shuffle'}
        >
          <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Second row: Action buttons */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border-t border-border bg-bg-card">
        {/* LEFT GROUP (account management) */}
        <button
          onClick={onAddAccount}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Añadir cuenta"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Agregar</span>
        </button>
        <button
          onClick={() => selectedAccount && setSelectedAccount(null)} // Deselect
          disabled={!selectedAccount}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-bg-surface text-white hover:bg-bg-elevated border border-border transition-colors"
          aria-label={selectedAccount ? `Deseleccionar ${selectedAccount.username}` : 'Deseleccionar cuenta'}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Eliminar</span>
        </button>
        {/* DIVIDER */}
        <div className="w-px h-5 bg-border mx-1" role="separator" aria-hidden="true" />
        {/* RIGHT GROUP (contextual actions) */}
        <button
          onClick={handleLaunchApp}
          disabled={!selectedAccount}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={selectedAccount ? `Abrir Roblox con ${selectedAccount.username}` : 'Abrir Roblox'}
        >
          <AppWindow className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Abrir App</span>
        </button>
        <div className="flex-1" />
        {/* More dropdown */}
        <div className="relative">
          <button
            onClick={() => { /* toggle dropdown */ }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-white hover:bg-bg-surface rounded-md transition-all-150"
            aria-label="Más opciones"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          {/* Dropdown menu (simple version) */}
          <div className="absolute left-0 mt-2 w-56 rounded-md bg-bg-card border border-border shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  if (selectedAccount) {
                    onEditAlias(selectedAccount);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white hover:bg-bg-surface"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 15H4a2 2 0 0 1-2 2V4a2 2 0 0 1 2 2h9a2 2 0 2 2v1"/></svg>
                Copiar Place ID
              </button>
              <button
                onClick={() => {
                  if (selectedAccount) {
                    onCopyRbxlLink(selectedAccount);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Copiar rbx-player link
                <span className="ml-auto text-[9px] bg-border px-1 rounded">próx</span>
              </button>
              <div className="border-t border-border my-1" role="separator" aria-hidden="true"></div>
              <button
                onClick={() => {
                  if (selectedAccount) {
                    onToggleAutoRelaunch(selectedAccount);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white hover:bg-bg-surface"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Auto Relaunch
                </span>
                <div className="w-7 h-4 rounded-full bg-border"><div className="w-3 h-3 rounded-full bg-text-tertiary mt-0.5 ml-0.5"></div></div>
              </button>
              <button
                onClick={() => {
                  if (selectedAccount) {
                    onToggleConnectionWatcher(selectedAccount);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-white hover:bg-bg-surface"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                  Connection Watcher
                </span>
                <div className="w-7 h-4 rounded-full bg-border"><div className="w-3 h-3 rounded-full bg-text-tertiary mt-0.5 ml-0.5"></div></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Dock.displayName = 'Dock';
