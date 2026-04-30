import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Tweet {
  id: string;
  authorId: string;
  content: string;
  timestamp: any;
  type: 'tweet' | 'retweet';
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  author?: {
    name: string;
    avatar: string;
    handle: string;
  };
}

interface TweetContextType {
  tweets: Tweet[];
  loading: boolean;
  postTweet: (content: string) => Promise<void>;
  toggleLike: (tweetId: string) => Promise<void>;
  isLiked: (tweetId: string) => boolean;
}

const TweetContext = createContext<TweetContextType | undefined>(undefined);

export function TweetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Listen to ALL tweets
    const q = query(collection(db, 'tweets'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tweetList: Tweet[] = [];
      const authorCache: Record<string, any> = {};

      for (const d of snapshot.docs) {
        const data = d.data();
        const authorId = data.authorId;
        
        let authorData = authorCache[authorId];
        if (!authorData) {
          const userSnap = await getDoc(doc(db, 'users', authorId));
          authorData = userSnap.exists() ? userSnap.data() : { name: 'Unknown', avatar: '', handle: '@unknown' };
          authorCache[authorId] = authorData;
        }

        tweetList.push({
          id: d.id,
          ...data,
          author: {
            name: authorData.name,
            avatar: authorData.avatar,
            handle: `@${authorData.name.toLowerCase().replace(/\s/g, '_')}`
          }
        } as Tweet);
      }
      setTweets(tweetList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to user likes if logged in
  useEffect(() => {
    if (!user) {
      setUserLikes(new Set());
      return;
    }

    // This is a bit tricky for global likes. 
    // Usually we store likes in /tweets/{id}/likes/{uid}
    // But to know ALL likes of a user efficiently, we'd need a subcollection on user or a different structure.
    // For now, I'll just check existence on demand or maintain a small state.
  }, [user]);

  const postTweet = async (content: string) => {
    if (!user) return;
    await addDoc(collection(db, 'tweets'), {
      authorId: user.uid,
      content,
      timestamp: serverTimestamp(),
      type: 'tweet',
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0
    });
  };

  const toggleLike = async (tweetId: string) => {
    if (!user) return;
    const likeRef = doc(db, 'tweets', tweetId, 'likes', user.uid);
    const likeSnap = await getDoc(likeRef);
    const tweetRef = doc(db, 'tweets', tweetId);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(tweetRef, { likesCount: increment(-1) });
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
      await updateDoc(tweetRef, { likesCount: increment(1) });
    }
  };

  const isLiked = (tweetId: string) => {
    // In a real app, this would be optimized.
    return false; // Placeholder
  };

  return (
    <TweetContext.Provider value={{ tweets, loading, postTweet, toggleLike, isLiked }}>
      {children}
    </TweetContext.Provider>
  );
}

export function useTweets() {
  const context = useContext(TweetContext);
  if (context === undefined) {
    throw new Error('useTweets must be used within a TweetProvider');
  }
  return context;
}
