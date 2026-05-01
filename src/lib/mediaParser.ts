
export interface ParsedMedia {
  youtubeId?: string;
  facebookVideoId?: string;
  imageUrls?: string[];
  cleanContent: string;
}

export function parseMediaLinks(content: string): ParsedMedia {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi;
  const facebookRegex = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/watch\/\?v=|facebook\.com\/video\.php\?v=|facebook\.com\/\w+\/videos\/)(\d+)/gi;
  const imageRegex = /(https?:\/\/[\w\-\.]+(?:\/|[\w\-\.\/]+)\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[\w\-\.\&\=]+)?)/gi;

  let youtubeId: string | undefined;
  let facebookVideoId: string | undefined;
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
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    cleanContent: cleanContent.trim()
  };
}
