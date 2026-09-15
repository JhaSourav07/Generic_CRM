import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { notificationsService } from '@/services/notifications.service';
import { Notification } from '@/types/notifications.types';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle,
  Briefcase,
  FileCheck,
  LifeBuoy,
  ShoppingCart,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsService.getNotifications({
        page,
        limit: 15,
        isRead: tab === 'unread' ? false : undefined
      });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error loading notifications',
        message: 'Failed to retrieve notification feed.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, tab, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (tab === 'unread') {
        // Remove from current unread list
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error',
        message: 'Could not mark notification as read.'
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (tab === 'unread') {
        setNotifications([]);
        setTotalCount(0);
      }
      toast({
        type: 'success',
        title: 'Updated',
        message: 'All notifications marked as read.'
      });
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error',
        message: 'Failed to mark all notifications as read.'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast({
        type: 'success',
        title: 'Notification removed',
        message: 'Item removed from your feed.'
      });
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete notification.'
      });
    }
  };

  const handleNavigateContext = (notif: Notification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
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
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('LEAD')) return <UserCheck className="h-4 w-4 text-blue-400" />;
    if (type.includes('TASK')) return <Clock className="h-4 w-4 text-amber-400" />;
    if (type.includes('QUOTE')) return <FileCheck className="h-4 w-4 text-emerald-400" />;
    if (type.includes('ORDER')) return <ShoppingCart className="h-4 w-4 text-cyan-400" />;
    if (type.includes('SUPPORT')) return <LifeBuoy className="h-4 w-4 text-rose-400" />;
    if (type.includes('OPPORTUNITY')) return <Briefcase className="h-4 w-4 text-purple-400" />;
    return <AlertCircle className="h-4 w-4 text-vynexa-text-secondary" />;
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Notifications"
        description="Real-time alerts, cross-module assignments, and workflow status events"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-4 w-4 mr-1.5 text-blue-400" />
                Mark all as read
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs & Metrics Filter */}
      <div className="flex items-center justify-between border-b border-vynexa-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTab('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'all'
                ? 'bg-vynexa-surface-elevated text-vynexa-text-primary border border-vynexa-border'
                : 'text-vynexa-text-secondary hover:text-vynexa-text-primary hover:bg-vynexa-surface'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => {
              setTab('unread');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              tab === 'unread'
                ? 'bg-vynexa-surface-elevated text-vynexa-text-primary border border-vynexa-border'
                : 'text-vynexa-text-secondary hover:text-vynexa-text-primary hover:bg-vynexa-surface'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-vynexa-text-muted font-mono">
          Total: {totalCount}
        </div>
      </div>

      {/* Notifications List */}
      <Card className="divide-y divide-vynexa-border/60 overflow-hidden bg-vynexa-surface">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-4 w-32 bg-vynexa-surface-elevated animate-pulse mx-auto rounded" />
            <div className="h-3 w-48 bg-vynexa-surface-elevated/60 animate-pulse mx-auto rounded" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center mx-auto text-vynexa-text-muted">
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-vynexa-text-primary">
                {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-xs text-vynexa-text-secondary mt-1">
                {tab === 'unread'
                  ? 'You are all caught up on pending items.'
                  : 'System and workflow alerts will appear here as activity occurs.'}
              </p>
            </div>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-vynexa-surface-secondary/40 ${
                !item.isRead ? 'bg-blue-500/[0.03]' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${!item.isRead ? 'text-vynexa-text-primary' : 'text-vynexa-text-secondary'}`}>
                      {item.title}
                    </span>
                    {!item.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
                    )}
                    <span className="text-[10px] font-mono text-vynexa-text-muted px-1.5 py-0.5 rounded bg-vynexa-surface-secondary border border-vynexa-border/60">
                      {item.type}
                    </span>
                  </div>

                  <p className="text-xs text-vynexa-text-secondary leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5 text-[11px] text-vynexa-text-muted font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigateContext(item)}
                  title="View linked item"
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-vynexa-text-secondary hover:text-vynexa-text-primary" />
                </Button>

                {!item.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Mark as read"
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  title="Delete notification"
                  className="h-8 w-8 p-0 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5 text-vynexa-text-muted hover:text-rose-400" />
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-vynexa-text-muted font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
