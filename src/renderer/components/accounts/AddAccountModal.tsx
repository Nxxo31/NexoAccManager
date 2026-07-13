import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (cookie: string, group?: string) => Promise<void>;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAddAccount }) => {
  const [cookie, setCookie] = React.useState('');
  const [group, setGroup] = React.useState('Default');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!cookie.trim()) {
      setError('Please enter a valid .ROBLOSECURITY cookie');
      return;
    }
    if (!cookie.trim().startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
      setError('Invalid cookie format. Must start with _|WARNING:-DO-NOT-SHARE|_');
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
      setError((e as Error).message || 'Failed to add account');
    } finally {
      setLoading(false);
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
          onClick={onClose}
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
                <Cookie className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Add Account</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  .ROBLOSECURITY Cookie
                </label>
                <textarea
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste your cookie here..."
                  rows={4}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Group Name (optional)
                </label>
                <Input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Default"
                  className="w-full"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Account'
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