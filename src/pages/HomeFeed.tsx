import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Repeat2, BadgeCheck, Image as ImageIcon, X, Search, Hash } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTweets } from '../context/TweetContext';
import { suggestTweet } from '../services/geminiService';
import TweetCard from '../components/TweetCard';
import { TweetSkeleton } from '../components/Skeleton';

type FeedType = 'for-you' | 'following' | 'trending' | 'search';

export default function HomeFeed() {
  const { user } = useAuth();
  const { tweets, postTweet, loading, toggleLike, retweet, deleteTweet } = useTweets();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q');
  
  const [newTweet, setNewTweet] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [retweetModal, setRetweetModal] = useState<{ id: string, name: string } | null>(null);
  const [retweetCaption, setRetweetCaption] = useState('');
  const [activeFeed, setActiveFeed] = useState<FeedType>(queryParam ? 'search' : 'for-you');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  useEffect(() => {
    if (queryParam) {
      setActiveFeed('search');
    }
  }, [queryParam]);

  const filteredTweets = useMemo(() => {
    let base = [...tweets];
    
    if (activeFeed === 'search' && queryParam) {
      const q = queryParam.toLowerCase();
      return base.filter(t => 
        t.content.toLowerCase().includes(q) || 
        t.author?.name.toLowerCase().includes(q) ||
        t.author?.handle.toLowerCase().includes(q)
      );
    }

    if (activeFeed === 'trending') {
      return base.sort((a, b) => (b.likesCount + b.retweetsCount) - (a.likesCount + a.retweetsCount));
    }
    
    if (activeFeed === 'for-you') {
      return base.sort((a, b) => {
        const scoreA = (a.likesCount * 0.4) + (a.retweetsCount * 0.3) + (a.repliesCount * 0.2) + (a.impressions * 0.1);
        const scoreB = (b.likesCount * 0.4) + (b.retweetsCount * 0.3) + (b.repliesCount * 0.2) + (b.impressions * 0.1);
        
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
        
        const ageFactorA = Math.max(0, 1 - (Date.now() - timeA) / (1000 * 60 * 60 * 24));
        const ageFactorB = Math.max(0, 1 - (Date.now() - timeB) / (1000 * 60 * 60 * 24));
        
        return (scoreB * (0.5 + ageFactorB)) - (scoreA * (0.5 + ageFactorA));
      });
    }
    
    return base;
  }, [tweets, activeFeed, queryParam]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!newTweet.trim() && !mediaPreview) return;
    
    // In a real app, you'd upload the file to storage here and get a URL.
    // We'll pass the mediaPreview (dataURL) for simulation or storage.
    const media = mediaPreview ? { url: mediaPreview, type: selectedMedia?.type.startsWith('video') ? 'video' : 'image' } : undefined;
    
    await postTweet(newTweet, media);
    setNewTweet('');
    setSuggestions([]);
    setSelectedMedia(null);
    setMediaPreview(null);
  };

  const handleRetweetSubmit = async () => {
    if (!retweetModal) return;
    await retweet(retweetModal.id, retweetCaption);
    setRetweetModal(null);
    setRetweetCaption('');
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    const result = await suggestTweet(newTweet || "innovation and future tech");
    if (Array.isArray(result)) {
      setSuggestions(result);
    }
    setIsSuggesting(false);
  };

  return (
    <div className="relative">
      <header className="sticky top-0 z-20 glass backdrop-blur-3xl border-b border-white/5">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold tracking-tight flex items-center gap-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Neural Feed
            {(user?.role === 'admin' || user?.role === 'founder') && <BadgeCheck size={18} className="text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] fill-blue-400/20" />}
          </h2>
          <div className="flex gap-2">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-jtweet-cyan/5 border border-jtweet-cyan/20">
               <div className="w-1.5 h-1.5 rounded-full bg-jtweet-cyan animate-pulse shadow-cyan" />
               <span className="text-[10px] font-bold text-jtweet-cyan uppercase tracking-widest">Core Active</span>
             </div>
          </div>
        </div>
        <div className="flex px-4 divide-x divide-white/5 border-t border-white/5 overflow-x-auto custom-scrollbar">
           <FeedTab active={activeFeed === 'for-you'} label="Neural Sync" onClick={() => { setActiveFeed('for-you'); setSearchParams({}); }} />
           <FeedTab active={activeFeed === 'following'} label="Linked Nodes" onClick={() => { setActiveFeed('following'); setSearchParams({}); }} />
           <FeedTab active={activeFeed === 'trending'} label="High Flux" onClick={() => { setActiveFeed('trending'); setSearchParams({}); }} />
           {queryParam && <FeedTab active={activeFeed === 'search'} label="Result Trace" onClick={() => setActiveFeed('search')} />}
        </div>
      </header>

      <AnimatePresence>
        {queryParam && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-jtweet-cyan/5 border-b border-white/5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-jtweet-cyan" />
              <span className="text-xs font-bold text-white/60">Tracing signal: </span>
              <span className="text-xs font-mono font-bold text-jtweet-cyan glass px-2 py-0.5 rounded-full">{queryParam}</span>
            </div>
            <button 
              onClick={() => {
                setSearchParams({});
                setActiveFeed('for-you');
              }}
              className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest flex items-center gap-1"
            >
              Clear Probe <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retweet Modal */}
      <AnimatePresence>
        {retweetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jtweet-black/80 backdrop-blur-sm shadow-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass p-8 rounded-[40px] w-full max-w-lg border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jtweet-cyan to-transparent animate-pulse" />
              <h3 className="text-sm font-bold text-jtweet-cyan mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                <Repeat2 size={16} /> 
                Amplify Signal
              </h3>
              
              <textarea 
                className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder-white/10 resize-none min-h-[120px] mb-6"
                placeholder="Add synthesis logs (optional)..."
                autoFocus
                value={retweetCaption}
                onChange={(e) => setRetweetCaption(e.target.value)}
              />
              
              <div className="p-4 glass rounded-3xl border-white/5 bg-white/2 mb-8 border-l-4 border-l-jtweet-cyan/50">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Original Source: {retweetModal.name}</p>
                <p className="text-xs text-white/50 italic font-mono truncate">Synchronizing metadata and content flow...</p>
              </div>
              
              <div className="flex gap-4">
                <button onClick={() => setRetweetModal(null)} className="flex-1 py-4 font-bold text-white/20 hover:text-white transition-all uppercase tracking-widest text-xs">Abort</button>
                <button onClick={handleRetweetSubmit} className="flex-1 bg-jtweet-cyan text-jtweet-black font-bold py-4 rounded-2xl hover:brightness-110 shadow-cyan transition-all uppercase tracking-widest text-xs">Transmit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="p-4 md:p-6 border-b border-white/10 group/composer relative overflow-hidden hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-br from-jtweet-cyan/5 via-transparent to-transparent opacity-0 group-focus-within/composer:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        <div className="flex gap-3 md:gap-4 relative">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden glass border border-white/10 shrink-0 p-0.5 relative">
            <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl placeholder-white/10 resize-none min-h-[80px] md:min-h-[100px] transition-all"
              placeholder="What signals are you transmitting?"
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
            />
            
            <AnimatePresence>
              {mediaPreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="relative mb-6 group/media rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl"
                >
                  {selectedMedia?.type.startsWith('video') ? (
                     <video src={mediaPreview} className="w-full max-h-[400px] object-contain bg-black" controls />
                  ) : (
                     <img src={mediaPreview} alt="Preview" className="w-full max-h-[400px] object-cover" />
                  )}
                  <button 
                    onClick={() => { setSelectedMedia(null); setMediaPreview(null); }}
                    className="absolute top-4 right-4 p-2 bg-jtweet-black/60 backdrop-blur-md rounded-xl text-white hover:bg-red-400 transition-all shadow-xl"
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {suggestions.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-bold text-jtweet-cyan flex items-center gap-1 uppercase tracking-widest bg-jtweet-cyan/10 w-fit px-2 py-0.5 rounded-full mb-2">
                  <Sparkles size={10} /> AI Enhanced Flow
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setNewTweet(s)} className="block w-full text-left p-3 text-sm glass rounded-xl hover:bg-jtweet-cyan/5 transition-all text-white/60 hover:text-white border-white/5">{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSuggest}
                  disabled={isSuggesting}
                  className="p-2 transition-all disabled:opacity-50 text-jtweet-cyan hover:bg-jtweet-cyan/10 rounded-full"
                >
                  {isSuggesting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={20} /></motion.div> : <Sparkles size={20} />}
                </button>
                <label className="p-2 cursor-pointer text-jtweet-cyan hover:bg-jtweet-cyan/10 rounded-full transition-all">
                   <ImageIcon size={20} />
                   <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaSelect} />
                </label>
              </div>
              <button 
                onClick={handlePost}
                disabled={(!newTweet.trim() && !mediaPreview) || loading}
                className="bg-white text-jtweet-black font-bold px-8 py-2 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-white/20 shadow-lg"
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-white/5">
        {loading && tweets.length === 0 ? (
          <div className="space-y-0">
            <TweetSkeleton />
            <TweetSkeleton />
            <TweetSkeleton />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTweets.map((tweet) => (
              <TweetCard 
                key={tweet.id} 
                tweet={tweet} 
                onLike={() => toggleLike(tweet.id)} 
                onRetweet={() => setRetweetModal({ id: tweet.id, name: tweet.author?.name || 'User' })}
                onDelete={() => deleteTweet(tweet.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function FeedTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 py-4 text-sm font-bold transition-all relative ${active ? 'text-jtweet-cyan' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
      {label}
      {active && <motion.div layoutId="activeTabHead" className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-jtweet-cyan shadow-cyan rounded-full" />}
    </button>
  );
}
