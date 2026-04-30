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
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMessages } from '../context/MessageContext';
import Logo from '../components/Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { conversations } = useMessages();
  const navigate = useNavigate();

  // Simple unread calculation for messages based on conversations
  const unreadMessagesCount = conversations.filter(c => c.lastMessageSenderId !== user?.uid).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex justify-center max-w-7xl mx-auto px-4 gap-4">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 py-6 border-r border-white/10 pr-4">
        <Logo />
        <nav className="mt-8 space-y-2">
          <NavItem to="/" icon={<Home size={24} />} label="Home" />
          <NavItem to="/explore" icon={<Search size={24} />} label="Explore" />
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
        
        <button className="mt-8 w-full glass hover:bg-jtweet-cyan/20 transition-all rounded-full py-4 font-bold text-lg cyan-border-glow flex items-center justify-center gap-2 group">
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
      <main className="flex-1 max-w-xl border-x border-white/10 min-h-screen">
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass h-16 flex items-center justify-around z-50 border-t border-white/10">
        <MobileNavItem to="/" icon={<Home size={24} />} />
        <MobileNavItem to="/explore" icon={<Search size={24} />} />
        <MobileNavItem to="/notifications" icon={<Bell size={24} />} badge={unreadCount} />
        <MobileNavItem to="/messages" icon={<Mail size={24} />} badge={unreadMessagesCount > 0 ? 1 : 0} />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, className, badge }: { to: string, icon: ReactNode, label: string, className?: string, badge?: number }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex items-center gap-4 p-3 px-4 rounded-full transition-all group relative ${className} ${isActive ? 'font-bold bg-white/5 text-jtweet-cyan' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
    >
      {({ isActive }) => (
        <>
          <span className={`${isActive ? 'cyan-glow' : 'group-hover:scale-110 transition-transform'}`}>{icon}</span>
          <span className="text-lg">{label}</span>
          {badge && badge > 0 && (
            <span className="absolute left-8 top-2 min-w-[20px] h-5 bg-jtweet-cyan text-jtweet-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-cyan border-2 border-jtweet-black">
              {badge > 9 ? '9+' : badge}
            </span>
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
      className={({ isActive }) => `p-2 rounded-full transition-all relative ${isActive ? 'text-jtweet-cyan' : 'text-white/40'}`}
    >
      {icon}
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-jtweet-cyan text-jtweet-black text-[8px] font-bold rounded-full flex items-center justify-center shadow-cyan">
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
