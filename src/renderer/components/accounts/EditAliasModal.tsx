import * as React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Account } from '@/types/Account';
import { ModalShell } from '@renderer/components/modal/ModalShell';
import { useTranslation } from 'react-i18next';

interface EditAliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  aliasDraft: string;
  setAliasDraft: (v: string) => void;
  aliasSaving: boolean;
  handleSaveAlias: (aliasDraft: string) => void;
}

export const EditAliasModal: React.FC<EditAliasModalProps> = ({
  isOpen,
  onClose,
  account,
  aliasDraft,
  setAliasDraft,
  aliasSaving,
  handleSaveAlias,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} className="w-full max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('editAlias.title', 'Editar alias')}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-surface"
            aria-label={t('common.close', 'Cerrar')}
          >
            <X className="absolute right-2 top-2 h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span className="w-8">{t('editAlias.current', 'Actual:')}</span>
            <span className="truncate">{account.displayName || account.username}</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('editAlias.newAlias', 'Nuevo alias')}
            </label>
            <input
              type="text"
              value={aliasDraft}
              onChange={(e) => setAliasDraft(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-bg-surface/50 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              aria-labelledby="editAliasModal-input"
            />
          </div>

          <button
            onClick={() => handleSaveAlias(aliasDraft)}
            disabled={aliasSaving}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {aliasSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>{t('editAlias.saving', 'Guardando...')}</span>
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>{t('editAlias.save', 'Guardar')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};