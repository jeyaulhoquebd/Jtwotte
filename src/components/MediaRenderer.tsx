import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

interface MediaRendererProps {
  media?: {
    youtubeId?: string;
    images?: string[];
  };
}

export default function MediaRenderer({ media }: MediaRendererProps) {
  if (!media) return null;

  return (
    <div className="mt-3 space-y-3">
      {media.youtubeId && (
        <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 group">
          <iframe
            src={`https://www.youtube.com/embed/${media.youtubeId}?autoplay=0&mute=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {media.images && media.images.length > 0 && (
        <div className={`grid gap-2 ${media.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {media.images.map((img, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square rounded-2xl overflow-hidden glass border border-white/10"
            >
              <img 
                src={img} 
                alt={`Media ${idx}`} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
