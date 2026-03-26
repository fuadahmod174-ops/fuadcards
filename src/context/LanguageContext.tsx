import React, { createContext, useContext, useState } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    home: "হোম",
    generate: "কার্ড তৈরি করুন",
    leaderboard: "লিডারবোর্ড",
    profile: "প্রোফাইল",
    admin: "অ্যাডমিন",
    login: "লগইন",
    logout: "লগআউট",
    heroTitle: "আপনার নিজস্ব এনিমে কার্ড তৈরি করুন",
    heroSub: "এআই এর মাধ্যমে তৈরি করুন হাই-এন্ড ট্রেডিং কার্ড",
    generateBtn: "তৈরি শুরু করুন",
    cooldown: "পরবর্তী কার্ড তৈরির জন্য অপেক্ষা করুন",
    power: "শক্তি",
    strength: "ক্ষমতা",
    rarity: "বিরলতা",
    footerDesc: "এআই জেনারেশন এবং ফিজিক্যাল অর্ডারিং সহ হাই-এন্ড এনিমে ট্রেডিং কার্ড প্ল্যাটফর্ম। ফুয়াদ আহমেদ দ্বারা তৈরি।",
    quickLinks: "দ্রুত লিঙ্ক",
    support: "সাপোর্ট",
    contactSupport: "সাপোর্ট যোগাযোগ",
    creatorPortfolio: "ক্রিয়েটর পোর্টফোলিও",
    copyright: "© ২০২৬ ফুয়াদকার্ডস। ফুয়াদ আহমেদ (fuadeditingzone) দ্বারা তৈরি।",
    yourProfile: "আপনার প্রোফাইল",
    generateCard: "কার্ড তৈরি করুন",
    leaderDashboard: "লিডারবোর্ড ড্যাশবোর্ড",
    manageAccount: "অ্যাকাউন্ট ম্যানেজ করুন",
    adminDashboard: "অ্যাডমিন ড্যাশবোর্ড",
    saveChanges: "পরিবর্তন সংরক্ষণ করুন",
    fullName: "পুরো নাম",
    username: "ইউজারনেম",
    gender: "লিঙ্গ",
    bio: "বায়ো",
    favAnime: "প্রিয় এনিমে",
    totalPower: "মোট শক্তি",
    globalLeaderboard: "গ্লোবাল লিডারবোর্ড",
    strongestCollectors: "বিশ্বের সবচেয়ে শক্তিশালী কার্ড সংগ্রাহক।",
    noPlayers: "লিডারবোর্ডে এখনও কোনো খেলোয়াড় নেই।",
    loadingProfile: "প্রোফাইল লোড হচ্ছে...",
    profileNotFound: "প্রোফাইল পাওয়া যায়নি",
    userNotExist: "আপনি যে ব্যবহারকারীকে খুঁজছেন তার অস্তিত্ব নেই।",
    goHome: "হোমে যান",
    saving: "সংরক্ষণ করা হচ্ছে...",
    weeklyRecap: "সাপ্তাহিক রিক্যাপ",
    weeklyRecapDesc: "আপনি এই সপ্তাহে {count}টি কার্ড তৈরি করেছেন। এখানে আপনার সেরা কার্ডটি রয়েছে!",
    awesome: "অসাধারণ!",
    physicalOrders: "ফিজিক্যাল কার্ড অর্ডার",
    recentGenerations: "সাম্প্রতিক জেনারেশন",
    noOrders: "এখনও কোনো অর্ডার নেই।",
    noCards: "এখনও কোনো কার্ড তৈরি হয়নি।",
    cleanupForge: "ফোর্জ পরিষ্কার করুন",
    wipeAllData: "সব ডেটা মুছে ফেলুন",
    resetMyAccount: "আমার অ্যাকাউন্ট রিসেট করুন",
    orderAccepted: "অর্ডার গ্রহণ করা হয়েছে",
    orderRejected: "অর্ডার প্রত্যাখ্যান করা হয়েছে",
    orderPending: "অর্ডার পেন্ডিং",
    accept: "গ্রহণ করুন",
    reject: "প্রত্যাখ্যান করুন",
    createUltimateCard: "আপনার সেরা এনিমে কার্ড তৈরি করুন।",
    characterName: "চরিত্রের নাম",
    animeSource: "এনিমে সোর্স",
    randomCharacter: "এলোমেলো চরিত্র",
    cooldownActive: "কুলডাউন সক্রিয়। {count} ঘণ্টা বাকি।",
    draftStats: "ড্রাফট স্ট্যাটস",
    statsDraft: "স্ট্যাটস ড্রাফট",
    generateCardImage: "কার্ড ইমেজ তৈরি করুন",
    saveToAccount: "অ্যাকাউন্টে সংরক্ষণ করুন",
    processing: "প্রসেসিং...",
    drawing: "আঁকা হচ্ছে...",
    forgeGallery: "দ্য ফোর্জ গ্যালারি",
    temporaryCards: "{count}টি অস্থায়ী কার্ড",
    forge: "ফোর্জ",
    expiresIn: "{count} ঘণ্টার মধ্যে মেয়াদ শেষ হবে",
    noForgedCards: "গ্যালারিতে এখনও কোনো কার্ড তৈরি হয়নি। একটি কার্ড তৈরি করুন!",
    deleteDraft: "ড্রাফট মুছে ফেলুন",
    cardWillAppear: "আপনার কার্ড এখানে প্রদর্শিত হবে",
    temporary: "অস্থায়ী",
    cardNotFound: "কার্ড পাওয়া যায়নি।",
    returnHome: "হোমে ফিরে যান",
    back: "পিছনে",
    ordered: "অর্ডার করা হয়েছে",
    loreReasoning: "লোর এবং যুক্তি",
    orderPhysicalCard: "ফিজিক্যাল কার্ড অর্ডার করুন",
    shareCard: "কার্ড শেয়ার করুন",
    linkCopied: "লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে!",
    notifications: "নোটিফিকেশন",
    markAllAsRead: "সবগুলো পঠিত হিসেবে চিহ্নিত করুন",
    noNotifications: "এখনও কোনো নোটিফিকেশন নেই।",
    orderNow: "অর্ডার করুন",
    orderConfirmed: "অর্ডার নিশ্চিত করা হয়েছে",
    noCardsYet: "এখনও কোনো কার্ড নেই।"
  },
  en: {
    home: "Home",
    generate: "Generate",
    leaderboard: "Leaderboard",
    profile: "Profile",
    admin: "Admin",
    login: "Login",
    logout: "Logout",
    heroTitle: "Create Your Own Anime Cards",
    heroSub: "Generate high-end trading cards with AI",
    generateBtn: "Start Generating",
    cooldown: "Wait for next card generation",
    power: "Power",
    strength: "Strength",
    rarity: "Rarity",
    footerDesc: "High-end anime trading card platform with AI generation and physical ordering. Created by Fuad Ahmed.",
    quickLinks: "Quick Links",
    support: "Support",
    contactSupport: "Contact Support",
    creatorPortfolio: "Creator Portfolio",
    copyright: "© 2026 FuadCards. Created by Fuad Ahmed (fuadeditingzone).",
    yourProfile: "Your Profile",
    generateCard: "Generate Card",
    leaderDashboard: "Leader Dashboard",
    manageAccount: "Manage Account",
    adminDashboard: "Admin Dashboard",
    saveChanges: "Save Changes",
    fullName: "Full Name",
    username: "Username",
    gender: "Gender",
    bio: "Bio",
    favAnime: "Favorite Anime",
    totalPower: "Total Power",
    globalLeaderboard: "Global Leaderboard",
    strongestCollectors: "The strongest card collectors in the world.",
    noPlayers: "No players on the leaderboard yet.",
    loadingProfile: "LOADING PROFILE...",
    profileNotFound: "Profile Not Found",
    userNotExist: "The user you are looking for doesn't exist.",
    goHome: "Go Home",
    saving: "Saving...",
    weeklyRecap: "Weekly Recap",
    weeklyRecapDesc: "You generated {count} cards this week. Here is your best pull!",
    awesome: "Awesome!",
    physicalOrders: "Physical Card Orders",
    recentGenerations: "Recent Generations",
    noOrders: "No orders yet.",
    noCards: "No cards generated yet.",
    cleanupForge: "Cleanup Forge",
    wipeAllData: "Wipe All Data",
    resetMyAccount: "Reset My Account",
    orderAccepted: "Order Accepted",
    orderRejected: "Order Rejected",
    orderPending: "Order Pending",
    accept: "Accept",
    reject: "Reject",
    createUltimateCard: "Create your ultimate anime card.",
    characterName: "Character Name",
    animeSource: "Anime Source",
    randomCharacter: "Random Character",
    cooldownActive: "Cooldown active. {count} hours remaining.",
    draftStats: "Draft Stats",
    statsDraft: "Stats Draft",
    generateCardImage: "Generate Card Image",
    saveToAccount: "Save to Account",
    processing: "Processing...",
    drawing: "Drawing...",
    forgeGallery: "The Forge Gallery",
    temporaryCards: "{count} temporary cards",
    forge: "FORGE",
    expiresIn: "EXPIRES IN {count}H",
    noForgedCards: "No cards forged in the gallery yet. Generate one to see it here!",
    deleteDraft: "Delete Draft",
    cardWillAppear: "Your card will appear here",
    temporary: "TEMPORARY",
    cardNotFound: "Card not found.",
    returnHome: "Return Home",
    back: "Back",
    ordered: "ORDERED",
    loreReasoning: "Lore & Reasoning",
    orderPhysicalCard: "Order Physical Card",
    shareCard: "Share Card",
    linkCopied: "Link copied to clipboard!",
    notifications: "Notifications",
    markAllAsRead: "Mark all as read",
    noNotifications: "No notifications yet.",
    orderNow: "Order Now",
    orderConfirmed: "Order Confirmed",
    noCardsYet: "No cards yet."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('fc_language');
    return (saved === 'bn' || saved === 'en') ? saved : 'bn';
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('fc_language', newLang);
  };

  const t = (key: string) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
