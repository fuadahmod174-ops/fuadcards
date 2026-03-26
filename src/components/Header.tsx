import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, LogOut, Shield, Trophy, User, PlusCircle, Home } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const Header: React.FC = () => {
  const { user, login, logout, isAdmin } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [hasUnreadAdmin, setHasUnreadAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModal = () => {
      const modalOpen = document.body.classList.contains('modal-open');
      setIsModalOpen(modalOpen);
    };

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isAdmin || !user) return;
    
    // Listen for unread orders/notifications for admin
    const q = query(collection(db, 'notifications'), where('userId', '==', user.email), where('read', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnreadAdmin(!snapshot.empty);
    });
    
    return () => unsubscribe();
  }, [isAdmin, user]);

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/generate', label: t('generate'), icon: PlusCircle },
    { path: '/leaderboard', label: t('leaderboard'), icon: Trophy },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md transition-transform duration-300 ${isModalOpen ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex select-none items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ 
              scale: 0.9,
              rotate: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.4 }
            }}
            className="flex items-center gap-2"
          >
            <img 
              src="https://pub-c78289ec134140caabd6b03a08c2fede.r2.dev/fed-01.png" 
              alt="FuadCards Logo" 
              className="h-10 w-auto" 
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-black tracking-tighter text-white">
              Fuad Cards
            </span>
          </motion.div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-500 ${
                location.pathname === item.path ? 'text-emerald-500' : 'text-zinc-400'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`relative flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-500 ${
                location.pathname === '/admin' ? 'text-emerald-500' : 'text-zinc-400'
              }`}
            >
              <Shield size={16} />
              {t('admin')}
              {hasUnreadAdmin && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="rounded-md border border-zinc-800 px-2 py-1 text-xs font-bold text-zinc-400 hover:bg-zinc-900"
          >
            {lang === 'bn' ? 'EN' : 'BN'}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              <Link to="/profile" className="flex items-center gap-2 text-zinc-400 hover:text-white">
                <img src={user.photoURL || ""} alt="" className="h-8 w-8 rounded-full border border-emerald-500 object-cover" referrerPolicy="no-referrer" />
              </Link>
              <button onClick={logout} className="text-zinc-400 hover:text-red-500">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
            >
              <LogIn size={16} />
              {t('login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
