import React, { ReactNode } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  User, 
  Settings, 
  LogOut,
  Send,
  MoreHorizontal,
  ShieldCheck,
  Moon,
  Sun,
  Zap,
  Activity,
  RotateCcw,
  X as CloseIcon,
  Brain,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMessages } from '../context/MessageContext';
import { useTweets } from '../context/TweetContext';
import Logo from '../components/Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { conversations } = useMessages();
  const { theme, toggleTheme, lastAction, undoAction } = useTweets();
  const navigate = useNavigate();

  // Simple unread calculation for messages based on conversations
  const unreadMessagesCount = conversations.filter(c => c.lastMessageSenderId !== user?.uid).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex justify-center max-w-7xl mx-auto px-0 md:px-4 gap-0 md:gap-4 relative">
      {/* Mobile Header (Top) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass flex items-center justify-between px-4 z-50 border-b border-white/10">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
          <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" onClick={() => navigate(`/profile/${user?.uid}`)} />
        </div>
        <div className="flex items-center gap-4">
           <div className="scale-75 origin-center">
             <Logo />
           </div>
           <button 
             onClick={toggleTheme}
             className="p-1.5 rounded-full glass border-white/10 text-jtweet-cyan"
           >
             {theme === 'cyber' ? <Zap size={16} /> : (theme === 'dark' ? <Moon size={16} /> : <Activity size={16} className="text-[#ff00ff]" />)}
           </button>
        </div>
        <div className="w-8 flex justify-center">
          <Settings size={20} className="text-white/40" onClick={() => navigate('/settings')} />
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 py-6 border-r border-white/10 pr-4">
        <Logo />
        <div className="mt-8 space-y-2">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center gap-4 p-4 px-6 rounded-2xl transition-all group relative border border-transparent text-white/40 hover:bg-white/5 hover:text-white"
           >
             <span className="group-hover:scale-110 transition-transform text-white/20 group-hover:text-white">
               {theme === 'cyber' ? <Zap size={24} className="text-jtweet-cyan shadow-cyan" /> : (theme === 'dark' ? <Moon size={24} /> : <Activity size={24} className="text-[#ff00ff]" />)}
             </span>
             <span className="text-sm font-bold uppercase tracking-[0.1em]">{theme === 'cyber' ? 'Cyber Mode' : (theme === 'dark' ? 'Dark Mode' : 'Plasma Mode')}</span>
           </button>
           <div className="h-px bg-white/5 mx-6 my-2" />
        </div>
        <nav className="space-y-2">
          <NavItem to="/" icon={<Home size={24} />} label="Home" />
          <NavItem to="/explore" icon={<Search size={24} />} label="Explore" />
          <NavItem to="/network" icon={<Brain size={24} />} label="Neural Mesh" />
          <NavItem to="/delete" icon={<Trash2 size={24} />} label="Delete" />
          {user?.role === 'admin' && (
            <NavItem 
              to="/admin" 
              icon={<ShieldCheck size={24} />} 
              label="Intelligence" 
              className="text-jtweet-cyan border-jtweet-cyan/20 bg-jtweet-cyan/5" 
            />
          )}
          <NavItem 
            to="/notifications" 
            icon={<Bell size={24} />} 
            label="Notifications" 
            badge={unreadCount}
          />
          <NavItem 
            to="/messages" 
            icon={<Mail size={24} />} 
            label="Messages" 
            badge={unreadMessagesCount > 0 ? 1 : 0} // Simplify messaging badge for now
          />
          <NavItem to={`/profile/${user?.uid}`} icon={<User size={24} />} label="Profile" />
          <NavItem to="/settings" icon={<Settings size={24} />} label="Settings" />
        </nav>
        
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.focus();
          }}
          className="mt-8 w-full glass hover:bg-jtweet-cyan/20 transition-all rounded-full py-4 font-bold text-lg cyan-border-glow flex items-center justify-center gap-2 group"
        >
           <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           Broadcast
        </button>
        
        <div className="mt-auto group relative">
          <div className="flex items-center gap-3 p-3 glass rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
            <img src={user?.avatar} alt="Avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="text-white/40 text-xs truncate">@user_{user?.uid.slice(0, 5)}</p>
            </div>
            <MoreHorizontal size={16} className="text-white/40" />
          </div>
          
          <div className="absolute bottom-full left-0 w-full mb-2 hidden group-hover:block animate-in fade-in slide-in-from-bottom-2 duration-200">
             <button 
               onClick={handleLogout}
               className="w-full glass p-4 rounded-2xl flex items-center gap-3 text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm"
             >
               <LogOut size={18} />
               Log out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Areas */}
      <main className="flex-1 w-full max-w-xl md:border-x border-white/10 min-h-screen pt-14 md:pt-0 mb-16 md:mb-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 h-screen sticky top-0 py-6 space-y-6">
        <div className="glass rounded-3xl p-4">
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                placeholder="Probe the Feed" 
                className="w-full bg-jtweet-gray border-none rounded-full py-2 pl-12 focus:ring-1 focus:ring-jtweet-cyan/50 transition-all text-sm"
              />
           </div>
        </div>

        <div className="glass rounded-3xl p-4 overflow-hidden border-white/5">
          <h3 className="font-display font-bold text-lg mb-4 tracking-tight">System Trends</h3>
          <div className="space-y-4">
            <TrendItem category="Technology" topic="#NeuroGraph" posts="12.4K" />
            <TrendItem category="Futurism" topic="#JTweet" posts="45.1K" />
            <TrendItem category="Analytics" topic="Real-time Flow" posts="8.2K" />
          </div>
        </div>
      </aside>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.focus();
          }, 100);
        }} 
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-jtweet-cyan text-jtweet-black rounded-full shadow-cyan flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Send size={24} />
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass h-16 flex items-center justify-around z-50 border-t border-white/10">
        <MobileNavItem to="/" icon={<Home size={24} />} />
        <MobileNavItem to="/explore" icon={<Search size={24} />} />
        <MobileNavItem to="/notifications" icon={<Bell size={24} />} badge={unreadCount} />
        <MobileNavItem to="/messages" icon={<Mail size={24} />} badge={unreadMessagesCount > 0 ? 1 : 0} />
      </nav>

      {/* Undo Action Toast */}
      <AnimatePresence>
        {lastAction && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
          >
            <div className="glass p-4 rounded-2xl border border-jtweet-cyan/30 shadow-cyan-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-jtweet-cyan/10 flex items-center justify-center text-jtweet-cyan">
                   <RotateCcw size={16} />
                </div>
                <div>
                   <p className="text-xs font-bold text-white uppercase tracking-wider">Signal Reversion Available</p>
                   <p className="text-[10px] text-white/40">Undo your last interaction</p>
                </div>
              </div>
              <button 
                onClick={undoAction}
                className="bg-white text-black px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-jtweet-cyan transition-all"
              >
                Restore
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ to, icon, label, className, badge }: { to: string, icon: ReactNode, label: string, className?: string, badge?: number }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex items-center gap-4 p-4 px-6 rounded-2xl transition-all group relative border border-transparent ${className} ${isActive ? 'bg-jtweet-cyan/5 border-jtweet-cyan/20 text-jtweet-cyan text-shadow-cyan' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
    >
      {({ isActive }) => (
        <>
          <span className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform text-white/20 group-hover:text-white'}`}>{icon}</span>
          <span className="text-sm font-bold uppercase tracking-[0.1em]">{label}</span>
          {badge && badge > 0 && (
            <span className="absolute left-10 top-3 min-w-[20px] h-5 bg-jtweet-cyan text-jtweet-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-cyan border-2 border-jtweet-black">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
          {isActive && (
            <motion.div layoutId="navIndicator" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-jtweet-cyan shadow-cyan" />
          )}
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ to, icon, badge }: { to: string, icon: ReactNode, badge?: number }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `p-3 rounded-xl transition-all relative group ${isActive ? 'text-jtweet-cyan glass shadow-cyan-lg' : 'text-white/20'}`}
    >
      <div className="group-active:scale-90 transition-transform">
        {icon}
      </div>
      {badge && badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-jtweet-cyan text-jtweet-black text-[9px] font-bold rounded-full flex items-center justify-center shadow-cyan overflow-hidden">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

function TrendItem({ category, topic, posts }: { category: string, topic: string, posts: string }) {
  return (
    <div className="group cursor-pointer">
      <p className="text-[10px] text-white/40 uppercase tracking-widest">{category}</p>
      <p className="font-bold text-sm mt-0.5 group-hover:text-jtweet-cyan transition-colors">{topic}</p>
      <p className="text-[10px] text-white/20 mt-0.5">{posts} pulses</p>
    </div>
  );
}
