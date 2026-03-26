import React, { useEffect, useState } from 'react';
import { useAuth, PlayerData } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, X, Calendar, Star, Shield, Trash2, ShoppingCart, CheckCircle, Settings, User as UserIcon, Save } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Modal } from '../components/Modal';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

interface Card {
  id: string;
  imageUrl: string;
  characterName: string;
  animeSource: string;
  raw_power: number;
  strength: number;
  status: string;
  createdAt: any;
}

export const ProfileView: React.FC = () => {
  const { t } = useLanguage();
  const { user, player: currentUserPlayer } = useAuth();
  const { username } = useParams<{ username?: string }>();
  
  const [profilePlayer, setProfilePlayer] = useState<PlayerData | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const [showManageAccount, setShowManageAccount] = useState(false);
  const [weeklyCards, setWeeklyCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Edit State
  const [editData, setEditData] = useState({
    name: '',
    username: '',
    bio: '',
    gender: '',
    favAnime: ''
  });

  const isOwnProfile = !username || (currentUserPlayer?.username === username) || (user?.uid === profilePlayer?.uid);

  useEffect(() => {
    if (currentUserPlayer && isOwnProfile) {
      setEditData({
        name: currentUserPlayer.name || currentUserPlayer.displayName || '',
        username: currentUserPlayer.username || '',
        bio: currentUserPlayer.bio || '',
        gender: currentUserPlayer.gender || 'Not Specified',
        favAnime: currentUserPlayer.favAnime || ''
      });
    }
  }, [currentUserPlayer, isOwnProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        let targetUid = user?.uid;

        if (username) {
          // Try fetch by username first
          const q = query(collection(db, 'players'), where('username', '==', username.toLowerCase()), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const playerData = querySnapshot.docs[0].data() as PlayerData;
            targetUid = playerData.uid;
            setProfilePlayer(playerData);
          } else {
            // Try fetch by UID
            const docRef = doc(db, 'players', username);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const playerData = docSnap.data() as PlayerData;
              targetUid = playerData.uid;
              setProfilePlayer(playerData);
            } else {
              setError('User not found');
              setLoading(false);
              return;
            }
          }
        } else if (currentUserPlayer) {
          setProfilePlayer(currentUserPlayer);
        } else {
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }

        if (!targetUid) return;

        // Fetch cards for the target user
        const path = 'cards';
        const cardsQuery = query(
          collection(db, path),
          where('ownerId', '==', targetUid),
          where('status', 'in', ['saved', 'ordered']),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
          const fetchedCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Card[];
          setCards(fetchedCards);

          // Weekly Recap Logic (only for own profile)
          if (isOwnProfile) {
            const now = new Date();
            const isSunday = now.getDay() === 0;
            
            if (isSunday) {
              const start = startOfWeek(now);
              const end = endOfWeek(now);
              
              const thisWeekCards = fetchedCards.filter(c => {
                if (!c.createdAt) return false;
                const cardDate = c.createdAt.toDate();
                return isWithinInterval(cardDate, { start, end });
              });

              // Sort by power to find the best card
              thisWeekCards.sort((a, b) => b.raw_power - a.raw_power);
              
              if (thisWeekCards.length > 0) {
                setWeeklyCards(thisWeekCards);
                // Only show automatically if they haven't dismissed it this session
                if (!sessionStorage.getItem('weeklyRecapDismissed')) {
                  setShowRecap(true);
                }
              }
            }
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user, currentUserPlayer, isOwnProfile]);

  const dismissRecap = () => {
    setShowRecap(false);
    sessionStorage.setItem('weeklyRecapDismissed', 'true');
  };

  const handleOrderNow = async (card: Card) => {
    if (!user || card.status === 'ordered') return;
    setActionLoading(card.id);
    try {
      // 1. Update card status in Firestore
      await updateDoc(doc(db, 'cards', card.id), {
        status: 'ordered'
      });

      // 2. Trigger Admin Sync (write to orders collection)
      await addDoc(collection(db, 'orders'), {
        cardId: card.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        characterName: card.characterName,
        imageUrl: card.imageUrl,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 3. Create notification for admin
      const adminEmails = ["selectedlegendbusiness@gmail.com", "fuadahmod174@gmail.com"];
      for (const email of adminEmails) {
        await addDoc(collection(db, 'notifications'), {
          userId: email, // Using email as ID for admin notifications simplicity or we could find their UID
          type: 'order',
          message: `New order from ${user.displayName} for ${card.characterName}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }

    } catch (err) {
      console.error("Order failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCard = async (cardId: string, status: string) => {
    if (status === 'ordered') return;
    if (!window.confirm("Are you sure you want to delete this card? This cannot be undone.")) return;
    
    setActionLoading(cardId);
    try {
      await deleteDoc(doc(db, 'cards', cardId));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentUserPlayer) return;
    
    setActionLoading('update-profile');
    try {
      const docRef = doc(db, 'players', user.uid);
      
      // Check if username is taken if it changed
      if (editData.username !== currentUserPlayer.username) {
        const q = query(collection(db, 'players'), where('username', '==', editData.username.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          toast.error("Username already taken!");
          return;
        }
      }

      await updateDoc(docRef, {
        ...editData,
        username: editData.username.toLowerCase(),
        setupComplete: true
      });
      
      setShowManageAccount(false);
      window.location.reload(); // Refresh to show changes
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update profile.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center text-emerald-500 uppercase font-black tracking-widest">{t('loadingProfile')}</div>;
  }

  if (error || !profilePlayer) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-white">{t('profileNotFound')}</h2>
        <p className="mt-2 text-zinc-400">{error || t('userNotExist')}</p>
        <Link to="/" className="mt-6 rounded-full bg-emerald-500 px-6 py-2 font-bold text-black hover:bg-emerald-400">
          {t('goHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO 
        title={`${profilePlayer.name || 'User'}'s Profile - FuadCards`} 
        description={`Check out ${profilePlayer.name}'s anime card collection on FuadCards. Total Power: ${profilePlayer.totalPower || 0}.`}
      />
      
      {/* Manage Account Modal */}
      <Modal 
        isOpen={showManageAccount} 
        onClose={() => setShowManageAccount(false)}
        title={t('manageAccount')}
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">{t('fullName')}</label>
            <input 
              type="text" 
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Your Name"
              required
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">{t('username')}</label>
            <input 
              type="text" 
              value={editData.username}
              onChange={(e) => setEditData({...editData, username: e.target.value.replace(/\s+/g, '')})}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="username"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">{t('gender')}</label>
            <select 
              value={editData.gender}
              onChange={(e) => setEditData({...editData, gender: e.target.value})}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="Not Specified">Not Specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">{t('bio')}</label>
            <textarea 
              value={editData.bio}
              onChange={(e) => setEditData({...editData, bio: e.target.value})}
              className="h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">{t('favAnime')}</label>
            <input 
              type="text" 
              value={editData.favAnime}
              onChange={(e) => setEditData({...editData, favAnime: e.target.value})}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Naruto"
            />
          </div>
          
          <button 
            type="submit"
            disabled={actionLoading === 'update-profile'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            {actionLoading === 'update-profile' ? t('saving') : <><Save size={20} /> {t('saveChanges')}</>}
          </button>
        </form>
      </Modal>

      {/* Weekly Recap Modal */}
      <Modal 
        isOpen={showRecap && weeklyCards.length > 0} 
        onClose={dismissRecap}
        maxWidth="max-w-2xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <Trophy size={40} />
          </div>
          <h2 className="mb-2 text-4xl font-black text-white">{t('weeklyRecap')}</h2>
          <p className="mb-8 text-zinc-400">{t('weeklyRecapDesc').replace('{count}', weeklyCards.length.toString())}</p>
          
          <div className="mx-auto aspect-[2.5/3.5] w-64 overflow-hidden rounded-xl border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <img src={weeklyCards[0]?.imageUrl} alt={weeklyCards[0]?.characterName} className="h-full w-full object-cover" />
          </div>
          
          <div className="mt-6">
            <h3 className="text-2xl font-bold text-white">{weeklyCards[0]?.characterName}</h3>
            <div className="mt-2 flex justify-center gap-4 text-emerald-500">
              <span className="flex items-center gap-1 font-bold"><Star size={16} /> {weeklyCards[0]?.raw_power} {t('power')}</span>
            </div>
          </div>
          
          <button 
            onClick={dismissRecap}
            className="mt-8 w-full rounded-full bg-emerald-500 py-4 font-bold text-black hover:bg-emerald-400"
          >
            {t('awesome')}
          </button>
        </div>
      </Modal>

      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center">
        <img src={profilePlayer.photoURL || "https://picsum.photos/seed/avatar/200"} alt="" className="h-24 w-24 rounded-full border-2 border-emerald-500 object-cover" referrerPolicy="no-referrer" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white sm:text-4xl truncate">{profilePlayer.name || profilePlayer.displayName}</h1>
            {profilePlayer.badges?.includes('gold') && <Shield className="shrink-0 text-yellow-400" size={28} fill="currentColor" />}
            {profilePlayer.badges?.includes('silver') && <Shield className="shrink-0 text-zinc-300" size={28} fill="currentColor" />}
            {profilePlayer.badges?.includes('bronze') && <Shield className="shrink-0 text-amber-600" size={28} fill="currentColor" />}
          </div>
          <p className="text-emerald-500 font-medium truncate">@{profilePlayer.username || profilePlayer.uid.slice(0, 8)}</p>
          {profilePlayer.bio && (
            <p className="mt-2 max-w-xl text-zinc-400">{profilePlayer.bio}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs font-bold uppercase text-zinc-500">
            <span>{profilePlayer.gender || 'Not Specified'}</span>
            {profilePlayer.favAnime && (
              <span className="flex items-center gap-1"><Star size={12} className="text-emerald-500" /> {profilePlayer.favAnime}</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="rounded-lg bg-zinc-900 px-4 py-2">
              <div className="text-xs text-zinc-500">Cards Collected</div>
              <div className="text-xl font-bold text-white">{cards.length}</div>
            </div>
            <div className="rounded-lg bg-zinc-900 px-4 py-2">
              <div className="text-xs text-zinc-500">{t('totalPower')}</div>
              <div className="text-xl font-bold text-emerald-500">{profilePlayer.totalPower || 0}</div>
            </div>
            {profilePlayer.weeklyRank && (
              <div className="rounded-lg bg-zinc-900 px-4 py-2">
                <div className="text-xs text-zinc-500">Weekly Rank</div>
                <div className="text-xl font-bold text-yellow-500">#{profilePlayer.weeklyRank}</div>
              </div>
            )}
          </div>
        </div>
        
        {isOwnProfile && (
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowManageAccount(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 font-bold text-white hover:bg-zinc-800"
            >
              <Settings size={20} /> {t('manageAccount')}
            </button>
            {weeklyCards.length > 0 && (
              <button 
                onClick={() => setShowRecap(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 font-bold text-emerald-500 hover:bg-emerald-500/20"
              >
                <Calendar size={20} /> View Weekly Recap
              </button>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-6 text-2xl font-bold text-white">{isOwnProfile ? t('yourProfile') : `${profilePlayer.name}'s Collection`}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.id} className="group relative flex flex-col">
            <Link to={`/card/${card.id}`} className="flex-1">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative aspect-[2.5/3.5] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <img 
                  src={card.imageUrl} 
                  alt={card.characterName} 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                {card.status === 'ordered' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 font-black text-black shadow-xl">
                      <CheckCircle size={16} /> {t('ordered')}
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-lg font-bold text-white">{card.characterName}</div>
                  <div className="text-xs text-zinc-400">{card.animeSource}</div>
                  <div className="mt-2 text-sm font-bold text-emerald-500">PWR: {card.raw_power}</div>
                </div>
              </motion.div>
            </Link>

            {isOwnProfile && (
              <div className="mt-3 flex gap-2">
                {card.status !== 'ordered' ? (
                  <>
                    <button
                      onClick={() => handleOrderNow(card)}
                      disabled={actionLoading === card.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {actionLoading === card.id ? "..." : <><ShoppingCart size={14} /> {t('orderNow')}</>}
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id, card.status)}
                      disabled={actionLoading === card.id}
                      className="flex items-center justify-center rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-xs font-bold text-zinc-500">
                    <CheckCircle size={14} /> {t('orderConfirmed')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {cards.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            {t('noCardsYet')}
          </div>
        )}
      </div>
    </div>
  );
};
