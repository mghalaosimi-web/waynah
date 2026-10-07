'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, type NotificationApiItem } from '../../lib/api/api-client';
import { Bell, CheckCheck, Trash2, Check, ExternalLink, Info, CheckCircle2, ShieldAlert, UserPlus, FileText } from 'lucide-react';
import { useAuth } from '../../lib/auth/auth-context';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.getUnreadNotificationCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (_err) {
      // Non-critical background fetch failure swallow
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await apiClient.getNotifications({ page: 1, limit: 10 });
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (_err) {
      // Non-critical background fetch failure swallow
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      // Light polling every 30s for unread count
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const toggleOpen = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiClient.markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        fetchUnreadCount();
      }
    } catch (_err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiClient.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (_err) {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiClient.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        fetchUnreadCount();
      }
    } catch (_err) {}
  };

  if (!isAuthenticated) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VERIFICATION_UPDATE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'CLAIM_UPDATE':
        return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'MEMBER_INVITATION':
        return <UserPlus className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'REVIEW_MODERATED':
        return <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title="الإشعارات والتنبيهات"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-850 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                الإشعارات والتنبيهات
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {unreadCount} جديد
                </span>
              )}
            </div>

            {notifications.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">جاري تحميل الإشعارات...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">لا توجد إشعارات حالياً</p>
                <p className="text-[11px] text-slate-400">ستظهر التحديثات الخاصة بحسابك وأنشطتك هنا.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    !item.isRead
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {item.body}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {new Date(item.createdAt).toLocaleDateString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="تعليم كمقروء"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="حذف الإشعار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
