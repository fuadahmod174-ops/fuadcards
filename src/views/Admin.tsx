import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs, where, deleteDoc } from 'firebase/firestore';
import { Shield, Users, CreditCard, CheckCircle, XCircle, Clock, Trash2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { deleteFromR2 } from '../lib/storage';
import { toast } from 'sonner';

import { useLanguage } from '../context/LanguageContext';

export const AdminView: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin, user } = useAuth();
  const [recentCards, setRecentCards] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    
    const cardsPath = 'cards';
    const qCards = query(collection(db, cardsPath), orderBy('createdAt', 'desc'), limit(20));
    const unsubCards = onSnapshot(qCards, (snapshot) => {
      setRecentCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, cardsPath);
    });

    const ordersPath = 'orders';
    const qOrders = query(collection(db, ordersPath), orderBy('createdAt', 'desc'), limit(50));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ordersPath);
    });

    return () => {
      unsubCards();
      unsubOrders();
    };
  }, [isAdmin]);

  const [loading, setLoading] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const handleResetSpecificUser = async () => {
    if (!resetInput) return;
    if (!window.confirm(`Are you sure you want to reset all cards and power for ${resetInput}?`)) return;

    setLoading(true);
    try {
      // 1. Find user by email or username in players collection
      const input = resetInput.trim().toLowerCase();
      const isEmail = input.includes('@') && !input.startsWith('@');
      
      let q;
      if (isEmail) {
        q = query(collection(db, 'players'), where('email', '==', input));
      } else {
        // Remove leading @ if present for username search
        const username = input.startsWith('@') ? input.slice(1) : input;
        q = query(collection(db, 'players'), where('username', '==', username));
      }
      
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("User not found with that email or username.");
        setLoading(false);
        return;
      }

      const playerDoc = snap.docs[0];
      const targetUid = playerDoc.id;

      // 2. Reset player stats
      await updateDoc(doc(db, 'players', targetUid), {
        totalPower: 0,
        cardsToday: 0,
        lastGenerated: null
      });

      // 3. Delete user's cards
      const cardsQuery = query(collection(db, 'cards'), where('ownerId', '==', targetUid));
      const cardsSnap = await getDocs(cardsQuery);
      
      let deletedCount = 0;
      for (const d of cardsSnap.docs) {
        await deleteDoc(doc(db, 'cards', d.id));
        try {
          await deleteFromR2(`${d.id}.png`);
        } catch (e) {
          console.warn(`Failed to delete R2 image for ${d.id}:`, e);
        }
        deletedCount++;
      }

      toast.success(`Successfully reset ${resetInput}. Deleted ${deletedCount} cards.`);
      setResetInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'players');
      toast.error("Failed to reset user.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'accepted' | 'rejected', userId: string, cardId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      
      // Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userId,
        title: `Order ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
        message: `Your physical card order for card ${cardId.slice(0, 8)} has been ${status}.`,
        read: false,
        createdAt: serverTimestamp(),
        link: `/card/${cardId}`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleGlobalReset = async () => {
    if (!window.confirm("DANGER: This will reset your personal stats and delete your cards. Continue?")) return;
    
    try {
      // Reset current user player stats
      if (user) {
        await updateDoc(doc(db, 'players', user.uid), {
          totalPower: 0,
          cardsToday: 0,
          lastGenerated: null
        });
        
        // Delete user's cards (limit to first 50 for safety/performance)
        const q = query(collection(db, 'cards'), where('ownerId', '==', user.uid), limit(50));
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, 'cards', d.id));
        }
        
        toast.success("Your account stats and recent cards have been reset.");
        window.location.reload();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'players');
    }
  };

  const handleWipeAllData = async () => {
    if (!window.confirm("CRITICAL DANGER: This will delete ALL cards and reset ALL player powers in the entire database. This cannot be undone. Proceed?")) return;
    if (window.prompt("Type 'WIPE' to confirm:") !== 'WIPE') return;
    
    setLoading(true);
    try {
      // 1. Delete all cards and their R2 images
      const cardsSnap = await getDocs(collection(db, 'cards'));
      for (const d of cardsSnap.docs) {
        await deleteDoc(doc(db, 'cards', d.id));
        try {
          await deleteFromR2(`${d.id}.png`);
        } catch (e) {
          console.warn(`Failed to delete R2 image for ${d.id}:`, e);
        }
      }
      
      // 2. Reset all players
      const playersSnap = await getDocs(collection(db, 'players'));
      for (const d of playersSnap.docs) {
        await updateDoc(doc(db, 'players', d.id), {
          totalPower: 0,
          cardsToday: 0,
          lastGenerated: null
        });
      }
      
      toast.success("GLOBAL RESET COMPLETE: All cards deleted and all player powers reset.");
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'global');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupExpired = async () => {
    if (!window.confirm("Cleanup all expired cards from the forge?")) return;
    setLoading(true);
    try {
      const now = new Date();
      const q = query(
        collection(db, 'cards'),
        where('status', '==', 'forge'),
        where('expiresAt', '<', now)
      );
      
      const snap = await getDocs(q);
      let count = 0;
      for (const cardDoc of snap.docs) {
        await deleteDoc(doc(db, 'cards', cardDoc.id));
        try {
          await deleteFromR2(`${cardDoc.id}.png`);
        } catch (e) {
          console.warn(`Failed to delete R2 image for ${cardDoc.id}:`, e);
        }
        count++;
      }
      toast.success(`Cleanup complete. Deleted ${count} expired cards.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'cleanup');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div className="p-12 text-center text-white">Access Denied</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO title="Admin Dashboard - FuadCards" />
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Shield className="h-10 w-10 text-emerald-500" />
          <h1 className="text-4xl font-bold text-white">{t('adminDashboard')}</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1">
            <input 
              type="text" 
              placeholder="Email or @username" 
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              className="bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 w-48"
            />
            <button 
              onClick={handleResetSpecificUser}
              disabled={loading || !resetInput}
              className="text-red-500 hover:text-red-400 disabled:opacity-50"
              title="Reset User Data"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <button 
            onClick={handleCleanupExpired}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Clock size={16} />
            {t('cleanupForge')}
          </button>
          <button 
            onClick={handleWipeAllData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            <AlertTriangle size={16} />
            {t('wipeAllData')}
          </button>
          <button 
            onClick={handleGlobalReset}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            {t('resetMyAccount')}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <CreditCard className="text-emerald-500" />
            {t('physicalOrders')}
          </h2>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-zinc-500">{t('noOrders')}</p>
            ) : (
              orders.map(order => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id} 
                  className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white">Order #{order.id.slice(0, 8)}</div>
                      <div className="text-sm text-zinc-400">User: {order.userId}</div>
                      <div className="text-sm text-zinc-400">Card: {order.cardId}</div>
                      {order.shippingAddress && (
                        <div className="mt-2 text-sm text-zinc-300">
                          <span className="text-zinc-500">Address:</span> {order.shippingAddress}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                        order.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-500' :
                        order.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {order.status === 'accepted' && <CheckCircle size={14} />}
                        {order.status === 'rejected' && <XCircle size={14} />}
                        {order.status === 'pending' && <Clock size={14} />}
                        {order.status === 'accepted' ? t('orderAccepted') : order.status === 'rejected' ? t('orderRejected') : t('orderPending')}
                      </span>
                    </div>
                  </div>
                  
                  {order.status === 'pending' && (
                    <div className="flex gap-2 border-t border-zinc-800 pt-4">
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'accepted', order.userId, order.cardId)}
                        className="flex-1 rounded-lg bg-emerald-500/10 py-2 text-sm font-bold text-emerald-500 hover:bg-emerald-500/20"
                      >
                        {t('accept')}
                      </button>
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'rejected', order.userId, order.cardId)}
                        className="flex-1 rounded-lg bg-red-500/10 py-2 text-sm font-bold text-red-500 hover:bg-red-500/20"
                      >
                        {t('reject')}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <Users className="text-emerald-500" />
            {t('recentGenerations')}
          </h2>
          <div className="space-y-4">
            {recentCards.length === 0 ? (
              <p className="text-zinc-500">{t('noCards')}</p>
            ) : (
              recentCards.map(card => (
                <div key={card.id} className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <div className="font-bold text-white">{card.characterName}</div>
                    <div className="text-xs text-zinc-500">by {card.ownerId}</div>
                  </div>
                  {card.imageUrl && (
                    <img 
                      src={card.imageUrl} 
                      alt="" 
                      className="h-12 w-12 rounded object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
