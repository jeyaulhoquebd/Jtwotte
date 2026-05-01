
export interface ParsedMedia {
  youtubeId?: string;
  facebookVideoId?: string;
  tiktokId?: string;
  instagramId?: string;
  imageUrls?: string[];
  cleanContent: string;
}

export function parseMediaLinks(content: string): ParsedMedia {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi;
  const facebookRegex = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/watch\/\?v=|facebook\.com\/video\.php\?v=|facebook\.com\/\w+\/videos\/)(\d+)/gi;
  const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[\w\.]+\/video\/|vm\.tiktok\.com\/|tiktok\.com\/t\/)([\w]{9,})/gi;
  const instagramRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reels|reel)\/([a-zA-Z0-9_-]+)/gi;
  const imageRegex = /(https?:\/\/[\w\-\.]+(?:\/|[\w\-\.\/]+)\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[\w\-\.\&\=]+)?)/gi;

  let youtubeId: string | undefined;
  let facebookVideoId: string | undefined;
  let tiktokId: string | undefined;
  let instagramId: string | undefined;
  const imageUrls: string[] = [];
  let cleanContent = content;

  // Extract YouTube
  const ytMatches = [...content.matchAll(youtubeRegex)];
  if (ytMatches.length > 0) {
    youtubeId = ytMatches[0][1];
    ytMatches.forEach(match => {
      cleanContent = cleanContent.replace(match[0], '');
    });
  }

  // Extract Facebook
  const fbMatches = [...content.matchAll(facebookRegex)];
  if (fbMatches.length > 0) {
    facebookVideoId = fbMatches[0][1];
    fbMatches.forEach(match => {
      cleanContent = cleanContent.replace(match[0], '');
    });
  }

  // Extract TikTok
  const ttMatches = [...content.matchAll(tiktokRegex)];
  if (ttMatches.length > 0) {
    tiktokId = ttMatches[0][1];
    ttMatches.forEach(match => {
      cleanContent = cleanContent.replace(match[0], '');
    });
  }

  // Extract Instagram
  const igMatches = [...content.matchAll(instagramRegex)];
  if (igMatches.length > 0) {
    instagramId = igMatches[0][1];
    igMatches.forEach(match => {
      cleanContent = cleanContent.replace(match[0], '');
    });
  }

  // Extract Images (only if not already a video)
  const imgMatches = [...content.matchAll(imageRegex)];
  if (imgMatches.length > 0) {
    imgMatches.forEach(match => {
      imageUrls.push(match[0]);
      cleanContent = cleanContent.replace(match[0], '');
    });
  }

  return {
    youtubeId,
    facebookVideoId,
    tiktokId,
    instagramId,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    cleanContent: cleanContent.trim()
  };
}
