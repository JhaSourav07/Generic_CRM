import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '@/services/notifications.service';
import { Notification } from '@/types/notifications.types';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Clock, ExternalLink } from 'lucide-react';

export interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onCountChange: (newCount: number) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  unreadCount,
  onCountChange
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getNotifications({ limit: 8 });
      setNotifications(res.notifications);
      onCountChange(res.unreadCount);
    } catch (_err) {
      // Graceful error fallback
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchLatest();
    }
  }, [isOpen, fetchLatest]);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      onCountChange(Math.max(0, unreadCount - 1));
    } catch (_err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onCountChange(0);
    } catch (_err) {}
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await notificationsService.markAsRead(notif.id).catch(() => {});
      onCountChange(Math.max(0, unreadCount - 1));
    }
    onClose();

    // Smart route resolution based on notification type or message
    if (notif.type.includes('LEAD')) {
      navigate('/app/leads');
    } else if (notif.type.includes('OPPORTUNITY')) {
      navigate('/app/opportunities');
    } else if (notif.type.includes('TASK')) {
      navigate('/app/tasks');
    } else if (notif.type.includes('QUOTE')) {
      navigate('/app/quotes');
    } else if (notif.type.includes('ORDER')) {
      navigate('/app/orders');
    } else if (notif.type.includes('SUPPORT_CASE')) {
      navigate('/app/support');
    } else {
      navigate('/app/notifications');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-vynexa-border bg-vynexa-surface shadow-2xl z-50 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-vynexa-border bg-vynexa-surface-secondary/60">
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-vynexa-text-secondary" />
          <span className="text-xs font-semibold text-vynexa-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-vynexa-text-muted hover:text-vynexa-text-primary flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="h-3 w-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Body List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-vynexa-border/40 text-xs">
        {loading ? (
          <div className="py-8 text-center text-vynexa-text-muted font-mono text-[11px]">
            Syncing notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <Check className="h-5 w-5 text-emerald-400 mx-auto opacity-60" />
            <p className="text-xs text-vynexa-text-secondary font-medium">All caught up</p>
            <p className="text-[11px] text-vynexa-text-muted">No new alerts or task assignments</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3 transition-colors cursor-pointer hover:bg-vynexa-surface-secondary/60 flex items-start gap-2.5 ${
                !n.isRead ? 'bg-vynexa-surface-secondary/25' : ''
              }`}
            >
              <div className="mt-1">
                {!n.isRead ? (
                  <span className="h-2 w-2 rounded-full bg-blue-400 block" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-transparent block" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold text-vynexa-text-primary truncate block text-xs">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-vynexa-text-muted font-mono shrink-0 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-vynexa-text-secondary line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.isRead && (
                <button
                  onClick={(e) => handleMarkAsRead(e, n.id)}
                  title="Mark as read"
                  className="mt-0.5 p-1 text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors shrink-0"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-vynexa-border bg-vynexa-surface-secondary/40 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onClose();
            navigate('/app/notifications');
          }}
          className="w-full text-xs text-vynexa-text-secondary hover:text-vynexa-text-primary flex items-center justify-center gap-1.5 h-7"
        >
          <span>View Notification Center</span>
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
