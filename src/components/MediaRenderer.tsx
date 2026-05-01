import React, { useState } from 'react';
import { Play, Share2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MediaRendererProps {
  media?: {
    youtubeId?: string;
    facebookVideoId?: string;
    images?: string[];
    type?: string;
    originalUrl?: string; // Storing the raw link for fallback
  };
}

export default function MediaRenderer({ media }: MediaRendererProps) {
  const [ytError, setYtError] = useState(false);
  const [fbError, setFbError] = useState(false);
  
  if (!media) return null;

  const isLocalVideo = media.type === 'video' || (media.images && media.images.length === 1 && media.images[0].includes('data:video'));

  const getSourceUrl = () => {
    if (media.youtubeId) return `https://www.youtube.com/watch?v=${media.youtubeId}`;
    if (media.facebookVideoId) return `https://www.facebook.com/watch/?v=${media.facebookVideoId}`;
    return media.originalUrl || '#';
  };

  const FallbackCard = ({ platform }: { platform: string }) => (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-jtweet-black/60 border border-white/5 flex flex-col items-center justify-center p-6 text-center space-y-4 backdrop-blur-xl">
      <div className="p-3 rounded-full bg-white/5 border border-white/10 shadow-inner">
        <AlertCircle size={32} className="text-white/20" />
      </div>
      <div className="space-y-1">
        <p className="text-white font-display font-medium text-sm">Video unavailable for embed</p>
        <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">This node may be restricted by source security protocols</p>
      </div>
      <motion.a
        href={getSourceUrl()}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-2.5 bg-gradient-to-r from-jtweet-cyan to-blue-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
      >
        <Share2 size={12} />
        Sync on {platform}
      </motion.a>
    </div>
  );

  return (
    <div className="mt-3 space-y-3">
      {media.youtubeId && (
        ytError ? <FallbackCard platform="YouTube" /> : (
        <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 group shadow-2xl">
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center gap-1 shadow-lg">
             <Play size={10} fill="currentColor" /> YouTube
          </div>
          <iframe
            src={`https://www.youtube.com/embed/${media.youtubeId}?autoplay=0&mute=1&modestbranding=1&rel=0`}
            title="YouTube video player"
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setYtError(true)}
          />
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            <motion.a 
              href={getSourceUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-2 hover:bg-jtweet-cyan hover:text-black transition-all"
            >
              <Share2 size={12} /> Direct Node
            </motion.a>
          </div>
        </div>
        )
      )}

      {media.facebookVideoId && (
        fbError ? <FallbackCard platform="Facebook" /> : (
        <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 group shadow-2xl flex flex-col">
           <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center gap-1 shadow-lg">
             <Play size={10} fill="currentColor" /> Facebook
          </div>
          <iframe 
            src={`https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F${media.facebookVideoId}%2F&show_text=0&width=560`} 
            className="w-full h-full border-none overflow-hidden" 
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no" 
            frameBorder="0" 
            allowFullScreen={true} 
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onError={() => setFbError(true)}
          />
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
             <motion.a 
              href={getSourceUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-2 hover:bg-jtweet-cyan hover:text-black transition-all"
            >
              <Share2 size={12} /> Direct Node
            </motion.a>
          </div>
        </div>
        )
      )}

      {media.images && media.images.length > 0 && (
        <div className={`grid gap-2 ${media.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {media.images.map((img, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.01 }}
              className={`relative rounded-2xl overflow-hidden glass border border-white/10 shadow-lg ${media.images && media.images.length === 1 ? 'aspect-auto max-h-[600px]' : 'aspect-square'}`}
            >
              {isLocalVideo ? (
                <video src={img} controls className="w-full h-full object-cover" />
              ) : (
                <img 
                  src={img} 
                  alt={`Media ${idx}`} 
                  className="w-full h-full object-cover cursor-pointer hover:brightness-110 transition-all"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
