// Application Component: AccountDetailPanel — slide-in detail panel

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Shield, Cookie, Gamepad2, Users, LogOut } from 'lucide-react';
import type { Account } from '../../domain/entities/Account';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AccountDetailPanelProps {
  account: Account | null;
  onClose: () => void;
  onLaunch: () => void;
  onRefreshCookie: () => void;
  onLogoutAll: () => void;
}

export function AccountDetailPanel({ account, onClose, onLaunch, onRefreshCookie, onLogoutAll }: AccountDetailPanelProps): JSX.Element {
  return (
    <AnimatePresence>
      {account && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-80 border-l flex flex-col z-10"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 h-12 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {account.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{account.username}</span>
            </div>
            <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}><X size={16} /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="info">{account.group}</Badge>
                {account.isFavorite && <Badge variant="warning">★</Badge>}
              </div>
              {account.description && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{account.description}</p>}
            </div>

            {/* Cookie status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}><Cookie size={14} /> Estado de cookie</div>
              <Badge variant={account.cookieExpiresAt ? 'success' : 'error'}>
                {account.cookieExpiresAt ? 'Válida' : 'Desconocida'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button variant="primary" size="md" onClick={onLaunch} className="w-full">
                <Gamepad2 size={14} /> Jugar
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={onRefreshCookie}><Cookie size={12} /> Refresh</Button>
                <Button variant="secondary" size="sm" onClick={onLogoutAll}><LogOut size={12} /> Logout All</Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.api?.shell?.openExternal(`https://www.roblox.com/users/${account.robloxUserId}/profile`)}
                className="w-full"
              >
                <ExternalLink size={12} /> Ver perfil
              </Button>
            </div>

            {/* Security shortcuts */}
            <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}><Shield size={14} /> Seguridad</div>
              <Button variant="ghost" size="sm" className="w-full justify-start"><Users size={12} /> Sesiones activas</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
