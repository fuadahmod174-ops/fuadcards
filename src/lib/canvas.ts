import QRCode from 'qrcode';

interface CardData {
  image: string;
  characterName: string;
  animeSource: string;
  power: number;
  strength: number;
  rarity: string;
  cardId: string;
}

export async function composeCard(data: CardData): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  // Card dimensions (standard trading card ratio 2.5 x 3.5)
  canvas.width = 800;
  canvas.height = 1200;

  // 0. Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Layer 1 (Background): Gemini-generated character image (Full-bleed)
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = data.image;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 2. Layer 2 (The "Real Card" Template): Transparent "frame" overlay
  // Procedural Gilded Frame
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
  
  // Inner border
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(frameWidth + 2, frameWidth + 2, canvas.width - (frameWidth * 2) - 4, canvas.height - (frameWidth * 2) - 4);

  // 3. Layer 3 (Text Integration): Character Name, PWR, and STR stats
  // Style: Bold, high-contrast font with a 2px stroke (outline)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  
  // Name
  ctx.font = '900 72px Inter';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeText(data.characterName.toUpperCase(), 50, canvas.height - 180);
  ctx.fillText(data.characterName.toUpperCase(), 50, canvas.height - 180);

  // Stats (PWR & STR)
  ctx.font = '900 48px JetBrains Mono';
  
  // PWR
  ctx.fillStyle = '#ef4444'; // Red-500
  ctx.strokeText(`PWR: ${data.power}`, 50, canvas.height - 100);
  ctx.fillText(`PWR: ${data.power}`, 50, canvas.height - 100);
  
  // STR
  ctx.fillStyle = '#ffffff';
  ctx.strokeText(`STR: ${data.strength}`, 350, canvas.height - 100);
  ctx.fillText(`STR: ${data.strength}`, 350, canvas.height - 100);

  // 4. Layer 4 (Single QR): Bottom-right corner (60x60px)
  const qrUrl = `${window.location.origin}/card/${data.cardId}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    margin: 1,
    width: 120,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  const qrImg = new Image();
  qrImg.src = qrDataUrl;
  await new Promise((resolve) => (qrImg.onload = resolve));
  ctx.drawImage(qrImg, canvas.width - 110, canvas.height - 110, 60, 60);

  return canvas.toDataURL('image/png');
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'Legendary': return '#f59e0b'; // amber-500
    case 'Epic': return '#a855f7'; // purple-500
    case 'Rare': return '#3b82f6'; // blue-500
    default: return '#10b981'; // emerald-500
  }
}
