import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Heart, Calendar, AtSign } from 'lucide-react';

export const SetupView: React.FC = () => {
  const { user, refreshPlayer } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Not Specified');
  const [favoriteAnime, setFavoriteAnime] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    
    try {
      // Check if username is unique
      const usernameQuery = query(collection(db, 'players'), where('username', '==', username.toLowerCase()));
      const usernameDocs = await getDocs(usernameQuery);
      
      if (!usernameDocs.empty) {
        setError('Username is already taken.');
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, 'players', user.uid), {
        displayName: name,
        name: name,
        username: username.toLowerCase(),
        age: parseInt(age),
        gender,
        favoriteAnime,
        favAnime: favoriteAnime,
        photoURL,
        setupComplete: true
      });
      await refreshPlayer();
      navigate('/');
    } catch (error: any) {
      console.error("Setup failed", error);
      setError(error.message || 'An error occurred during setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white">PROFILE SETUP</h1>
          <p className="mt-2 text-zinc-400">Welcome to FuadCards. Let's get you started.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative group">
              <img 
                src={photoURL || "https://picsum.photos/seed/avatar/200"} 
                alt="Profile" 
                className="h-24 w-24 rounded-full border-2 border-emerald-500 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={20} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <User size={16} /> Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <AtSign size={16} /> Username
              </label>
              <input
                type="text"
                required
                pattern="^[a-zA-Z0-9_]{3,15}$"
                title="3-15 characters, letters, numbers, and underscores only"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
                placeholder="cool_ninja_99"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Calendar size={16} /> Age
              </label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <User size={16} /> Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Heart size={16} /> Favorite Anime
              </label>
              <input
                type="text"
                required
                value={favoriteAnime}
                onChange={(e) => setFavoriteAnime(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? "SAVING..." : "COMPLETE SETUP"}
          </button>
        </form>
      </div>
    </div>
  );
};
