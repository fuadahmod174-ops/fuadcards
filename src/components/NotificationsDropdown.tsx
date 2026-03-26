import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';
import { createPortal } from 'react-dom';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  link?: string;
}

export const NotificationsDropdown: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const path = 'notifications';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(fetched);
      setUnreadCount(fetched.filter(n => !n.read).length);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-x-4 top-20 z-[100] origin-top rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 md:absolute md:inset-auto md:right-4 md:top-16 md:mt-2 md:w-80 md:origin-top-right">
          <div className="flex items-center justify-between border-b border-zinc-800 p-4">
            <h3 className="font-bold text-white">{t('notifications')}</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => notifications.filter(n => !n.read).forEach(n => markAsRead(n.id))}
                className="text-xs text-emerald-500 hover:text-emerald-400"
              >
                {t('markAllAsRead')}
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                {t('noNotifications')}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 transition-colors hover:bg-zinc-800/50 ${!notification.read ? 'bg-zinc-800/20' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.link ? (
                      <Link to={notification.link} className="block">
                        <div className="flex items-start gap-3">
                          {!notification.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                          <div>
                            <p className={`text-sm ${!notification.read ? 'font-bold text-white' : 'text-zinc-300'}`}>
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 cursor-pointer">
                        {!notification.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                        <div>
                          <p className={`text-sm ${!notification.read ? 'font-bold text-white' : 'text-zinc-300'}`}>
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
