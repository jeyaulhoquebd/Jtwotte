import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  limit,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
  lastMessageSenderId: string;
  recipient?: {
    uid: string;
    name: string;
    avatar: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  timestamp: Timestamp;
  readBy: string[];
}

interface MessageContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  setActiveConversation: (conv: Conversation | null) => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'video') => Promise<void>;
  startConversation: (recipientId: string) => Promise<string>;
  markAsRead: (convId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen to conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos: Conversation[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const recipientId = data.participants.find((p: string) => p !== user.uid);
        
        let recipientData = { uid: recipientId, name: 'Unknown User', avatar: '' };
        if (recipientId) {
          const userSnap = await getDoc(doc(db, 'users', recipientId));
          if (userSnap.exists()) {
            const ud = userSnap.data();
            recipientData = { uid: ud.uid, name: ud.name, avatar: ud.avatar };
          }
        }

        convos.push({
          id: d.id,
          ...data,
          recipient: recipientData
        } as Conversation);
      }
      setConversations(convos);
    });

    return unsubscribe;
  }, [user]);

  // Listen to messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const unreadMessages = messages.filter(m => m.senderId !== user?.uid && !m.readBy?.includes(user?.uid || ''));
    if (unreadMessages.length > 0) {
      markAsRead(activeConversation.id);
    }

    const q = query(
      collection(db, 'conversations', activeConversation.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Message[];
      setMessages(msgs);
    });

    return unsubscribe;
  }, [activeConversation, user?.uid]);

  const startConversation = async (recipientId: string) => {
    if (!user) throw new Error('Auth required');
    
    // Check if combo already exists
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
    const snap = await getDocs(q);
    const existing = snap.docs.find(d => d.data().participants.includes(recipientId));
    
    if (existing) return existing.id;

    const newConv = await addDoc(collection(db, 'conversations'), {
      participants: [user.uid, recipientId].sort(),
      lastMessage: '',
      updatedAt: serverTimestamp(),
      lastMessageSenderId: ''
    });

    return newConv.id;
  };

  const sendMessage = async (content: string, type: any = 'text') => {
    if (!user || !activeConversation) return;

    const msgData = {
      senderId: user.uid,
      content,
      type,
      timestamp: serverTimestamp(),
      readBy: [user.uid]
    };

    await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), msgData);
    
    await updateDoc(doc(db, 'conversations', activeConversation.id), {
      lastMessage: content,
      updatedAt: serverTimestamp(),
      lastMessageSenderId: user.uid
    });
  };

  const markAsRead = async (convId: string) => {
    if (!user) return;
    const msgsRef = collection(db, 'conversations', convId, 'messages');
    const unreadQuery = query(msgsRef, where('readBy', 'not-in', [[user.uid]]));
    // Firebase 'not-in' with arrays is tricky, usually we'd structure read flags better.
    // For this prototype, we'll mark the latest few unread.
    const snap = await getDocs(unreadQuery);
    const promises = snap.docs.map(d => {
       const data = d.data();
       if (!data.readBy.includes(user.uid)) {
         return updateDoc(d.ref, { readBy: [...data.readBy, user.uid] });
       }
       return null;
    }).filter(p => p !== null);
    await Promise.all(promises);
  };

  return (
    <MessageContext.Provider value={{ 
      conversations, 
      activeConversation, 
      messages, 
      loading,
      setActiveConversation,
      sendMessage,
      startConversation,
      markAsRead
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}
