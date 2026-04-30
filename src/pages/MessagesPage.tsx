import React, { useState, useEffect, useRef } from 'react';
import { useMessages, Conversation, Message } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Send, 
  Plus, 
  MoreVertical, 
  Image as ImageIcon, 
  Video, 
  Smile,
  Hash,
  ChevronLeft,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSkeleton } from '../components/Skeleton';

export default function MessagesPage() {
  const { conversations, activeConversation, setActiveConversation, messages, sendMessage, loading } = useMessages();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-jtweet-black">
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <header className="p-4 border-b border-white/5 space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Encrypted Channels</h2>
              <button className="p-2 hover:bg-white/5 rounded-full text-jtweet-cyan">
                 <Plus size={20} />
              </button>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input 
                type="text" 
                placeholder="Search nodes..." 
                className="w-full bg-white/5 border-none rounded-full py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-jtweet-cyan/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           {loading && conversations.length === 0 ? (
             <div className="space-y-0">
               <MessageSkeleton />
               <MessageSkeleton />
               <MessageSkeleton />
               <MessageSkeleton />
             </div>
           ) : (
             conversations.map((conv) => (
               <button 
                 key={conv.id}
                 onClick={() => setActiveConversation(conv)}
                 className={`w-full p-4 flex gap-4 hover:bg-white/5 transition-all text-left ${activeConversation?.id === conv.id ? 'bg-white/5' : ''}`}
               >
                  <div className="relative">
                     <img src={conv.recipient?.avatar} className="w-12 h-12 rounded-full border border-white/10" />
                     <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-jtweet-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm truncate">{conv.recipient?.name}</h4>
                        <span className="text-[10px] text-white/20">{formatDistanceToNow(conv.updatedAt?.toDate() || new Date(), { addSuffix: false })}</span>
                     </div>
                     <p className="text-xs text-white/40 truncate mt-1">
                        {conv.lastMessageSenderId === user?.uid ? 'You: ' : ''}{conv.lastMessage || 'No signals yet'}
                     </p>
                  </div>
               </button>
             ))
           )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            <header className="p-4 border-b border-white/5 glass flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 text-white/40">
                     <ChevronLeft />
                  </button>
                  <img src={activeConversation.recipient?.avatar} className="w-10 h-10 rounded-full" />
                  <div>
                     <h3 className="font-bold text-sm leading-none">{activeConversation.recipient?.name}</h3>
                     <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Active Protocol</span>
                     </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-full text-white/40"><Search size={18} /></button>
                  <button className="p-2 hover:bg-white/5 rounded-full text-white/40"><MoreVertical size={18} /></button>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {messages.map((msg, idx) => {
                 const isMe = msg.senderId === user?.uid;
                 const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;

                 return (
                   <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 ${!showAvatar && 'opacity-0'}`}>
                         <img src={isMe ? user?.avatar : activeConversation.recipient?.avatar} className="w-8 h-8 rounded-full" />
                      </div>
                      <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                         <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-jtweet-cyan text-jtweet-black font-medium' : 'glass border border-white/5 text-white'}`}>
                            {msg.content}
                         </div>
                         {idx === messages.length - 1 && isMe && (
                           <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-white/20 uppercase font-bold">Synchronized</span>
                              <Circle size={4} className="fill-jtweet-cyan text-jtweet-cyan" />
                           </div>
                         )}
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t border-white/5 glass">
               <form onSubmit={handleSend} className="flex items-center gap-3">
                  <div className="flex gap-1">
                     <button type="button" className="p-2 text-white/40 hover:text-jtweet-cyan transition-colors"><ImageIcon size={20} /></button>
                     <button type="button" className="p-2 text-white/40 hover:text-jtweet-cyan transition-colors"><Video size={20} /></button>
                  </div>
                  <div className="flex-1 relative">
                     <input 
                       type="text" 
                       placeholder="Synthesize message..." 
                       className="w-full bg-white/5 border-none rounded-full py-3 px-10 focus:ring-1 focus:ring-jtweet-cyan/50 text-sm"
                       value={inputText}
                       onChange={(e) => setInputText(e.target.value)}
                     />
                     <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-jtweet-cyan">
                        <Smile size={18} />
                     </button>
                  </div>
                  <button type="submit" className="p-3 bg-jtweet-cyan text-jtweet-black rounded-full hover:shadow-cyan transition-all">
                     <Send size={20} />
                  </button>
               </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center text-white/20">
             <div className="w-24 h-24 glass rounded-full flex items-center justify-center border-white/5">
                <Hash size={48} />
             </div>
             <div>
                <h3 className="text-xl font-display font-bold text-white/40">Zero Interference</h3>
                <p className="text-xs font-bold uppercase tracking-widest mt-2">Select a channel to begin secure transmission.</p>
             </div>
             <button className="px-6 py-2 bg-jtweet-cyan/10 border border-jtweet-cyan/30 text-jtweet-cyan rounded-full text-xs font-bold hover:bg-jtweet-cyan/20 transition-all">
                New Signal Node
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
