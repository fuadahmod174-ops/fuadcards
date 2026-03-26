import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { generateAnimeImage, generateCardStats } from '../lib/gemini';
import { uploadToR2 } from '../lib/storage';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { differenceInHours, addHours } from 'date-fns';
import { Loader2, Sparkles, AlertCircle, Save, Dices, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { SEO } from '../components/SEO';
import { deleteFromR2 } from '../lib/storage';

const ANIME_CHARACTERS = [
  { name: "Goku", anime: "Dragon Ball Z" },
  { name: "Naruto Uzumaki", anime: "Naruto" },
  { name: "Monkey D. Luffy", anime: "One Piece" },
  { name: "Saitama", anime: "One Punch Man" },
  { name: "Levi Ackerman", anime: "Attack on Titan" },
  { name: "Gojo Satoru", anime: "Jujutsu Kaisen" },
  { name: "Sung Jin-Woo", anime: "Solo Leveling" },
  { name: "Killua Zoldyck", anime: "Hunter x Hunter" },
  { name: "Zoro", anime: "One Piece" },
  { name: "Edward Elric", anime: "Fullmetal Alchemist" },
  { name: "Ichigo Kurosaki", anime: "Bleach" },
  { name: "Sasuke Uchiha", anime: "Naruto" },
  { name: "Vegeta", anime: "Dragon Ball Z" },
  { name: "Eren Yeager", anime: "Attack on Titan" },
  { name: "Tanjiro Kamado", anime: "Demon Slayer" },
  { name: "Guts", anime: "Berserk" },
  { name: "Light Yagami", anime: "Death Note" },
  { name: "Lelouch vi Britannia", anime: "Code Geass" },
  { name: "Spike Spiegel", anime: "Cowboy Bebop" },
  { name: "Mob", anime: "Mob Psycho 100" },
  { name: "Gintoki Sakata", anime: "Gintama" },
  { name: "Yusuke Urameshi", anime: "Yu Yu Hakusho" },
  { name: "Gon Freecss", anime: "Hunter x Hunter" },
  { name: "Itachi Uchiha", anime: "Naruto" },
  { name: "Madara Uchiha", anime: "Naruto" },
  { name: "Aizen Sosuke", anime: "Bleach" },
  { name: "Ken Kaneki", anime: "Tokyo Ghoul" },
  { name: "Midoriya Izuku", anime: "My Hero Academia" },
  { name: "Bakugo Katsuki", anime: "My Hero Academia" },
  { name: "Todoroki Shoto", anime: "My Hero Academia" },
  { name: "Yuji Itadori", anime: "Jujutsu Kaisen" },
  { name: "Megumi Fushiguro", anime: "Jujutsu Kaisen" },
  { name: "Sukuna", anime: "Jujutsu Kaisen" },
  { name: "Denji", anime: "Chainsaw Man" },
  { name: "Makima", anime: "Chainsaw Man" },
  { name: "Anya Forger", anime: "Spy x Family" },
  { name: "Loid Forger", anime: "Spy x Family" },
  { name: "Yor Forger", anime: "Spy x Family" },
  { name: "Rimuru Tempest", anime: "That Time I Got Reincarnated as a Slime" },
  { name: "Ainz Ooal Gown", anime: "Overlord" },
  { name: "Subaru Natsuki", anime: "Re:Zero" },
  { name: "Kazuma Satou", anime: "KonoSuba" }
];

export const GenerateView: React.FC = () => {
  const { user, player, login, refreshPlayer } = useAuth();
  const { t } = useLanguage();
  
  // Persistent state (The "Brain")
  const [character, setCharacter] = useState(() => localStorage.getItem('fc_gen_character') || '');
  const [anime, setAnime] = useState(() => localStorage.getItem('fc_gen_anime') || '');
  const [statsDraft, setStatsDraft] = useState<any>(() => {
    const saved = localStorage.getItem('fc_gen_stats');
    return saved ? JSON.parse(saved) : null;
  });
  const [generatedCard, setGeneratedCard] = useState<string | null>(null);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(() => localStorage.getItem('fc_gen_card_url'));
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [cooldown, setCooldown] = useState<number | null>(null);
  
  const [tempData, setTempData] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [forgeGallery, setForgeGallery] = useState<any[]>([]);

  // Save to "Brain" (localStorage)
  useEffect(() => {
    localStorage.setItem('fc_gen_character', character);
    localStorage.setItem('fc_gen_anime', anime);
    if (statsDraft) localStorage.setItem('fc_gen_stats', JSON.stringify(statsDraft));
    else localStorage.removeItem('fc_gen_stats');
    
    if (generatedCardUrl) localStorage.setItem('fc_gen_card_url', generatedCardUrl);
    else localStorage.removeItem('fc_gen_card_url');
  }, [character, anime, statsDraft, generatedCardUrl]);

  useEffect(() => {
    if (player) checkCooldown();
  }, [player]);

  useEffect(() => {
    if (!user) {
      setForgeGallery([]);
      return;
    }

    const q = query(
      collection(db, 'cards'),
      where('ownerId', '==', user.uid),
      where('status', '==', 'forge'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setForgeGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const checkCooldown = () => {
    if (!player) return;
    const maxCards = (player.activeMinutes && player.activeMinutes > 20) ? 6 : 4;
    
    if (player.lastGenerated && player.cardsToday >= maxCards) {
      const hours = differenceInHours(new Date(), player.lastGenerated.toDate());
      if (hours < 24) {
        setCooldown(24 - hours);
      } else {
        setCooldown(null);
      }
    } else {
      setCooldown(null);
    }
  };

  const handleRandom = () => {
    const randomChar = ANIME_CHARACTERS[Math.floor(Math.random() * ANIME_CHARACTERS.length)];
    setCharacter(randomChar.name);
    setAnime(randomChar.anime);
    setStatsDraft(null);
    setGeneratedCard(null);
  };

  const handleGenerateStats = async () => {
    if (!user) return login();
    if (cooldown) return;
    if (!character || !anime) return;

    setLoading(true);
    setStatus("Analyzing lore and calculating canonical stats...");
    try {
      const stats = await generateCardStats(character, anime);
      setStatsDraft(stats);
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Failed to generate stats.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!statsDraft || !user) return;
    setLoading(true);
    setStatus("AI is drawing your character...");
    try {
      const cardId = `FC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const imageUrl = await generateAnimeImage(character, anime);
      
      setStatus("Compositing trading card...");
      const finalCardUrl = await composeFinalCard(imageUrl, character, anime, statsDraft, cardId);

      setStatus("Forging temporary card in R2...");
      const r2Url = await uploadToR2(`${cardId}.png`, finalCardUrl);

      setStatus("Adding to Forge Gallery...");
      const expiresAt = addHours(new Date(), 24);
      
      await setDoc(doc(db, 'cards', cardId), {
        ownerId: user.uid,
        ownerUsername: player?.username || "",
        ownerDisplayName: player?.displayName || user.displayName || "",
        imageUrl: r2Url,
        raw_power: statsDraft.power,
        strength: statsDraft.strength,
        characterName: character,
        animeSource: anime,
        prompt_text: statsDraft.lore_reasoning || "",
        status: "forge",
        expiresAt: Timestamp.fromDate(expiresAt),
        qr_data: `${window.location.origin}/card/${cardId}`,
        createdAt: serverTimestamp()
      });

      setGeneratedCard(finalCardUrl);
      setGeneratedCardUrl(r2Url);
      const newCard = {
        cardId,
        character,
        anime,
        stats: statsDraft,
        imageUrl: r2Url,
        status: 'forge'
      };
      setTempData(newCard);
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Error generating image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToAccount = async (cardToSave?: any) => {
    const data = cardToSave || tempData;
    if (!user || !data) return;
    
    setLoading(true);
    setStatus("Saving to account...");
    try {
      await updateDoc(doc(db, 'cards', data.cardId || data.id), {
        status: "saved",
        expiresAt: null // Remove expiration
      });

      await setDoc(doc(db, 'players', user.uid), {
        lastGenerated: serverTimestamp(),
        cardsToday: (player?.cardsToday || 0) + 1,
        totalPower: (player?.totalPower || 0) + (data.stats?.power || data.raw_power)
      }, { merge: true });

      await refreshPlayer();
      setStatus("Saved successfully!");
      
      if (!cardToSave) {
        setStatsDraft(null);
        setGeneratedCard(null);
        setTempData(null);
        setCharacter('');
        setAnime('');
      }
    } catch (error) {
      console.error(error);
      setStatus("Error saving card.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForge = async (card: any) => {
    if (!window.confirm("Delete this draft from the forge?")) return;
    try {
      await deleteDoc(doc(db, 'cards', card.id));
      await deleteFromR2(`${card.id}.png`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cards/${card.id}`);
    }
  };

  const composeFinalCard = async (bgImage: string, name: string, anime: string, stats: any, cardId: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context failed");

    canvas.width = 800;
    canvas.height = 1200;

    // 0. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Layer 1 (Background): Gemini-generated character image (Full-bleed)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = bgImage;
    await new Promise(r => img.onload = r);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. Layer 2 (The "Real Card" Template): Transparent "frame" overlay
    const frameWidth = 25;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#bf953f'); // Gold
    gradient.addColorStop(0.25, '#fcf6ba'); // Light Gold
    gradient.addColorStop(0.5, '#b38728'); // Dark Gold
    gradient.addColorStop(0.75, '#fbf5b7'); // Light Gold
    gradient.addColorStop(1, '#aa771c'); // Gold
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth / 2, frameWidth / 2, canvas.width - frameWidth, canvas.height - frameWidth);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameWidth + 2, frameWidth + 2, canvas.width - (frameWidth * 2) - 4, canvas.height - (frameWidth * 2) - 4);

    // 3. Layer 3 (Text Integration): Character Name, PWR, and STR stats
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    ctx.font = '900 72px Inter';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(name.toUpperCase(), 50, canvas.height - 180);
    ctx.fillText(name.toUpperCase(), 50, canvas.height - 180);

    ctx.font = '900 48px JetBrains Mono';
    ctx.fillStyle = '#ef4444';
    ctx.strokeText(`PWR: ${stats.power}`, 50, canvas.height - 100);
    ctx.fillText(`PWR: ${stats.power}`, 50, canvas.height - 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(`STR: ${stats.strength}`, 350, canvas.height - 100);
    ctx.fillText(`STR: ${stats.strength}`, 350, canvas.height - 100);

    // 4. Layer 4 (Single QR): Bottom-right corner (60x60px)
    const qrUrl = `${window.location.origin}/card/${cardId}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 120, color: { dark: '#000000', light: '#ffffff' } });
    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise(r => qrImg.onload = r);
    ctx.drawImage(qrImg, canvas.width - 110, canvas.height - 110, 60, 60);

    return canvas.toDataURL('image/png');
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 pt-8 pb-24 md:py-12">
      <SEO 
        title="Generate AI Anime Cards - FuadCards" 
        description="Use Gemini AI to generate unique anime trading cards with canonical stats and professional designs."
      />
      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('generate')}</h1>
              <p className="mt-2 text-sm text-zinc-400 sm:text-base">{t('createUltimateCard')}</p>
            </div>
            {(character || anime || statsDraft || generatedCard) && (
              <button
                onClick={() => {
                  setCharacter('');
                  setAnime('');
                  setStatsDraft(null);
                  setGeneratedCard(null);
                  localStorage.removeItem('fc_gen_character');
                  localStorage.removeItem('fc_gen_anime');
                  localStorage.removeItem('fc_gen_stats');
                  localStorage.removeItem('fc_gen_card');
                }}
                className="text-xs text-zinc-500 hover:text-red-500 transition-colors"
              >
                Reset Brain
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-zinc-400">{t('characterName')}</label>
                <input
                  type="text"
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                  placeholder="e.g. Sung Jin-Woo"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-zinc-400">{t('animeSource')}</label>
                <input
                  type="text"
                  value={anime}
                  onChange={(e) => setAnime(e.target.value)}
                  placeholder="e.g. Solo Leveling"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleRandom}
              className="flex items-center gap-2 whitespace-nowrap text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              <Dices size={16} /> {t('randomCharacter')}
            </button>

            {cooldown ? (
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">
                  {t('cooldownActive').replace('{count}', cooldown.toString())}
                </p>
              </div>
            ) : !statsDraft ? (
              <button
                onClick={handleGenerateStats}
                disabled={loading || !character || !anime}
                className="group relative w-full overflow-hidden rounded-lg bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  {loading ? t('processing') : t('draftStats')}
                </div>
              </button>
            ) : !generatedCard ? (
              <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-bold text-white">{t('statsDraft')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500">{t('power')}</p>
                    <p className="text-xl font-bold text-emerald-500">{statsDraft.power}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500">{t('strength')}</p>
                    <p className="text-xl font-bold text-emerald-500">{statsDraft.strength}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 italic">"{statsDraft.lore_reasoning}"</p>
                <button
                  onClick={handleGenerateImage}
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-500 py-4 font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    {loading ? t('drawing') : t('generateCardImage')}
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveToAccount}
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 py-4 font-bold text-black transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {loading ? t('saving') : t('saveToAccount')}
                </div>
              </button>
            )}
            
            {status && <p className="text-center text-xs text-zinc-500">{status}</p>}
          </div>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-8">
          <AnimatePresence mode="wait">
            {(generatedCard || generatedCardUrl) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                className="relative aspect-[2.5/3.5] w-full max-w-[300px] sm:max-w-[350px] overflow-hidden rounded-xl shadow-2xl shadow-emerald-500/20"
              >
                <img 
                  src={generatedCard || generatedCardUrl || ""} 
                  alt="Generated Card" 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                  {t('temporary')}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-zinc-600">
                <div className="h-[400px] w-[280px] rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center">
                  {loading ? <Loader2 className="h-12 w-12 animate-spin text-emerald-500" /> : <Sparkles size={48} />}
                </div>
                <p className="text-sm">{t('cardWillAppear')}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('forgeGallery')}
          </h2>
          <span className="text-sm text-zinc-500">{t('temporaryCards').replace('{count}', forgeGallery.length.toString())}</span>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {forgeGallery.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                <img src={card.imageUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-500 backdrop-blur-md">
                    {t('forge')}
                  </span>
                  {card.expiresAt && (
                    <span className="rounded-full bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-500 backdrop-blur-md">
                      {t('expiresIn').replace('{count}', differenceInHours(card.expiresAt.toDate(), new Date()).toString())}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{card.characterName}</p>
                  <p className="text-xs text-zinc-500">{card.raw_power} {t('power')}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSaveToAccount(card)}
                    className="rounded-lg bg-emerald-500 p-2 text-black hover:bg-emerald-400 transition-colors"
                    title={t('saveToAccount')}
                  >
                    <Save size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteForge(card)}
                    className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-red-500 hover:text-white transition-colors"
                    title={t('deleteDraft')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {forgeGallery.length === 0 && (
            <div className="col-span-full flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 text-zinc-600">
              <p className="text-sm italic">{t('noForgedCards')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
