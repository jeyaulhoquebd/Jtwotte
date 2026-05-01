import React, { useState, useEffect, useRef } from 'react';
import { Play, Share2, AlertCircle, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaRendererProps {
  media?: {
    youtubeId?: string;
    facebookVideoId?: string;
    tiktokId?: string;
    instagramId?: string;
    images?: string[];
    type?: string;
    originalUrl?: string;
  };
}

const EmbedCard = ({ 
  type, 
  id, 
  originalUrl, 
  label, 
  color, 
  getEmbedUrl 
}: { 
  type: string, 
  id: string, 
  originalUrl: string, 
  label: string, 
  color: string,
  getEmbedUrl: (id: string, autoPlay?: boolean) => string
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            if (entry.isIntersecting) {
              // Resume if YouTube
              if (type === 'youtube') {
                iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
              }
            } else {
              // Pause if YouTube
              if (type === 'youtube') {
                iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isLoaded, type]);

  if (hasError) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-jtweet-black/60 border border-white/5 flex flex-col items-center justify-center p-6 text-center space-y-4 backdrop-blur-xl">
        <div className="p-3 rounded-full bg-white/5 border border-white/10 shadow-inner">
          <AlertCircle size={32} className="text-white/20" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-display font-medium text-sm">Video unavailable for embed</p>
          <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">This node may be restricted by source security protocols</p>
        </div>
        <motion.a
          href={originalUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2.5 bg-gradient-to-r from-jtweet-cyan to-blue-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2"
        >
          <span className="flex items-center gap-2 transition-transform group-hover:translate-x-1">
            <Share2 size={12} /> Watch on {label}
          </span>
        </motion.a>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${type === 'tiktok' || type === 'instagram' ? 'aspect-[9/16] max-h-[600px] w-full max-w-[340px] mx-auto' : 'aspect-video'} rounded-2xl overflow-hidden glass border border-white/10 group shadow-2xl transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:border-jtweet-cyan/30`}
    >
      <div className={`absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full ${color} text-[10px] font-bold text-white flex items-center gap-1.5 shadow-xl backdrop-blur-md border border-white/10`}>
        <Play size={10} fill="currentColor" /> {label}
      </div>

      {!isLoaded ? (
        <div 
          className="w-full h-full cursor-pointer relative flex items-center justify-center bg-gradient-to-br from-jtweet-black to-gray-900 group"
          onClick={() => setIsLoaded(true)}
        >
          {type === 'youtube' && (
            <img 
              src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`} 
              alt="Thumbnail" 
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
            />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 w-16 h-16 rounded-full bg-jtweet-cyan/20 backdrop-blur-xl border border-jtweet-cyan/40 flex items-center justify-center text-jtweet-cyan shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:scale-110 group-hover:bg-jtweet-cyan group-hover:text-black transition-all"
          >
            <Play size={28} fill="currentColor" />
          </motion.div>
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-jtweet-cyan transition-colors">Click to Load Stream</p>
          </div>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(id, true)}
          title={`${label} video player`}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      )}

      <div className="absolute bottom-3 right-3 opacity-60 group-hover:opacity-100 transition-all transform translate-y-0 z-20">
        <motion.a 
          href={originalUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-2 hover:bg-jtweet-cyan hover:text-black transition-all"
        >
          <Share2 size={12} /> Watch on {label}
        </motion.a>
      </div>
    </div>
  );
};

const VideoElement = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play().catch(() => {});
            } else {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return <video ref={videoRef} src={src} controls className="w-full h-full object-cover" />;
};

export default function MediaRenderer({ media }: MediaRendererProps) {
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  
  if (!media) return null;

  const isLocalVideo = media.type === 'video' || (media.images && media.images.length === 1 && media.images[0].includes('data:video'));

  return (
    <div className="mt-3 space-y-3">
      {media.youtubeId && (
        <EmbedCard 
          type="youtube"
          id={media.youtubeId}
          originalUrl={`https://www.youtube.com/watch?v=${media.youtubeId}`}
          label="YouTube"
          color="bg-red-600"
          getEmbedUrl={(id) => `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1`}
        />
      )}

      {media.facebookVideoId && (
        <EmbedCard 
          type="facebook"
          id={media.facebookVideoId}
          originalUrl={`https://www.facebook.com/watch/?v=${media.facebookVideoId}`}
          label="Facebook"
          color="bg-blue-600"
          getEmbedUrl={(id, auto) => `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D${id}&show_text=0&autoplay=${auto ? 1 : 0}`}
        />
      )}

      {media.tiktokId && (
        <EmbedCard 
          type="tiktok"
          id={media.tiktokId}
          originalUrl={`https://www.tiktok.com/video/${media.tiktokId}`}
          label="TikTok"
          color="bg-jtweet-black"
          getEmbedUrl={(id) => `https://www.tiktok.com/embed/v2/${id}`}
        />
      )}

      {media.instagramId && (
        <EmbedCard 
          type="instagram"
          id={media.instagramId}
          originalUrl={`https://www.instagram.com/reels/${media.instagramId}/`}
          label="Reels"
          color="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600"
          getEmbedUrl={(id) => `https://www.instagram.com/p/${id}/embed/`}
        />
      )}

      {media.images && media.images.length > 0 && (
        <div className={`grid gap-2 ${media.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {media.images.map((img, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.01 }}
              className={`relative rounded-2xl overflow-hidden glass border border-white/10 shadow-lg group ${media.images && media.images.length === 1 ? 'aspect-auto max-h-[600px]' : 'aspect-square'}`}
              onClick={() => !isLocalVideo && setZoomImg(img)}
            >
              {isLocalVideo ? (
                <VideoElement src={img} />
              ) : (
                <>
                  <img 
                    src={img} 
                    alt={`Media ${idx}`} 
                    className="w-full h-full object-cover cursor-pointer group-hover:brightness-110 transition-all"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-jtweet-cyan/0 group-hover:bg-jtweet-cyan/5 transition-all pointer-events-none" />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <div className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-jtweet-cyan">
                      <Maximize2 size={16} />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {zoomImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-jtweet-black/95 backdrop-blur-2xl"
            onClick={() => setZoomImg(null)}
          >
            <motion.button 
              className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-jtweet-cyan hover:text-black transition-all z-[110]"
              onClick={() => setZoomImg(null)}
            >
              <X size={24} />
            </motion.button>
            <motion.img 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={zoomImg} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.2)]"
              alt="Zoomed"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
