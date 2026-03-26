import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

export const HomeView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden">
      <SEO 
        title="FuadCards - Home" 
        description="The ultimate AI-powered anime trading card platform. Generate, collect, and trade high-end cards."
      />
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] bg-emerald-500/10 blur-[120px] rounded-full" />

      <div className="container relative mx-auto px-4 pt-12 pb-24 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-500">
            <Sparkles size={16} />
            <span>{t('heroSub')}</span>
          </div>
          
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-6xl md:text-8xl">
            {t('heroTitle')}
          </h1>
          
          <p className="mt-6 text-lg text-zinc-400 md:mt-8 md:text-xl">
            {t('heroSub')}
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              to="/generate"
              className="rounded-full bg-emerald-500 px-8 py-4 text-lg font-bold text-black transition-transform hover:scale-105 active:scale-95"
            >
              {t('generateBtn')}
            </Link>
            <Link
              to="/leaderboard"
              className="rounded-full border border-zinc-800 bg-zinc-900 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-zinc-800"
            >
              {t('leaderboard')}
            </Link>
          </div>
        </motion.div>

        <div className="mt-32 grid gap-8 md:grid-cols-3">
          {[
            { icon: Zap, title: "AI Powered", desc: "State-of-the-art image generation for unique characters." },
            { icon: Shield, title: "Verified Cards", desc: "Every card has a unique QR code for verification." },
            { icon: Globe, title: "Global Trading", desc: "Compete with players worldwide on the leaderboard." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-left"
            >
              <feature.icon className="mb-4 text-emerald-500" size={32} />
              <h3 className="text-xl font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-zinc-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
