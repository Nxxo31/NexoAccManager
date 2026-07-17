import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Globe, KeyRound, Link2, Zap, Copy, Check, Settings as SettingsIcon,
} from 'lucide-react';
import { Account } from '@/types/Account';
import { useTranslation } from 'react-i18next';

interface AccountDetailPanelProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (account: Account) => void;
  onOpenBrowser: (account: Account) => void;
  onCopyPassword: (account: Account) => void;
  onCopyRbxPlayer: (account: Account) => void;
  onQuickLogin: (account: Account) => void;
  onEditAlias: (account: Account) => void;
  onEditDescription: (account: Account) => void;
  onCopyPlaceId: (id: string) => void;
}

const PresenceState = ({ account }: { account: Account }) => {
  const { t } = useTranslation();
  const p = (account as any)?.presence;
  const type = p?.userPresenceType ?? 0;

  const config = [
    { color: '#8A8F98', label: t('presence.offline', 'Desconectado') },
    { color: '#2ED573', label: t('presence.online', 'En línea') },
    { color: '#6347FF', label: t('presence.inGame', 'En juego') },
    { color: '#FFA502', label: t('presence.inStudio', 'En Studio') },
    { color: '#4A4D52', label: t('presence.hidden', 'Oculto') },
  ];

  const { color, label } = config[type] || config[0];

  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      {p?.lastLocation && (
        <span className="text-xs text-muted-foreground font-mono truncate ml-auto">
          {p.lastLocation}
        </span>
      )}
    </div>
  );
};

