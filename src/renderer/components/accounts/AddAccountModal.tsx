import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, AlertCircle, Loader2, Cookie, LogIn } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (cookie: string, group?: string) => Promise<void>;
  onLoginAccount: (username: string, password: string, group?: string) => Promise<void>;
}

type Tab = 'cookie' | 'login';

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAddAccount, onLoginAccount }) => {
  const [tab, setTab] = React.useState<Tab>('login');
  const [cookie, setCookie] = React.useState('');
  const [group, setGroup] = React.useState('Default');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCookieSubmit = async () => {
    if (!cookie.trim()) {
      setError('Pega una cookie .ROBLOSECURITY válida');
      return;
    }
    if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
      setError('Formato inválido. La cookie debe empezar con _|WARNING:-DO-NOT-SHARE|_');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onAddAccount(cookie.trim(), group.trim() || 'Default');
      setCookie('');
      setGroup('Default');
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Error al agregar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (!username.trim()) {
      setError('Ingresa tu usuario de Roblox');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña de Roblox');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onLoginAccount(username.trim(), password, group.trim() || 'Default');
      setUsername('');
      setPassword('');
      setGroup('Default');
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setError(null);
    setCookie('');
    setUsername('');
    setPassword('');
    setGroup('Default');
  };

  const handleClose = () => {
    if (!loading) {
      resetState();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Agregar Cuenta</h2>
              </div>
              <button onClick={handleClose} className="p-1 rounded hover:bg-muted" disabled={loading}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-md bg-muted/50 p-1">
              <button
                onClick={() => { setTab('login'); setError(null); }}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                disabled={loading}
              >
                <LogIn className="inline mr-1.5 h-3.5 w-3.5" />
                Usuario y Contraseña
              </button>
              <button
                onClick={() => { setTab('cookie'); setError(null); }}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'cookie' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                disabled={loading}
              >
                <Cookie className="inline mr-1.5 h-3.5 w-3.5" />
                Pegar Cookie
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {tab === 'login' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Usuario de Roblox
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Tu usuario de Roblox"
                        className="w-full pl-9"
                        disabled={loading}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleLoginSubmit()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tu contraseña de Roblox"
                        className="w-full pl-9"
                        disabled={loading}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleLoginSubmit()}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Cookie .ROBLOSECURITY
                    </label>
                    <textarea
                      value={cookie}
                      onChange={(e) => setCookie(e.target.value)}
                      placeholder="Pega tu cookie aquí..."
                      rows={4}
                      disabled={loading}
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none font-mono"
                    />
                  </div>
                </>
              )}

              {/* Group field — shared */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Grupo (opcional)
                </label>
                <Input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Default"
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {/* Security notice */}
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 border border-border/50">
                {tab === 'login' ? (
                  <>🔒 Tus credenciales se envían solo a Roblox via HTTPS. No se almacenan en el dispositivo.</>
                ) : (
                  <>🔒 La cookie se cifra con AES-256-GCM y nunca sale de tu PC.</>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={tab === 'login' ? handleLoginSubmit : handleCookieSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tab === 'login' ? 'Iniciando sesión...' : 'Agregando...'}
                    </>
                  ) : (
                    tab === 'login' ? 'Iniciar Sesión' : 'Agregar Cuenta'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAccountModal;
