import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Trash2, ShieldCheck, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTweets, Tweet } from '../context/TweetContext';
import MediaRenderer from './MediaRenderer';

interface TweetCardProps {
  tweet: Tweet;
  onLike: () => void;
  onRetweet: () => void;
  onDelete: () => void;
  key?: React.Key;
}

export default function TweetCard({ tweet, onLike, onRetweet, onDelete }: TweetCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { addComment, getComments, isLiked } = useTweets();

  const timestamp = tweet.timestamp?.toDate ? formatDistanceToNow(tweet.timestamp.toDate(), { addSuffix: true }) : 'just now';
  const isRetweet = tweet.type === 'retweet';
  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.uid === tweet.authorId;
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
      className="p-5 hover:bg-white/2 transition-all group relative border-b border-white/5"
    >
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-jtweet-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {isRetweet && (
        <div className="flex items-center gap-2 mb-3 ml-12">
          <Repeat2 size={14} className="text-jtweet-cyan animate-pulse" />
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">{tweet.author?.name} echoed this signal</span>
        </div>
      )}

      <div className="flex gap-4 relative">
        <Link to={`/profile/${tweet.authorId}`} className="relative h-fit shrink-0 group/avatar" onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden glass border border-white/10 group-hover/avatar:border-jtweet-cyan/50 transition-all p-0.5">
            <img src={tweet.author?.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
          </div>
          {tweet.author?.role === 'admin' && (
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
                {tweet.author?.role === 'admin' && <ShieldCheck size={14} className="text-jtweet-cyan shadow-cyan" />}
              </Link>
              <span className="text-white/30 font-mono text-xs">@{tweet.author?.handle?.replace('@', '') || 'neural_node'}</span>
              <span className="text-white/10">·</span>
              <span className="text-white/20 text-xs">{timestamp}</span>
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
               icon={<Heart size={18} className={liked ? "fill-red-400 text-red-400" : ""} />} 
               count={tweet.likesCount} 
               color="red" 
               active={liked}
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

function InteractionBtn({ icon, count, color, active, onClick }: { icon: ReactNode, count?: number, color: 'cyan' | 'red' | 'green', active?: boolean, onClick?: (e: any) => void }) {
  const configs = {
    cyan: {
      active: 'text-jtweet-cyan shadow-[0_0_15px_rgba(0,255,242,0.3)] bg-jtweet-cyan/10',
      hover: 'hover:text-jtweet-cyan hover:bg-jtweet-cyan/5 hover:shadow-[0_0_10px_rgba(0,255,242,0.1)]'
    },
    red: {
      active: 'text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)] bg-red-400/10',
      hover: 'hover:text-red-400 hover:bg-red-400/5 hover:shadow-[0_0_10px_rgba(248,113,113,0.1)]'
    },
    green: {
      active: 'text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)] bg-green-400/10',
      hover: 'hover:text-green-400 hover:bg-green-400/5 hover:shadow-[0_0_10px_rgba(74,222,128,0.1)]'
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 group/btn transition-all p-2.5 px-4 rounded-2xl border border-transparent ${active ? configs[color].active + ' border-white/5' : 'text-white/30 ' + configs[color].hover} active:scale-90`}
    >
      <div className="group-hover/btn:scale-125 transition-transform duration-300">{icon}</div>
      {count !== undefined && <span className={`text-[10px] font-bold tracking-widest ${active ? 'opacity-100' : 'opacity-40'}`}>{count || '0'}</span>}
    </button>
  );
}