const CookieStatus = ({ account }: { account: Account }) => {
  const { t } = useTranslation();
  const expiry = account.cookieExpiresAt ? new Date(account.cookieExpiresAt) : null;
  const now = new Date();
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  let color = '#2ED573';
  let label = t('cookie.valid', 'Cookie válida');
  if (daysLeft !== null && expiry) {
    if (daysLeft < 0) { color = '#FF4757'; label = t('cookie.expired', 'Cookie expirada'); }
    else if (daysLeft <= 7) { color = '#FFA502'; label = t('cookie.expiring', `Expira en ${daysLeft}d`); }
    else { label = t('cookie.validUntil', `Expira: ${expiry.toLocaleDateString()}`); }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
};

export const AccountDetailPanel: React.FC<AccountDetailPanelProps> = ({
  account,
  isOpen,
  onClose,
  onLaunch,
  onOpenBrowser,
  onCopyPassword,
  onCopyRbxPlayer,
  onQuickLogin,
  onEditAlias,
  onEditDescription,
  onCopyPlaceId,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  if (!account) return null;

  const handleCopyPlaceId = () => {
    if (account.savedPlaceId) {
      onCopyPlaceId(account.savedPlaceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 h-full w-80 bg-bg-card border-l border-border z-50 overflow-y-auto"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            role="complementary"
            aria-label={t('detail.panelTitle', 'Detalles de la cuenta')}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-bg-card z-10">
              <h2 className="text-sm font-bold">{t('detail.title', 'Detalles')}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-bg-surface transition-colors"
                aria-label={t('common.close', 'Cerrar')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Avatar + Identity */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt={account.username} className="w-full h-full object-cover" />
                  ) : (
                    account.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate">{account.username}</h3>
                  {account.displayName && account.displayName !== account.username && (
                    <p className="text-sm text-muted-foreground truncate">{account.displayName}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {account.robloxUserId}
                  </p>
                </div>
              </div>

              {/* Group + Description */}
              <div className="space-y-2">
                {account.group && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('detail.group', 'Grupo')}:</span>
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                      {account.group}
                    </span>
                  </div>
                )}
                {account.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => onEditDescription(account)}
                    title={t('detail.editDescription', 'Click para editar')}
                  >
                    {account.description}
                  </p>
                )}
              </div>

              {/* Presence */}
              <div className="space-y-1.5 py-2 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('detail.presence', 'Presencia')}
                </h4>
                <PresenceState account={account} />
              </div>

              {/* Cookie Status */}
              <div className="space-y-1.5 py-2 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('detail.cookie', 'Cookie')}
                </h4>
                <CookieStatus account={account} />
              </div>

              {/* Saved Place/Job ID */}
              {(account.savedPlaceId || account.savedJobId) && (
                <div className="space-y-1.5 py-2 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('detail.savedServer', 'Server guardado')}
                  </h4>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-muted-foreground">Place:</span>
                    <span className="flex-1 truncate">{account.savedPlaceId || '—'}</span>
                    {account.savedPlaceId && (
                      <button onClick={handleCopyPlaceId} className="p-1 rounded hover:bg-bg-surface transition-colors" aria-label="Copy Place ID">
                        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                      </button>
                    )}
                  </div>
                  {account.savedJobId && (
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-muted-foreground">Job:</span>
                      <span className="flex-1 truncate">{account.savedJobId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('detail.actions', 'Acciones')}
                </h4>
                <button
                  onClick={() => onLaunch(account)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  {t('detail.launch', 'Iniciar Juego')}
                </button>
                <button
                  onClick={() => onOpenBrowser(account)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors border border-border"
                >
                  <Globe className="h-4 w-4" />
                  {t('detail.browser', 'Abrir en Navegador')}
                </button>
                <button
                  onClick={() => onCopyPassword(account)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors border border-border"
                >
                  <KeyRound className="h-4 w-4" />
                  {t('detail.copyPassword', 'Copiar Contraseña')}
                </button>
                <button
                  onClick={() => onCopyRbxPlayer(account)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors border border-border"
                >
                  <Link2 className="h-4 w-4" />
                  {t('detail.copyRbx', 'Copiar rbx-player')}
                </button>
                <button
                  onClick={() => onQuickLogin(account)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors border border-border"
                >
                  <Zap className="h-4 w-4" />
                  {t('detail.quickLogin', 'Login Rápido')}
                </button>
              </div>

              {/* Friends */}
                            {(account as any).friends && (account as any).friends.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-border">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {t('detail.friends', 'Amigos')} ({(account as any).friends.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {(account as any).friends.slice(0, 10).map((friend: any) => {
                                    const fType = friend?.presence?.userPresenceType ?? 0;
                                    const fColors = ['#8A8F98', '#2ED573', '#6347FF', '#FFA502', '#4A4D52'];
                                    return (
                                      <div key={friend.id || friend.userId} className="flex items-center gap-2 text-sm">
                                        <div
                                          className={`w-2 h-2 rounded-full flex-shrink-0`}
                                          style={{ backgroundColor: fColors[fType] || fColors[0] }}
                                        />
                                        <span className="truncate">{friend.username || friend.displayName || 'Unknown'}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
              
                            {/* Utilities */}
                            <div className="space-y-2 pt-2 border-t border-border">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t('detail.utilities', 'Utilidades')}
                              </h4>
                              <div className="space-y-1">
                                <button
                                  onClick={() => onOpenBrowser(account)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors"
                                >
                                  <Globe className="h-3 w-3" />
                                  <span>{t('detail.utilities.browseProfile', 'Ver perfil en web')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    // Change password - opens browser to Roblox password change page
                                    window.open('https://www.roblox.com/my/account#!/security', '_blank');
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors"
                                >
                                  <KeyRound className="h-3 w-3" />
                                  <span>{t('detail.utilities.changePassword', 'Cambiar contraseña')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    // Change email - opens browser to Roblox email change page
                                    window.open('https://www.roblox.com/my/account#!/settings', '_blank');
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors"
                                >
                                  <Link2 className="h-3 w-3" />
                                  <span>{t('detail.utilities.changeEmail', 'Cambiar email')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    // Change display name - opens browser to Roblox display name change
                                    window.open('https://www.roblox.com/my/account#!/settings', '_blank');
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors"
                                >
                                  <SettingsIcon className="h-3 w-3" />
                                  <span>{t('detail.utilities.changeDisplayName', 'Cambiar nombre visible')}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    // Log out other sessions - IPC settings:security:logout-all
                                    const api = (window as any).api;
                                    if (api?.settings?.security) {
                                      api.settings.security.logoutAll();
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg-surface text-foreground text-sm hover:bg-bg-elevated transition-colors"
                                >
                                  <Zap className="h-3 w-3" />
                                  <span>{t('detail.utilities.logoutOtherSessions', 'Cerrar otras sesiones')}</span>
                                </button>
                              </div>
                            </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

AccountDetailPanel.displayName = 'AccountDetailPanel';
