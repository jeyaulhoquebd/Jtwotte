import React, { ReactNode, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTweets, Tweet } from '../context/TweetContext';
import { suggestTweet } from '../services/geminiService';
import { formatDistanceToNow } from 'date-fns';
import MediaRenderer from '../components/MediaRenderer';

type FeedType = 'for-you' | 'following' | 'trending';

export default function HomeFeed() {
  const { user } = useAuth();
  const { tweets, postTweet, loading, toggleLike, retweet, deleteTweet } = useTweets();
  const [newTweet, setNewTweet] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [retweetModal, setRetweetModal] = useState<{ id: string, name: string } | null>(null);
  const [retweetCaption, setRetweetCaption] = useState('');
  const [activeFeed, setActiveFeed] = useState<FeedType>('for-you');

  const filteredTweets = useMemo(() => {
    if (activeFeed === 'trending') {
      return [...tweets].sort((a, b) => (b.likesCount + b.retweetsCount) - (a.likesCount + a.retweetsCount));
    }
    // Following logic would need a 'follow' system, defaulting to 'for-you' for now
    return tweets;
  }, [tweets, activeFeed]);

  const handlePost = async () => {
    if (!newTweet.trim()) return;
    await postTweet(newTweet);
    setNewTweet('');
    setSuggestions([]);
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
      <header className="sticky top-0 z-10 glass backdrop-blur-md border-b border-white/5">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold tracking-tight flex items-center gap-2">
            Main Protocol
            {user?.role === 'admin' && <ShieldCheck size={18} className="text-jtweet-cyan shadow-cyan" />}
          </h2>
          <div className="flex gap-2">
             <button className="text-[10px] font-bold text-jtweet-cyan px-2 py-0.5 rounded-full bg-jtweet-cyan/10 border border-jtweet-cyan/20 uppercase tracking-widest">Live</button>
          </div>
        </div>
        <div className="flex px-4 divide-x divide-white/5 border-t border-white/5">
           <FeedTab active={activeFeed === 'for-you'} label="For You" onClick={() => setActiveFeed('for-you')} />
           <FeedTab active={activeFeed === 'following'} label="Following" onClick={() => setActiveFeed('following')} />
           <FeedTab active={activeFeed === 'trending'} label="Trending" onClick={() => setActiveFeed('trending')} />
        </div>
      </header>

      {/* Retweet Modal Placeholder (Simple Overlay) */}
      <AnimatePresence>
        {retweetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jtweet-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-6 rounded-[32px] w-full max-w-md border-white/10"
            >
              <h3 className="text-sm font-bold text-jtweet-cyan mb-4 uppercase tracking-widest">Share Pulse</h3>
              <textarea 
                className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-white/20 resize-none min-h-[100px]"
                placeholder="Add your commentary (optional)..."
                autoFocus
                value={retweetCaption}
                onChange={(e) => setRetweetCaption(e.target.value)}
              />
              <div className="p-3 glass rounded-2xl border-white/5 bg-white/2 mb-6">
                <p className="text-[10px] text-white/40 mb-1">Retweeting from {retweetModal.name}</p>
                <p className="text-xs truncate text-white/60">Broadcast original signal to your feed.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setRetweetModal(null)}
                  className="flex-1 py-3 font-bold text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRetweetSubmit}
                  className="flex-1 bg-jtweet-cyan text-jtweet-black font-bold py-3 rounded-2xl hover:brightness-110 shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                >
                  Retweet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

interface TweetCardProps {
  key?: React.Key;
  tweet: Tweet;
  onLike: () => void;
  onRetweet: () => void;
  onDelete: () => void;
}

function TweetCard({ tweet, onLike, onRetweet, onDelete }: TweetCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { addComment, getComments } = useTweets();

  const timestamp = tweet.timestamp?.toDate ? formatDistanceToNow(tweet.timestamp.toDate(), { addSuffix: true }) : 'just now';
  const isRetweet = tweet.type === 'retweet';
  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.uid === tweet.authorId;

  const loadComments = async () => {
    const data = await getComments(tweet.id);
    setComments(data);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(tweet.id, newComment);
    setNewComment('');
    loadComments();
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-4 hover:bg-white/1 transition-colors group border-white/5"
      onClick={() => {
        if (!showComments) {
          setShowComments(true);
          loadComments();
        }
      }}
    >
      {isRetweet && (
        <div className="flex items-center gap-2 mb-2 ml-10">
          <Repeat2 size={12} className="text-white/30" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{tweet.author?.name} synchronized this signal</span>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative">
          <img src={tweet.author?.avatar} alt="Avatar" className="w-12 h-12 rounded-full h-12" referrerPolicy="no-referrer" />
          {tweet.author?.role === 'admin' && (
            <div className="absolute -bottom-1 -right-1 bg-jtweet-black rounded-full p-0.5 border border-white/10">
              <ShieldCheck size={12} className="text-jtweet-cyan shadow-cyan" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm truncate">
              <span className="font-bold hover:underline text-white flex items-center gap-1">
                {tweet.author?.name}
                {tweet.author?.role === 'admin' && <ShieldCheck size={14} className="text-jtweet-cyan" />}
              </span>
              <span className="text-white/30">{tweet.author?.handle}</span>
              <span className="text-white/20">· {timestamp}</span>
            </div>
            <div className="flex items-center gap-2">
              {(isAuthor || isAdmin) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Securely erase this signal from the network?")) onDelete();
                  }}
                  className="p-2 rounded-full hover:bg-red-400/10 text-white/5 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button className="text-white/20 hover:text-jtweet-cyan transition-colors p-1 rounded-full hover:bg-jtweet-cyan/10">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
          
          {tweet.content && (
            <p className="mt-2 text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap">{tweet.content}</p>
          )}

          {tweet.media && <MediaRenderer media={tweet.media} />}

          {isRetweet && tweet.originalTweet && (
            <div className="mt-3 p-4 glass rounded-2xl border-white/10 hover:bg-white/5 transition-all">
               <div className="flex items-center gap-2 mb-2">
                  <img src={tweet.originalTweet.author?.avatar} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  <span className="text-xs font-bold text-white/60">{tweet.originalTweet.author?.name}</span>
                  <span className="text-[10px] text-white/20">· Original Signal</span>
               </div>
               <p className="text-sm text-white/70 line-clamp-3">{tweet.originalTweet.content}</p>
               {tweet.originalTweet.media && <MediaRenderer media={tweet.originalTweet.media} />}
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between text-white/20 max-w-sm">
             <InteractionBtn icon={<MessageCircle size={18} />} count={tweet.repliesCount} color="cyan" onClick={() => setShowComments(!showComments)} />
             <InteractionBtn 
               icon={<Repeat2 size={18} />} 
               count={tweet.retweetsCount} 
               color="green" 
               onClick={(e) => {
                 e.stopPropagation();
                 onRetweet();
               }}
             />
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

          <AnimatePresence>
            {showComments && (
              <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="mt-6 border-t border-white/5 pt-4 space-y-4 overflow-hidden"
              >
                 <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <img src={user?.avatar} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 relative">
                       <input 
                         type="text" 
                         placeholder="Synthesize a reply..." 
                         className="w-full bg-white/5 border-none rounded-full py-2 px-4 focus:ring-1 focus:ring-jtweet-cyan/50 text-sm"
                         value={newComment}
                         onChange={(e) => setNewComment(e.target.value)}
                         onClick={(e) => e.stopPropagation()}
                       />
                       <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-jtweet-cyan">
                          <Send size={14} />
                       </button>
                    </div>
                 </form>

                 <div className="space-y-4 ml-4 border-l border-white/10 pl-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                         <img src={comment.author?.avatar} className="w-6 h-6 rounded-full" />
                         <div className="flex-1">
                            <div className="flex items-center gap-2 text-[10px]">
                               <span className="font-bold text-white/60">{comment.author?.name}</span>
                               <span className="text-white/20">· active signal</span>
                            </div>
                            <p className="text-xs text-white/80 mt-1">{comment.content}</p>
                         </div>
                      </div>
                    ))}
                    {comments.length === 0 && <p className="text-[10px] text-white/20 text-center py-2">No signals detected yet.</p>}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function FeedTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-4 text-sm font-bold transition-all relative ${active ? 'text-jtweet-cyan' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-jtweet-cyan shadow-cyan rounded-full"
        />
      )}
    </button>
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
