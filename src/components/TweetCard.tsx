import React, { useState, ReactNode, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Trash2, ShieldCheck, Send, Crown, BadgeCheck, Zap, Rocket, Flame, Brain, Sparkles, Smile, Meh, Frown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useTweets, Tweet, ReactionType } from '../context/TweetContext';
import MediaRenderer from './MediaRenderer';
import { summarizeTweet, analyzeSentiment } from '../services/geminiService';

interface TweetCardProps {
  tweet: Tweet;
  onLike: () => void;
  onRetweet: () => void;
  onDelete: () => void;
}

const REACTION_CONFIG: Record<ReactionType, { icon: ReactNode, color: string, label: string }> = {
  like: { icon: <Heart size={14} />, color: 'red', label: 'Energize' },
  love: { icon: <Heart size={14} fill="currentColor" />, color: 'pink', label: 'Sync' },
  insightful: { icon: <Brain size={14} />, color: 'purple', label: 'Neural' },
  fire: { icon: <Flame size={14} />, color: 'orange', label: 'Critical' },
  rocket: { icon: <Rocket size={14} />, color: 'cyan', label: 'Launch' }
};

function FormattedContent({ content }: { content: string }) {
  const navigate = useNavigate();

  const renderers = {
    p: ({ children }: any) => {
      if (typeof children === 'string' || Array.isArray(children)) {
        const text = Array.isArray(children) ? children.join('') : children;
        // Split by whitespace but keep the whitespace
        const words = String(text).split(/(\s+)/);
        return (
          <p className="mt-2 text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap break-words [word-break:break-word] overflow-hidden">
            {words.map((word, i) => {
              if (word.startsWith('#')) {
                return (
                  <span 
                    key={i} 
                    className="text-jtweet-cyan hover:underline cursor-pointer font-bold inline-block"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/?q=${encodeURIComponent(word)}`);
                    }}
                  >
                    {word}
                  </span>
                );
              }
              if (word.startsWith('@')) {
                return (
                  <span 
                    key={i} 
                    className="text-jtweet-cyan hover:underline cursor-pointer font-bold inline-block"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${word.substring(1)}`);
                    }}
                  >
                    {word}
                  </span>
                );
              }
              // Detect URLs and force break-all
              if (word.match(/^https?:\/\//)) {
                return (
                  <a 
                    key={i} 
                    href={word}
                    target="_blank"
                    rel="noreferrer"
                    className="text-jtweet-cyan hover:underline break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {word}
                  </a>
                );
              }
              return word;
            })}
          </p>
        );
      }
      return <p className="mt-2 text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap break-words [word-break:break-word] overflow-hidden">{children}</p>;
    }
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown components={renderers}>{content}</ReactMarkdown>
    </div>
  );
}

