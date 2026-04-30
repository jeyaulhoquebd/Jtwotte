import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  Repeat2, 
  UserPlus, 
  AtSign, 
  Zap,
  Trash2,
  CheckCheck,
  ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 glass border-b border-white/5 p-4 flex items-center justify-between">
        <div>
           <h2 className="text-xl font-display font-bold">Signal Log</h2>
           <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              {unreadCount} Unprocessed Traces
           </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="p-2 px-4 rounded-full border border-jtweet-cyan/30 text-jtweet-cyan hover:bg-jtweet-cyan/5 transition-all text-xs font-bold flex items-center gap-2"
          >
            <CheckCheck size={14} /> Clear All
          </button>
        )}
      </header>

      <div className="divide-y divide-white/5">
        <AnimatePresence initial={false}>
          {notifications.map((notif) => (
            <NotificationItem 
               key={notif.id} 
               notif={notif} 
               onRead={() => markAsRead(notif.id)} 
               onDelete={() => deleteNotification(notif.id)} 
            />
          ))}
        </AnimatePresence>
        
        {notifications.length === 0 && (
          <div className="p-20 text-center space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                <Bell size={32} />
             </div>
             <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Void Status: No incoming signals.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notif, onRead, onDelete }: { notif: any, onRead: () => void, onDelete: () => void, key?: React.Key }) {
  const getIcon = () => {
    switch (notif.type) {
      case 'like': return <Heart className="text-red-400 fill-red-400" size={16} />;
      case 'comment': return <MessageSquare className="text-jtweet-cyan" size={16} />;
      case 'retweet': return <Repeat2 className="text-green-400" size={16} />;
      case 'follow': return <UserPlus className="text-purple-400" size={16} />;
      case 'mention': return <AtSign className="text-blue-400" size={16} />;
      case 'broadcast': return <ShieldCheck className="text-jtweet-cyan shadow-cyan" size={16} />;
      default: return <Zap className="text-yellow-400" size={16} />;
    }
  };

  const timestamp = notif.timestamp?.toDate ? formatDistanceToNow(notif.timestamp.toDate(), { addSuffix: true }) : 'just now';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 flex gap-4 hover:bg-white/5 transition-all group relative ${!notif.read ? 'bg-jtweet-cyan/5 border-l-2 border-jtweet-cyan' : 'border-l-2 border-transparent'}`}
      onClick={onRead}
    >
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <img src={notif.sender?.avatar} alt="" className="w-8 h-8 rounded-full" />
          <span className="text-xs text-white/40 font-mono italic">{timestamp}</span>
        </div>
        <p className="text-sm">
          <span className="font-bold text-white mr-2">{notif.sender?.name}</span>
          <span className="text-white/60">{notif.content || 'interacted with your node'}</span>
        </p>
        
        {notif.type === 'broadcast' && (
          <div className="mt-3 p-4 glass rounded-2xl border-jtweet-cyan/20 bg-jtweet-cyan/5 border">
             <p className="text-jtweet-cyan text-xs font-bold leading-relaxed">{notif.content}</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
