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
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoaded || isIframeLoaded) return;

    // Watchdog timer: If iframe doesn't call onLoad within 8 seconds, assume restriction
    loadingTimeoutRef.current = setTimeout(() => {
      if (!isIframeLoaded) {
        setHasError(true);
      }
    }, 8000);

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [isLoaded, isIframeLoaded]);

  useEffect(() => {
    if (!isIframeLoaded || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            try {
              if (entry.isIntersecting) {
                if (type === 'youtube') {
                  iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
                }
              } else {
                if (type === 'youtube') {
                  iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
                }
              }
            } catch (e) {
              // Silently catch cross-origin policy errors
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isIframeLoaded, type]);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
  };

  if (hasError) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-jtweet-black/60 border border-red-500/20 flex flex-col items-center justify-center p-6 text-center space-y-4 backdrop-blur-xl">
        <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-display font-medium text-sm md:text-base">Stream restricted on {label}</p>
          <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-widest leading-relaxed px-4">Sources may block external embedding based on regional protocols or privacy settings. This node may have been redacted or restricted by the platform host.</p>
        </div>
        <motion.a
          href={originalUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 shadow-xl hover:bg-jtweet-cyan transition-colors"
        >
          <Share2 size={12} /> View on {label}
        </motion.a>
      </div>
    );
  }

  const isVertical = type === 'tiktok' || type === 'instagram';

  return (
    <div 
      ref={containerRef}
      className={`relative ${isVertical ? 'aspect-[9/16] max-h-[500px] md:max-h-[600px] w-full max-w-[300px] md:max-w-[340px] mx-auto' : 'aspect-video w-full mx-auto'} rounded-2xl overflow-hidden glass border border-white/10 group shadow-2xl transition-all hover:border-jtweet-cyan/30`}
    >
      {!isLoaded ? (
        <div 
          className="w-full h-full cursor-pointer relative flex items-center justify-center bg-jtweet-black group"
          onClick={() => setIsLoaded(true)}
        >
          {type === 'youtube' && (
            <img 
              src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} 
              alt="Thumbnail" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700" 
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-jtweet-black via-transparent to-black/20" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 w-14 h-14 md:w-16 md:h-16 rounded-full bg-jtweet-cyan/10 backdrop-blur-3xl border border-jtweet-cyan/30 flex items-center justify-center text-jtweet-cyan group-hover:scale-110 group-hover:bg-jtweet-cyan group-hover:text-black transition-all shadow-[0_0_40px_rgba(34,211,238,0.2)]"
          >
            <Play size={24} fill="currentColor" className="md:w-7 md:h-7" />
          </motion.div>
        </div>
      ) : (
        <div className="w-full h-full relative">
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-jtweet-black/40 backdrop-blur-md z-10">
              <div className="w-4 h-4 border-2 border-jtweet-cyan/20 border-t-jtweet-cyan rounded-full animate-spin" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={getEmbedUrl(id, true)}
            title={`${label} video player`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        </div>
      )}
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
              whileHover={{ scale: 1.04, zIndex: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative rounded-2xl overflow-hidden glass border border-white/10 shadow-lg group cursor-zoom-in ${media.images && media.images.length === 1 ? 'aspect-auto max-h-[600px]' : 'aspect-square'}`}
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
