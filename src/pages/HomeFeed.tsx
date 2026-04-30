import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Heart, MessageCircle, Repeat2, Share2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTweets, Tweet } from '../context/TweetContext';
import { suggestTweet } from '../services/geminiService';
import { formatDistanceToNow } from 'date-fns';

export default function HomeFeed() {
  const { user } = useAuth();
  const { tweets, postTweet, loading, toggleLike } = useTweets();
  const [newTweet, setNewTweet] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handlePost = async () => {
    if (!newTweet.trim()) return;
    await postTweet(newTweet);
    setNewTweet('');
    setSuggestions([]);
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
    <div>
      <header className="sticky top-0 z-10 glass p-4 mb-4 backdrop-blur-md flex items-center justify-between border-b border-white/5">
        <h2 className="text-xl font-display font-bold tracking-tight">Main Protocol</h2>
        <div className="flex gap-2">
           <button className="text-xs font-bold text-jtweet-cyan px-3 py-1 rounded-full bg-jtweet-cyan/10">Synchronized</button>
        </div>
      </header>

      {/* Composer */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-4">
          <img src={user?.avatar} alt="Avatar" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
          <div className="flex-1">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder-white/20 resize-none min-h-[100px]"
              placeholder="Synchronize your thoughts..."
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
            />
            
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-4 space-y-2"
                >
                  <p className="text-[10px] font-bold text-jtweet-cyan flex items-center gap-1 uppercase tracking-widest bg-jtweet-cyan/10 w-fit px-2 py-0.5 rounded-full mb-2">
                    <Sparkles size={10} /> AI Enhanced Flow
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => setNewTweet(s)}
                        className="block w-full text-left p-3 text-sm glass rounded-xl hover:bg-jtweet-cyan/5 transition-all text-white/60 hover:text-white border-white/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <button 
                  onClick={handleSuggest}
                  disabled={isSuggesting}
                  className="p-2 transition-all disabled:opacity-50 text-jtweet-cyan hover:bg-jtweet-cyan/10 rounded-full"
                  title="Enhance with AI"
                >
                  {isSuggesting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={20} /></motion.div>
                  ) : (
                    <Sparkles size={20} />
                  )}
                </button>
              </div>
              <button 
                onClick={handlePost}
                disabled={!newTweet.trim() || loading}
                className="bg-white text-jtweet-black font-bold px-8 py-2 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="p-12 text-center text-white/20">
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="inline-block"
            >
              <Repeat2 size={32} />
            </motion.div>
            <p className="mt-4 font-display font-medium tracking-widest text-[10px] uppercase">Retrieving Pulse Data...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} onLike={() => toggleLike(tweet.id)} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TweetCard({ tweet, onLike }: { tweet: Tweet, onLike: () => void }) {
  const timestamp = tweet.timestamp?.toDate ? formatDistanceToNow(tweet.timestamp.toDate(), { addSuffix: true }) : 'just now';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-4 hover:bg-white/2 transition-colors group cursor-pointer border-white/5"
    >
      <div className="flex gap-4">
        <img src={tweet.author?.avatar} alt="Avatar" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm truncate">
              <span className="font-bold hover:underline text-white">{tweet.author?.name}</span>
              <span className="text-white/30">{tweet.author?.handle}</span>
              <span className="text-white/20">· {timestamp}</span>
            </div>
            <button className="text-white/20 hover:text-jtweet-cyan transition-colors p-1 rounded-full hover:bg-jtweet-cyan/10">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap">{tweet.content}</p>
          
          <div className="mt-4 flex items-center justify-between text-white/20 max-w-sm">
             <InteractionBtn icon={<MessageCircle size={18} />} count={tweet.repliesCount} color="cyan" />
             <InteractionBtn icon={<Repeat2 size={18} />} count={tweet.retweetsCount} color="green" />
             <InteractionBtn 
               icon={<Heart size={18} />} 
               count={tweet.likesCount} 
               color="red" 
               onClick={(e) => {
                 e.stopPropagation();
                 onLike();
               }}
             />
             <InteractionBtn icon={<Share2 size={18} />} color="cyan" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InteractionBtn({ icon, count, color, onClick }: { icon: ReactNode, count?: number, color: 'cyan' | 'red' | 'green', onClick?: (e: any) => void }) {
  const colors = {
    cyan: 'hover:text-jtweet-cyan hover:bg-jtweet-cyan/10',
    red: 'hover:text-red-400 hover:bg-red-400/10',
    green: 'hover:text-green-400 hover:bg-green-400/10'
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 group/btn transition-all ${colors[color]} p-2 px-3 rounded-full -ml-2`}
    >
      <span className="group-hover/btn:scale-110 transition-transform">{icon}</span>
      {count !== undefined && <span className="text-xs font-medium">{count > 0 ? count : ''}</span>}
    </button>
  );
}
