import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

interface MediaRendererProps {
  media?: {
    youtubeId?: string;
    facebookVideoId?: string;
    images?: string[];
    type?: string;
  };
}

export default function MediaRenderer({ media }: MediaRendererProps) {
  if (!media) return null;

  const isLocalVideo = media.type === 'video' || (media.images && media.images.length === 1 && media.images[0].includes('data:video'));

  return (
    <div className="mt-3 space-y-3">
      {media.youtubeId && (
        <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 group shadow-2xl">
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center gap-1">
             <Play size={10} fill="currentColor" /> YouTube
          </div>
          <iframe
            src={`https://www.youtube.com/embed/${media.youtubeId}?autoplay=0&mute=1&modestbranding=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {media.facebookVideoId && (
        <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 group shadow-2xl flex flex-col">
           <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center gap-1">
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
          />
        </div>
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
