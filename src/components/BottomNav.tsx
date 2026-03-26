import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Home, Trophy, PlusCircle, User, Shield } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const checkModal = () => {
      setIsModalOpen(document.body.classList.contains('modal-open'));
    };

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/generate', label: t('generate'), icon: PlusCircle },
    { path: '/leaderboard', label: t('leaderboard'), icon: Trophy },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', label: t('admin'), icon: Shield });
  }

  return (
    <nav className={`fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-zinc-800 bg-zinc-950/90 py-3 backdrop-blur-md transition-transform duration-300 md:hidden ${isModalOpen ? 'translate-y-full' : 'translate-y-0'}`}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center gap-1 transition-colors ${
            location.pathname === item.path ? 'text-emerald-500' : 'text-zinc-500'
          }`}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};