export default function TweetCard({ tweet, onLike, onRetweet, onDelete }: TweetCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { addComment, getComments, isLiked, toggleReaction, getUserReaction } = useTweets();
  const reactionTimeout = useRef<NodeJS.Timeout | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);

  useEffect(() => {
    if (tweet.content && tweet.content.length > 200 && !sentiment) {
      analyzeSentiment(tweet.content).then(setSentiment);
    }
  }, [tweet.content]);

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (summary) {
      setSummary(null);
      return;
    }
    setIsSummarizing(true);
    const result = await summarizeTweet(tweet.content);
    setSummary(result);
    setIsSummarizing(false);
  };

  const timestamp = tweet.timestamp?.toDate ? formatDistanceToNow(tweet.timestamp.toDate(), { addSuffix: true }) : 'just now';
  const isRetweet = tweet.type === 'retweet';
  const isAdminEmail = user?.email === 'jeyaulhoque2025@gmail.com' || user?.email === 'jeyaulbooks@gmail.com';
  const isAdmin = user?.role === 'admin' || user?.role === 'founder' || isAdminEmail;
  const isFounder = tweet.author?.role === 'founder';
  const isAuthor = user?.uid === tweet.authorId;
  const userReaction = getUserReaction(tweet.id);
  const liked = isLiked(tweet.id);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="p-3 md:p-5 hover:bg-white/2 transition-all group relative border-b border-white/5"
    >
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-jtweet-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {isRetweet && (
        <div className="flex items-center gap-2 mb-3 ml-10 md:ml-12">
          <Repeat2 size={12} className="text-jtweet-cyan animate-pulse md:size-14" />
          <span className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">{tweet.author?.name} echoed this signal</span>
        </div>
      )}

      <div className="flex gap-3 md:gap-4 relative">
        <Link to={`/profile/${tweet.authorId}`} className="relative h-fit shrink-0 group/avatar" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden glass border border-white/10 group-hover/avatar:border-jtweet-cyan/50 transition-all p-0.5">
            <img src={tweet.author?.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[10px] md:rounded-[14px]" referrerPolicy="no-referrer" />
          </div>
          {isFounder && (
            <div className="absolute -top-2 -left-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg p-1 border border-white/20 shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10 animate-bounce">
              <Crown size={12} className="text-white" />
            </div>
          )}
          {tweet.author?.role === 'admin' && !isFounder && (
            <div className="absolute -bottom-1.5 -right-1.5 bg-jtweet-black rounded-lg p-1 border border-jtweet-cyan/30 shadow-cyan">
              <ShieldCheck size={12} className="text-jtweet-cyan" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm truncate">
              <Link 
                to={`/profile/${tweet.authorId}`} 
                className="font-bold hover:text-jtweet-cyan text-white transition-colors flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {tweet.author?.name}
                {isFounder && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400/20 to-amber-600/20 px-1.5 py-0.5 rounded-full border border-yellow-400/30">
                    <Crown size={12} className="text-yellow-400" />
                    <span className="text-[8px] font-bold text-yellow-400 uppercase tracking-tighter">Founder</span>
                  </div>
                )}
                {(tweet.author?.role === 'admin' || tweet.author?.role === 'founder') && <BadgeCheck size={14} className="text-blue-400 fill-blue-400/20" />}
                {tweet.author?.role === 'user' && (tweet.likesCount || 0) > 100 && <BadgeCheck size={14} className="text-jtweet-cyan" />}
              </Link>
              <span className="text-white/30 font-mono text-xs">@{tweet.author?.handle?.replace('@', '') || 'neural_node'}</span>
              <span className="text-white/10">·</span>
              <span className="text-white/20 text-xs">{timestamp}</span>
            </div>
            <div className="flex items-center gap-2">
              {sentiment && (
                <div className={`p-1 px-2 rounded-full border text-[8px] font-bold uppercase flex items-center gap-1 ${
                  sentiment === 'positive' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                  sentiment === 'negative' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {sentiment === 'positive' && <Smile size={10} />}
                  {sentiment === 'negative' && <Frown size={10} />}
                  {sentiment === 'neutral' && <Meh size={10} />}
                  {sentiment}
                </div>
              )}
              {tweet.content && tweet.content.length > 200 && (
                <button 
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${summary ? 'bg-jtweet-cyan text-black border-jtweet-cyan shadow-cyan' : 'bg-white/5 border-white/10 text-white/40 hover:text-jtweet-cyan hover:border-jtweet-cyan/40'}`}
                >
                  <Sparkles size={12} className={isSummarizing ? 'animate-spin' : ''} />
                  {summary ? 'Full Signal' : 'Summary'}
                </button>
              )}
              {(isAuthor || isAdmin) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm("CRITICAL: This signal will be permanently redacted from history. Proceed?")) onDelete();
                  }}
                  className="p-2 rounded-full hover:bg-red-400/10 text-white/30 hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1.5"
                  title="Purge Signal"
                >
                  <Trash2 size={14} className="md:size-4" />
                  <span className="text-[9px] font-bold uppercase tracking-tight md:hidden">Delete</span>
                </button>
              )}
              <button className="text-white/20 hover:text-jtweet-cyan transition-colors p-1 rounded-full hover:bg-jtweet-cyan/10">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
          
          {tweet.content && (
            <div className="relative group/content">
              <FormattedContent content={tweet.content} />
              
              <AnimatePresence>
                {summary && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 p-4 glass border border-jtweet-cyan/20 bg-jtweet-cyan/5 rounded-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-jtweet-cyan" />
                    <div className="flex items-center gap-2 mb-1 text-jtweet-cyan text-[10px] font-bold uppercase tracking-widest">
                       <Brain size={12} />
                       AI Pulse Summary
                    </div>
                    <p className="text-xs text-white/90 italic leading-relaxed">
                       "{summary}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {tweet.media && <MediaRenderer media={tweet.media} />}

          {isRetweet && tweet.originalTweet && (
            <div className="mt-3 p-4 glass rounded-2xl border-white/10 hover:bg-white/5 transition-all">
               <div className="flex items-center gap-2 mb-2">
                  <img src={tweet.originalTweet.author?.avatar} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  <span className="text-xs font-bold text-white/60">{tweet.originalTweet.author?.name}</span>
                  <span className="text-[10px] text-white/20">· Original Signal</span>
               </div>
               <FormattedContent content={tweet.originalTweet.content} />
               {tweet.originalTweet.media && <MediaRenderer media={tweet.originalTweet.media} />}
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between text-white/20 max-w-sm relative">
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
             
             <div 
               className="relative"
               onMouseEnter={() => {
                 if (window.innerWidth > 768) {
                    if (reactionTimeout.current) clearTimeout(reactionTimeout.current);
                    setShowReactions(true);
                 }
               }}
               onMouseLeave={() => {
                 if (window.innerWidth > 768) {
                    reactionTimeout.current = setTimeout(() => setShowReactions(false), 500);
                 }
               }}
               onClick={(e) => {
                 if (window.innerWidth <= 768) {
                   e.stopPropagation();
                   setShowReactions(!showReactions);
                 }
               }}
             >
               <AnimatePresence>
                 {showReactions && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8, y: 10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.8, y: 10 }}
                     className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1.5 glass rounded-full flex gap-1 z-50 border border-white/10 backdrop-blur-3xl shadow-2xl shadow-black"
                   >
                     {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((type) => {
                       const count = tweet.reactions?.[type] || 0;
                       return (
                         <button
                           key={type}
                           onClick={(e) => {
                             e.stopPropagation();
                             toggleReaction(tweet.id, type);
                             setShowReactions(false);
                           }}
                           className={`p-2 rounded-full hover:bg-white/10 transition-all flex flex-col items-center gap-0.5 ${userReaction === type ? 'bg-white/10 text-jtweet-cyan scale-110' : 'text-white/40'}`}
                           title={REACTION_CONFIG[type].label}
                         >
                           {REACTION_CONFIG[type].icon}
                           {count > 0 && <span className="text-[7px] font-bold">{count}</span>}
                         </button>
                       );
                     })}
                   </motion.div>
                 )}
               </AnimatePresence>
               
               <InteractionBtn 
                 icon={userReaction ? REACTION_CONFIG[userReaction].icon : <Zap size={18} />} 
                 count={(tweet.likesCount || 0) + Object.values(tweet.reactions || {}).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0)} 
                 color={userReaction ? (REACTION_CONFIG[userReaction].color as any) : "red"} 
                 active={!!userReaction}
                 onClick={(e) => {
                   e.stopPropagation();
                   onLike();
                 }}
               />
             </div>
             
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

function InteractionBtn({ icon, count, color, active, onClick }: { icon: ReactNode, count?: number, color: string, active?: boolean, onClick?: (e: any) => void }) {
  const configs: Record<string, any> = {
    cyan: {
      active: 'text-jtweet-cyan shadow-[0_0_15px_rgba(0,255,242,0.3)] bg-jtweet-cyan/10',
      hover: 'hover:text-jtweet-cyan hover:bg-jtweet-cyan/5 hover:shadow-[0_0_10px_rgba(0,255,242,0.1)]'
    },
    red: {
      active: 'text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)] bg-red-400/10',
      hover: 'hover:text-red-400 hover:bg-red-400/5 hover:shadow-[0_0_10px_rgba(248,113,113,0.1)]'
    },
    orange: {
      active: 'text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)] bg-orange-400/10',
      hover: 'hover:text-orange-400 hover:bg-orange-400/5 hover:shadow-[0_0_10px_rgba(251,146,60,0.1)]'
    },
    pink: {
      active: 'text-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.3)] bg-pink-400/10',
      hover: 'hover:text-pink-400 hover:bg-pink-400/5 hover:shadow-[0_0_10px_rgba(244,114,182,0.1)]'
    },
    purple: {
      active: 'text-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)] bg-purple-400/10',
      hover: 'hover:text-purple-400 hover:bg-purple-400/5 hover:shadow-[0_0_10px_rgba(192,132,252,0.1)]'
    },
    green: {
      active: 'text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)] bg-green-400/10',
      hover: 'hover:text-green-400 hover:bg-green-400/5 hover:shadow-[0_0_10px_rgba(74,222,128,0.1)]'
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 md:gap-2 group/btn transition-all p-2 md:p-2.5 px-3 md:px-4 rounded-xl md:rounded-2xl border border-transparent ${active ? configs[color].active + ' border-white/5' : 'text-white/30 ' + configs[color].hover} active:scale-90`}
    >
      <div className="group-hover/btn:scale-125 transition-transform duration-300">
        {icon}
      </div>
      {count !== undefined && <span className={`text-[9px] md:text-[10px] font-bold tracking-widest ${active ? 'opacity-100' : 'opacity-40'}`}>{count || '0'}</span>}
    </button>
  );
}
