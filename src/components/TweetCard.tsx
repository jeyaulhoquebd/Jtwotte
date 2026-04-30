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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-4 hover:bg-white/1 transition-colors group border-white/5"
    >
      {isRetweet && (
        <div className="flex items-center gap-2 mb-2 ml-10">
          <Repeat2 size={12} className="text-white/30" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{tweet.author?.name} synchronized this signal</span>
        </div>
      )}

      <div className="flex gap-4">
        <Link to={`/profile/${tweet.authorId}`} className="relative h-fit shrink-0" onClick={(e) => e.stopPropagation()}>
          <img src={tweet.author?.avatar} alt="Avatar" className="w-12 h-12 rounded-full h-12" referrerPolicy="no-referrer" />
          {tweet.author?.role === 'admin' && (
            <div className="absolute -bottom-1 -right-1 bg-jtweet-black rounded-full p-0.5 border border-white/10">
              <ShieldCheck size={12} className="text-jtweet-cyan shadow-cyan" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm truncate">
              <Link 
                to={`/profile/${tweet.authorId}`} 
                className="font-bold hover:underline text-white flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {tweet.author?.name}
                {tweet.author?.role === 'admin' && <ShieldCheck size={14} className="text-jtweet-cyan" />}
              </Link>
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
  const colors = {
    cyan: active ? 'text-jtweet-cyan bg-jtweet-cyan/10' : 'hover:text-jtweet-cyan hover:bg-jtweet-cyan/10',
    red: active ? 'text-red-400 bg-red-400/10' : 'hover:text-red-400 hover:bg-red-400/10',
    green: active ? 'text-green-400 bg-green-400/10' : 'hover:text-green-400 hover:bg-green-400/10'
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 group/btn transition-all ${colors[color]} p-2 px-3 rounded-full -ml-2 ${active ? 'font-bold' : ''}`}
    >
      <span className="group-hover/btn:scale-110 transition-transform">{icon}</span>
      {count !== undefined && <span className="text-xs font-medium">{count > 0 ? count : ''}</span>}
    </button>
  );
}
