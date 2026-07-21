import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import { useUIStore, AppNotification, NotificationType } from '@renderer/store/useUIStore';

const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  error: <XCircle className="h-4 w-4 text-error" />,
  info: <Info className="h-4 w-4 text-primary" />,
  loading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
};

const BORDER_COLORS: Record<NotificationType, string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  error: 'border-l-error',
  info: 'border-l-primary',
  loading: 'border-l-primary',
};

interface NotificationItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const { id, type, title, message, durationMs = 4000 } = notification;

  React.useEffect(() => {
    if (durationMs > 0) {
      const timer = setTimeout(() => onDismiss(id), durationMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [durationMs, id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 p-3 pr-2 rounded-md bg-bg-card border border-border border-l-4 shadow-lg pointer-events-auto ${BORDER_COLORS[type]}`}
      role="status"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[type]}</div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        {message && (
          <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-bg-surface/50 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};

NotificationItem.displayName = 'NotificationItem';

export const NotificationBar: React.FC = () => {
  const notifications = useUIStore((s) => s.notifications);
  const dismissNotification = useUIStore((s) => s.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-2 right-2 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-1rem)] pointer-events-none"
      aria-label="Notificaciones"
    >
      <AnimatePresence initial={false}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

NotificationBar.displayName = 'NotificationBar';
