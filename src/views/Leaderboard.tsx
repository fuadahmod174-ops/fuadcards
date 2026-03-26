import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

interface Player {
  id: string;
  name: string;
  username?: string;
  photoURL?: string;
  totalPower: number;
  isTopThree?: boolean;
  badges?: string[];
}

export const LeaderboardView: React.FC = () => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const path = 'players';
    const q = query(collection(db, path), orderBy('totalPower', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      setPlayers(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, []);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <SEO 
        title="Leaderboard - FuadCards" 
        description="Check out the top anime card collectors and their total power rankings."
      />
      <div className="mb-12 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-4xl font-bold text-white">{t('globalLeaderboard')}</h1>
        <p className="mt-2 text-zinc-400">{t('strongestCollectors')}</p>
      </div>

      <div className="space-y-4">
        {players.map((player, index) => (
          <Link to={`/${player.username || player.id}`} key={player.id} className="block">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-zinc-800/80 ${
                index === 0 ? 'border-amber-500/50 bg-amber-500/10' :
                index === 1 ? 'border-zinc-400/50 bg-zinc-400/10' :
                index === 2 ? 'border-amber-700/50 bg-amber-700/10' :
                'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center font-bold text-zinc-500">
                  {index === 0 ? <Medal className="text-amber-500" /> : 
                   index === 1 ? <Medal className="text-zinc-400" /> :
                   index === 2 ? <Medal className="text-amber-700" /> :
                   index + 1}
                </div>
                {player.photoURL ? (
                  <img src={player.photoURL} alt="" className="h-10 w-10 rounded-full border border-zinc-700 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                    {player.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white flex items-center gap-2 truncate">
                    {player.name || 'Unknown Player'}
                    {player.isTopThree && <Star size={14} className="shrink-0 text-amber-500" fill="currentColor" />}
                  </span>
                  {player.username && <span className="text-xs text-emerald-500 truncate">@{player.username}</span>}
                  {player.badges && player.badges.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {player.badges.map((badge, i) => (
                        <span key={i} className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-full">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-zinc-500">{t('totalPower')}</div>
                <div className="text-xl font-black text-emerald-500">{player.totalPower || 0}</div>
              </div>
            </motion.div>
          </Link>
        ))}
        {players.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            {t('noPlayers')}
          </div>
        )}
      </div>
    </div>
  );
};
