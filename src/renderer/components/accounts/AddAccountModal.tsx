import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2, Globe, Cookie, MessageSquare } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginBrowser: (group?: string) => Promise<void>;
  onAddCookie?: (cookie: string, group?: string) => Promise<void>;
  onBulkImport?: (input: string, format: 'user:pass' | 'cookies') => Promise<Array<{ success: boolean; message: string; accountId?: string }>>;
}

type TabId = 'login' | 'cookie' | 'bulk';

interface BulkResult {
  line: number;
  success: boolean;
  message: string;
  accountId?: string;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onLoginBrowser, onAddCookie, onBulkImport }) => {
  const [group, setGroup] = React.useState('Default');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>('login');

  // Cookie tab
  const [cookie, setCookie] = React.useState('');

  // Bulk import tab
  const [bulkInput, setBulkInput] = React.useState('');
  const [bulkFormat, setBulkFormat] = React.useState<'user:pass' | 'cookies'>('user:pass');
  const [bulkResults, setBulkResults] = React.useState<BulkResult[]>([]);

  // Focus trap refs
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);
  const firstFocusableElement = React.useRef<HTMLElement | null>(null);
  const lastFocusableElement = React.useRef<HTMLElement | null>(null);

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

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) {
      setError('Ingrese al menos una cuenta');
      return;
    }
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      setError('Ingrese al menos una cuenta válida');
      return;
    }
    if (lines.length > 50) {
      setError('Máximo 50 cuentas permitidas');
      return;
    }
    setLoading(true);
    setError(null);
    setBulkResults([]);
    try {
      const results = await onBulkImport?.(bulkInput, bulkFormat);
      if (results) {
        setBulkResults(results.map((r, i) => ({ line: i + 1, ...r })));
      }
    } catch (e) {
      setError((e as Error).message || 'Error al procesar la importación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setCookie('');
      setGroup('Default');
      setBulkInput('');
      setBulkFormat('user:pass');
      setBulkResults([]);
      setActiveTab('login');
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            firstFocusableElement.current = focusableElements[0];
            lastFocusableElement.current = focusableElements[focusableElements.length - 1];
            firstFocusableElement.current.focus();
          }
        }
      });
    } else {
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  };

  const tabButtonClass = (tab: TabId) =>
    `flex-1 px-4 py-2 text-sm font-medium ${
      activeTab === tab
        ? 'text-primary border-b-2 border-primary'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-account-modal-title"
          onKeyDown={handleKeyDown}
          ref={modalRef}
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
                <h2 id="add-account-modal-title" className="text-lg font-semibold text-foreground">
                  Agregar Cuenta
                </h2>
              </div>
              <button onClick={handleClose} className="p-1 rounded hover:bg-muted" disabled={loading} aria-label="Cerrar">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex border-b border-border/50">
                <button onClick={() => setActiveTab('login')} className={tabButtonClass('login')} disabled={loading}>
                  Iniciar sesión
                </button>
                <button onClick={() => setActiveTab('cookie')} className={tabButtonClass('cookie')} disabled={loading}>
                  Cookie
                </button>
                <button onClick={() => setActiveTab('bulk')} className={tabButtonClass('bulk')} disabled={loading}>
                  Importación Masiva
                </button>
              </div>
            </div>

            {/* Tab: Login */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">Iniciar sesión en Roblox</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Se abrirá una ventana de navegador. Inicia sesión normalmente en Roblox
                    y capturaremos tu sesión automáticamente.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Grupo (opcional)</label>
                  <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Default" className="w-full" disabled={loading} />
                </div>
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 border border-border/50">
                  🔒 Tu sesión se captura localmente. La cookie se cifra con AES-256-GCM y nunca sale de tu PC.
                </div>
                <Button variant="default" size="default" onClick={handleBrowserLogin} disabled={loading} className="w-full h-11">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Abriendo navegador...</>
                  ) : (
                    <><Globe className="mr-2 h-4 w-4" />Iniciar sesión en Roblox</>
                  )}
                </Button>
              </div>
            )}

            {/* Tab: Cookie */}
            {activeTab === 'cookie' && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Cookie className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">Agregar con Cookie</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Pega tu cookie .ROBLOSECURITY. Debe comenzar con <code className="text-primary/80">_|WARNING:-DO-NOT-SHARE|_</code>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Cookie className="h-3.5 w-3.5" />Cookie .ROBLOSECURITY
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
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}
                <Button variant="default" size="default" onClick={handleCookieSubmit} disabled={loading || !cookie.trim()} className="w-full h-11">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
                  ) : (
                    <><Cookie className="mr-2 h-4 w-4" />Agregar Cuenta</>
                  )}
                </Button>
              </div>
            )}

            {/* Tab: Bulk Import */}
            {activeTab === 'bulk' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">Importación Masiva</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Importa múltiples cuentas. Una por línea. Máximo 50 cuentas.
                  </p>
                </div>

                {/* Format selector */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Formato</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBulkFormat('user:pass')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border ${
                        bulkFormat === 'user:pass' ? 'text-primary border-primary' : 'text-muted-foreground border-border/30 hover:text-foreground'
                      }`}
                    >
                      user:pass
                    </button>
                    <button
                      onClick={() => setBulkFormat('cookies')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border ${
                        bulkFormat === 'cookies' ? 'text-primary border-primary' : 'text-muted-foreground border-border/30 hover:text-foreground'
                      }`}
                    >
                      Cookies
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Cuentas</label>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={bulkFormat === 'user:pass' ? 'user1:pass1\nuser2:pass2' : '_|WARNING:-DO-NOT-SHARE|_cookie1\n_|WARNING:-DO-NOT-SHARE|_cookie2'}
                    rows={6}
                    disabled={loading}
                    className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none font-mono"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}

                <Button variant="default" size="default" onClick={handleBulkImport} disabled={loading || !bulkInput.trim()} className="w-full h-11">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</>
                  ) : (
                    <><MessageSquare className="mr-2 h-4 w-4" />Importar</>
                  )}
                </Button>

                {/* Results */}
                {bulkResults.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Resultados ({bulkResults.filter(r => r.success).length} ok, {bulkResults.filter(r => !r.success).length} errores)
                    </h4>
                    <div className="max-h-40 overflow-y-auto border border-border/50 rounded-md">
                      {bulkResults.map((r, idx) => (
                        <div key={idx} className={`p-2.5 border-b border-border/50 flex items-start gap-2 ${r.success ? 'bg-success/5' : 'bg-destructive/5'}`}>
                          {r.success ? (
                            <MessageSquare className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm text-foreground">{r.message}</p>
                            {r.accountId && <p className="text-xs text-muted-foreground mt-0.5">ID: {r.accountId}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddAccountModal;
