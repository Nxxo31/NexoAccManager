import * as React from 'react';
import { ModalShell } from '@renderer/components/modal/ModalShell';
import { X, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginBrowser: (group?: string) => Promise<void>;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onLoginBrowser }) => {
  const [group, setGroup] = React.useState('Default');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setGroup('Default');
      onClose();
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Agregar cuenta" className="w-full max-w-md">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 id="add-account-modal-title" className="text-lg font-semibold text-foreground">Agregar Cuenta</h2>
        </div>
        <button onClick={handleClose} className="p-1 rounded hover:bg-muted" disabled={loading} aria-label="Cerrar">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1.5">Iniciar sesion en Roblox</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Se abrira una ventana de navegador. Inicia sesion normalmente en Roblox y capturaremos tu sesion automaticamente.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Grupo</label>
          <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Default" className="w-full" disabled={loading} />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 border border-border/50">
          Tu sesion se captura localmente. La cookie se cifra con AES-256-GCM y nunca sale de tu PC.
        </div>

        <Button variant="default" size="default" onClick={handleBrowserLogin} disabled={loading} className="w-full h-11">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Abriendo navegador...</>
          ) : (
            <><Globe className="mr-2 h-4 w-4" />Iniciar sesion en Roblox</>
          )}
        </Button>
      </div>
    </ModalShell>
  );
};

export default AddAccountModal;