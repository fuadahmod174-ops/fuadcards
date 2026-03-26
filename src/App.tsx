import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScrollToTop } from './components/ScrollToTop';
import { SEO } from './components/SEO';
import { HomeView } from './views/Home';
import { GenerateView } from './views/Generate';
import { LeaderboardView } from './views/Leaderboard';
import { ProfileView } from './views/Profile';
import { AdminView } from './views/Admin';
import { SetupView } from './views/Setup';
import { PostView } from './views/Post';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, player, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950 text-emerald-500">LOADING...</div>;
  if (!user) return <Navigate to="/" />;
  if (player && !player.setupComplete && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { player, user } = useAuth();
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-200 selection:bg-emerald-500 selection:text-black">
      <ScrollToTop />
      <SEO />
      <Toaster position="top-center" richColors theme="dark" />
      <Header />
      <main className="pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/setup" element={user ? (player?.setupComplete ? <Navigate to="/" /> : <SetupView />) : <Navigate to="/" />} />
          <Route path="/generate" element={<GenerateView />} />
          <Route path="/leaderboard" element={<LeaderboardView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/admin" element={<ProtectedRoute><AdminView /></ProtectedRoute>} />
          <Route path="/card/:cardId" element={<PostView />} />
          <Route path="/:username" element={<ProfileView />} />
        </Routes>
      </main>
      <BottomNav />
      
      <footer className="border-t border-zinc-800 py-16 text-center text-sm text-zinc-600 pb-32 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left mb-12">
            <div>
              <h3 className="text-white font-bold mb-4">FuadCards</h3>
              <p className="max-w-xs">{t('footerDesc')}</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">{t('quickLinks')}</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-emerald-500 transition-colors">{t('home')}</Link></li>
                <li><Link to="/generate" className="hover:text-emerald-500 transition-colors">{t('generateCard')}</Link></li>
                <li><Link to="/leaderboard" className="hover:text-emerald-500 transition-colors">{t('leaderboard')}</Link></li>
                <li><Link to="/profile" className="hover:text-emerald-500 transition-colors">{t('yourProfile')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">{t('support')}</h3>
              <ul className="space-y-2">
                <li><a href="mailto:fuadahmod174@gmail.com" className="hover:text-emerald-500 transition-colors">{t('contactSupport')}</a></li>
                <li><a href="https://fuadeditingzone.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">{t('creatorPortfolio')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>{t('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <LanguageProvider>
            <Router>
              <AppContent />
            </Router>
          </LanguageProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
