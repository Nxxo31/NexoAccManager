import * as React from 'react';
import { Account } from '@/types/Account';
import { Button } from '@renderer/components/ui/button';
import { cn } from '@renderer/lib/utils';
import { Copy, Save, UserPlus, Check, Loader2, Gamepad2, MousePointerClick } from 'lucide-react';

interface AccountDetailsPanelProps {
  account: Account | null;
  onSaveAlias: (accountId: string, alias: string) => Promise<void>;
  onSaveDescription: (accountId: string, description: string) => Promise<void>;
  onFollowUser: (accountId: string, userId: number) => Promise<void>;
  onLaunchGame: (accountId: string, placeId: string, jobId: string) => Promise<void>;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AccountDetailsPanel: React.FC<AccountDetailsPanelProps> = ({
  account,
  onSaveAlias,
  onSaveDescription,
  onFollowUser,
  onLaunchGame,
}) => {
  const [alias, setAlias] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [placeId, setPlaceId] = React.useState('');
  const [jobId, setJobId] = React.useState('');
  const [aliasSave, setAliasSave] = React.useState<SaveState>('idle');
  const [descSave, setDescSave] = React.useState<SaveState>('idle');
  const [following, setFollowing] = React.useState(false);
  const [launching, setLaunching] = React.useState(false);

  React.useEffect(() => {
    if (account) {
      setAlias(account.displayName || account.username || '');
      setDescription(account.description || '');
      setPlaceId('');
      setJobId('');
      setAliasSave('idle');
      setDescSave('idle');
      setFollowing(false);
    }
  }, [account?.id]);

  const handleSaveAlias = async () => {
    if (!account) return;
    setAliasSave('saving');
    try {
      await onSaveAlias(account.id, alias);
      setAliasSave('saved');
      setTimeout(() => setAliasSave('idle'), 2000);
    } catch {
      setAliasSave('error');
      setTimeout(() => setAliasSave('idle'), 2000);
    }
  };

  const handleSaveDescription = async () => {
    if (!account) return;
    setDescSave('saving');
    try {
      await onSaveDescription(account.id, description);
      setDescSave('saved');
      setTimeout(() => setDescSave('idle'), 2000);
    } catch {
      setDescSave('error');
      setTimeout(() => setDescSave('idle'), 2000);
    }
  };

  const handleFollow = async () => {
    if (!account?.robloxUserId) return;
    setFollowing(true);
    try {
      await onFollowUser(account.id, account.robloxUserId);
    } catch {
      /* ignore */
    } finally {
      setFollowing(false);
    }
  };

  const handleLaunchGame = async () => {
    if (!account || !placeId) return;
    setLaunching(true);
    try {
      await onLaunchGame(account.id, placeId, jobId);
    } catch {
      /* ignore */
    } finally {
      setLaunching(false);
    }
  };

  const handleCopyPlaceId = () => {
    if (placeId) navigator.clipboard.writeText(placeId);
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <MousePointerClick className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h3 className="font-semibold text-foreground/40">Selecciona una cuenta</h3>
        <p className="text-sm text-muted-foreground/30 mt-1.5">Los detalles aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          {account.avatarUrl ? (
            <img src={account.avatarUrl} alt={account.username} className="h-14 w-14 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xl font-bold border-2 border-border">
              {(account.displayName || account.username).toUpperCase().charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{account.displayName || account.username}</h3>
            <p className="text-xs text-muted-foreground truncate">@{account.username}</p>
            {account.group && account.group !== 'Default' && (
              <span className="inline-flex items-center mt-1 px-2 py-0.5 text-[10px] rounded bg-primary/15 text-primary font-medium">{account.group}</span>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 py-4 space-y-5 flex-1">
        {/* Place ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Place ID</label>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="ej: 5315046213" value={placeId} onChange={(e) => setPlaceId(e.target.value)} className="nexo-input" />
            <button onClick={handleCopyPlaceId} className="p-2 rounded-md border border-border hover:bg-muted/30 text-muted-foreground transition-colors flex-shrink-0" title="Copiar">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Job ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Job ID</label>
          <input type="text" placeholder="Job ID del servidor (opcional)" value={jobId} onChange={(e) => setJobId(e.target.value)} className="nexo-input font-mono-data" />
        </div>

        {/* Launch button */}
        <Button variant="default" size="sm" onClick={handleLaunchGame} disabled={!placeId || launching} className="w-full">
          {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gamepad2 className="h-4 w-4" />}
          <span className="ml-1.5">Lanzar Juego</span>
        </Button>

        {/* Divider */}
        <div className="border-t border-border/30 pt-4 space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Alias</label>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Alias de la cuenta" value={alias} onChange={(e) => setAlias(e.target.value)} className="nexo-input" />
            <Button variant="outline" size="sm" onClick={handleSaveAlias} disabled={aliasSave === 'saving'} className="flex-shrink-0">
              {aliasSave === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : aliasSave === 'saved' ? <Check className="h-3.5 w-3.5 text-green-500" /> : aliasSave === 'error' ? <span className="text-xs text-red-500">✕</span> : <Save className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</label>
          <textarea placeholder="Notas sobre esta cuenta..." value={description} onChange={(e) => setDescription(e.target.value)} className="nexo-input min-h-[80px] resize-y" rows={3} />
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleSaveDescription} disabled={descSave === 'saving'}>
              {descSave === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : descSave === 'saved' ? <Check className="h-3.5 w-3.5 text-green-500" /> : descSave === 'error' ? <span className="text-xs text-red-500">✕</span> : <Save className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Guardar</span>
            </Button>
            <span className="text-xs text-muted-foreground">{description.length} chars</span>
          </div>
        </div>

        {/* Follow */}
        <div className="border-t border-border/30 pt-4">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5 block">Usuario</label>
          <div className="flex items-center gap-2">
            <input type="text" value={account.username} readOnly className="nexo-input opacity-60" />
            <Button variant="outline" size="sm" onClick={handleFollow} disabled={following || !account.robloxUserId} className="flex-shrink-0">
              {following ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              <span className="ml-1">Follow</span>
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="border-t border-border/30 pt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Creada:</span><span className="font-mono-data">{new Date(account.createdAt).toLocaleDateString('es-ES')}</span></div>
          <div className="flex justify-between"><span>Último uso:</span><span className="font-mono-data">{new Date(account.lastUsed).toLocaleDateString('es-ES')}</span></div>
          <div className="flex justify-between"><span>ID:</span><span className="font-mono-data text-muted-foreground/50">#{account.id.slice(0, 8)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsPanel;
