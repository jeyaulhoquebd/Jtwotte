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
  deleteDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'retweet' | 'follow' | 'mention' | 'broadcast';
  senderId: string;
  relatedId?: string; // tweetId or userId
  timestamp: any;
  read: boolean;
  content?: string;
  sender?: {
    name: string;
    avatar: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sendNotification: (targetUserId: string, data: Omit<Notification, 'id' | 'timestamp' | 'read' | 'sender'>) => Promise<void>;
  broadcastMessage: (content: string, type?: 'broadcast' | 'important' | 'critical') => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifs: Notification[] = [];
      let unread = 0;

      for (const d of snapshot.docs) {
        const data = d.data();
        if (!data.read) unread++;

        // Fetch sender data if not a broadcast or system message
        let senderInfo = { name: 'System', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system' };
        if (data.senderId && data.senderId !== 'system') {
           const senderSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', data.senderId)));
           if (!senderSnap.empty) {
             const sd = senderSnap.docs[0].data();
             senderInfo = { name: sd.name, avatar: sd.avatar };
           }
        }

        notifs.push({
          id: d.id,
          ...data,
          sender: senderInfo
        } as Notification);
      }

      setNotifications(notifs);
      setUnreadCount(unread);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const sendNotification = async (targetUserId: string, data: any) => {
    if (targetUserId === user?.uid && data.type !== 'broadcast') return;
    
    await addDoc(collection(db, 'users', targetUserId, 'notifications'), {
      ...data,
      timestamp: serverTimestamp(),
      read: false
    });
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), {
      read: true
    });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => 
      updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true })
    );
    await Promise.all(promises);
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
  };

  const broadcastMessage = async (content: string, type: any = 'broadcast') => {
    if (user?.role !== 'admin') return;

    // In a real app, this would be a Cloud Function. 
    // Here, we simulate by sending to current user for demo, 
    // but the logic would be to iterate users or use a global topic.
    // We'll use a special path for broadcasts that users listen to.
    
    // For now, let's just send to the admin themselves as a test
    await sendNotification(user.uid, {
      type: 'broadcast',
      senderId: user.uid,
      content: content,
      relatedId: 'global'
    });
    
    // In a production app, we'd trigger a server-side script.
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading,
      markAsRead, 
      markAllAsRead, 
      deleteNotification,
      sendNotification,
      broadcastMessage
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
