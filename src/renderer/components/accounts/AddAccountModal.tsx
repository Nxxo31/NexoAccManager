import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2, Globe, Cookie } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginBrowser: (group?: string) => Promise<void>;
  onAddCookie?: (cookie: string, group?: string) => Promise<void>;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onLoginBrowser, onAddCookie }) => {
  const [group, setGroup] = React.useState('Default');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [cookie, setCookie] = React.useState('');

  const handleBrowserLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await onLoginBrowser(group.trim() || 'Default');
      setGroup('Default');
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleCookieSubmit = async () => {
    if (!cookie.trim()) {
      setError('Pega una cookie .ROBLOSECURITY válida');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onAddCookie?.(cookie.trim(), group.trim() || 'Default');
      setCookie('');
      setGroup('Default');
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Error al agregar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setCookie('');
      setGroup('Default');
      setShowAdvanced(false);
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
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Agregar Cuenta</h2>
              </div>
              <button onClick={handleClose} className="p-1 rounded hover:bg-muted" disabled={loading}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Browser login — método principal */}
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  Iniciar sesión en Roblox
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Se abrirá una ventana de navegador. Inicia sesión normalmente en Roblox
                  y capturaremos tu sesión automáticamente.
                </p>
              </div>

              {/* Group field */}
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
                🔒 Tu sesión se captura localmente. La cookie se cifra con AES-256-GCM y nunca sale de tu PC.
              </div>

              {/* Browser login button */}
              <Button
                variant="default"
                size="default"
                onClick={handleBrowserLogin}
                disabled={loading}
                className="w-full h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abriendo navegador...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Iniciar sesión en Roblox
                  </>
                )}
              </Button>

              {/* Advanced toggle */}
              <div className="pt-2 border-t border-border/30">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showAdvanced ? '▼' : '▶'} Opciones avanzadas (cookie manual)
                </button>

                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pt-3 space-y-3"
                  >
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                        <Cookie className="h-3.5 w-3.5" />
                        Cookie .ROBLOSECURITY
                      </label>
                      <textarea
                        value={cookie}
                        onChange={(e) => setCookie(e.target.value)}
                        placeholder="Pega tu cookie aquí... (solo para usuarios avanzados)"
                        rows={3}
                        disabled={loading}
                        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none font-mono"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCookieSubmit}
                      disabled={loading || !cookie.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Cookie className="mr-2 h-3.5 w-3.5" />
                      )}
                      Agregar con Cookie
                    </Button>
                    <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                      ⚠️ Este método es para usuarios avanzados. La cookie debe empezar con{' '}
                      <code className="text-primary/80">_|WARNING:-DO-NOT-SHARE|_</code>.
                      Puedes obtenerla de las DevTools del navegador.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAccountModal;
