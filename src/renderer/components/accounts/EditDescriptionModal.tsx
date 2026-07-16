import * as React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Account } from '@/types/Account';
import { ModalShell } from '@renderer/components/modal/ModalShell';
import { useTranslation } from 'react-i18next';

interface EditDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  descDraft: string;
  setDescDraft: (v: string) => void;
  descSaving: boolean;
  handleSaveDesc: (descDraft: string) => void;
}

export const EditDescriptionModal: React.FC<EditDescriptionModalProps> = ({
  isOpen,
  onClose,
  account,
  descDraft,
  setDescDraft,
  descSaving,
  handleSaveDesc,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} className="w-full max-w-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('editDescription.title', 'Editar descripción')}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-surface"
            aria-label={t('common.close', 'Cerrar')}
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">
            {t('editDescription.current', 'Actual:')}
          </label>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground max-w-xs">
            {account.description || '(ninguna)'}
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('editDescription.newDescription', 'Nueva descripción')}
            </label>
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              className="w-full px-3 py-2 min-h-[80px] rounded border border-border bg-bg-surface/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              aria-labelledby="editDescriptionModal-textarea"
            />
          </div>

          <button
            onClick={() => handleSaveDesc(descDraft)}
            disabled={descSaving}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {descSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>{t('editDescription.saving', 'Guardando...')}</span>
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>{t('editDescription.save', 'Guardar')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};