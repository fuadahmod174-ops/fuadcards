import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface PlayerData {
  uid: string;
  displayName: string;
  name?: string;
  username?: string;
  email: string;
  photoURL: string;
  age?: number;
  favoriteAnime?: string;
  favAnime?: string;
  gender?: string;
  bio?: string;
  setupComplete: boolean;
  totalPower: number;
  cardsToday: number;
  lastGenerated?: any;
  weeklyRank?: number;
  activeMinutes?: number;
  isTopThree?: boolean;
  badges?: string[];
}

interface AuthContextType {
  user: User | null;
  player: PlayerData | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  refreshPlayer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ["fuadeditingzone@gmail.com", "selectedlegendbusiness@gmail.com", "fuadahmod174@gmail.com"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = async (uid: string) => {
    const docRef = doc(db, 'players', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setPlayer(docSnap.data() as PlayerData);
    } else {
      setPlayer(null);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchPlayer(user.uid);
      } else {
        setPlayer(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !player) return;
    
    const interval = setInterval(async () => {
      try {
        const docRef = doc(db, 'players', user.uid);
        await updateDoc(docRef, {
          activeMinutes: increment(1)
        });
        setPlayer(prev => prev ? { ...prev, activeMinutes: (prev.activeMinutes || 0) + 1 } : prev);
      } catch (error) {
        console.error("Error updating active minutes:", error);
      }
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [user, player?.uid]);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if player exists in Firestore
      const docRef = doc(db, 'players', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Create new player entry
        const newPlayer: PlayerData = {
          uid: user.uid,
          displayName: user.displayName || "New Player",
          name: user.displayName || "New Player",
          email: user.email || "",
          photoURL: user.photoURL || "",
          gender: "Not Specified",
          bio: "",
          setupComplete: false,
          totalPower: 0,
          cardsToday: 0,
          activeMinutes: 0,
          isTopThree: false,
          badges: []
        };
        await setDoc(docRef, newPlayer);
        setPlayer(newPlayer);
      } else {
        setPlayer(docSnap.data() as PlayerData);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || "") : false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      player, 
      loading, 
      login, 
      logout, 
      isAdmin,
      refreshPlayer: () => user ? fetchPlayer(user.uid) : Promise.resolve()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
