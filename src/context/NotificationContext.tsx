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
  getDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'retweet' | 'follow' | 'mention' | 'broadcast' | 'reaction';
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
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const notifsPromises = snapshot.docs.map(async (d) => {
          const data = d.data();
          
          let senderInfo = { name: 'System', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system' };
          if (data.senderId && data.senderId !== 'system') {
            try {
              const senderSnap = await getDoc(doc(db, 'users', data.senderId));
              if (senderSnap.exists()) {
                const sd = senderSnap.data();
                senderInfo = { name: sd.name, avatar: sd.avatar };
              }
            } catch (err) {
              console.warn("Could not fetch sender info for", data.senderId, err);
            }
          }

          return {
            id: d.id,
            ...data,
            sender: senderInfo
          } as Notification;
        });

        const notifs = await Promise.all(notifsPromises);
        let unread = notifs.filter(n => !n.read).length;

        setNotifications(notifs);
        setUnreadCount(unread);
        setLoading(false);
      } catch (error) {
        console.error("Notifications processing error:", error);
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const sendNotification = async (targetUserId: string, data: any) => {
    if (targetUserId === user?.uid && data.type !== 'broadcast') return;
    
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        userId: targetUserId,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(n => 
      updateDoc(doc(db, 'notifications', n.id), { read: true })
        .catch(error => handleFirestoreError(error, OperationType.UPDATE, `notifications/${n.id}`))
    );
    await Promise.all(promises);
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
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
