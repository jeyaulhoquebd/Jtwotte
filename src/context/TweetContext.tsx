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
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Tweet {
  id: string;
  authorId: string;
  content: string;
  timestamp: any;
  type: 'tweet' | 'retweet' | 'reply';
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  impressions?: number;
  originalTweetId?: string;
  originalTweet?: Tweet | null;
  media?: {
    youtubeId?: string;
    images?: string[];
  };
  author?: {
    name: string;
    avatar: string;
    handle: string;
    role?: string;
  };
}

interface Comment {
  id: string;
  tweetId: string;
  authorId: string;
  content: string;
  timestamp: any;
  author?: {
    name: string;
    avatar: string;
  };
}

interface TweetContextType {
  tweets: Tweet[];
  loading: boolean;
  postTweet: (content: string) => Promise<void>;
  retweet: (originalTweetId: string, content?: string) => Promise<void>;
  toggleLike: (tweetId: string) => Promise<void>;
  deleteTweet: (tweetId: string) => Promise<void>;
  addComment: (tweetId: string, content: string) => Promise<void>;
  getComments: (tweetId: string) => Promise<Comment[]>;
  isLiked: (tweetId: string) => boolean;
}

const TweetContext = createContext<TweetContextType | undefined>(undefined);

export function TweetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

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
          const baseHandle = authorData.name.toLowerCase().replace(/\s/g, '');
          authorData.handle = `@${baseHandle}`;
          authorCache[authorId] = authorData;
        }

        let originalTweet = null;
        if (data.type === 'retweet' && data.originalTweetId) {
          const origSnap = await getDoc(doc(db, 'tweets', data.originalTweetId));
          if (origSnap.exists()) {
             const origData = origSnap.data();
             const origAuthorSnap = await getDoc(doc(db, 'users', origData.authorId));
             const origAuthorData = origAuthorSnap.exists() ? origAuthorSnap.data() : { name: 'Unknown', avatar: '' };
             const origBaseHandle = origAuthorData.name.toLowerCase().replace(/\s/g, '');
             originalTweet = {
               id: origSnap.id,
               ...origData,
               author: {
                 name: origAuthorData.name,
                 avatar: origAuthorData.avatar,
                 handle: `@${origBaseHandle}`
               }
             };
          }
        }

        tweetList.push({
          id: d.id,
          ...data,
          author: authorData,
          originalTweet
        } as Tweet);
      }
      setTweets(tweetList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const postTweet = async (content: string) => {
    if (!user) return;

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const imageRegex = /(https?:\/\/[\w\-\.]+(?:\/|[\w\-\.\/]+)\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[\w\-\.\&\=]+)?)/gi;

    let media: any = {};
    let cleanContent = content;

    const ytMatch = cleanContent.match(youtubeRegex);
    if (ytMatch) {
      media.youtubeId = ytMatch[1];
      cleanContent = cleanContent.replace(youtubeRegex, '').trim();
    }

    const imgMatches = cleanContent.match(imageRegex);
    if (imgMatches) {
      media.images = imgMatches;
      imgMatches.forEach(url => {
        cleanContent = cleanContent.replace(url, '').trim();
      });
    }

    await addDoc(collection(db, 'tweets'), {
      authorId: user.uid,
      content: cleanContent,
      timestamp: serverTimestamp(),
      type: 'tweet',
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      impressions: 0,
      media: Object.keys(media).length > 0 ? media : null
    });
  };

  const deleteTweet = async (tweetId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'tweets', tweetId));
  };

  const addComment = async (tweetId: string, content: string) => {
    if (!user) return;
    await addDoc(collection(db, 'tweets', tweetId, 'comments'), {
      authorId: user.uid,
      content,
      timestamp: serverTimestamp(),
      tweetId
    });
    await updateDoc(doc(db, 'tweets', tweetId), {
      repliesCount: increment(1)
    });
  };

  const getComments = async (tweetId: string): Promise<Comment[]> => {
    const q = query(collection(db, 'tweets', tweetId, 'comments'), orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    const commentList: Comment[] = [];
    const authorCache: Record<string, any> = {};

    for (const d of snapshot.docs) {
      const data = d.data();
      const authorId = data.authorId;
      
      let authorData = authorCache[authorId];
      if (!authorData) {
        const userSnap = await getDoc(doc(db, 'users', authorId));
        authorData = userSnap.exists() ? userSnap.data() : { name: 'Unknown', avatar: '' };
        authorCache[authorId] = authorData;
      }

      commentList.push({
        id: d.id,
        tweetId,
        authorId,
        content: data.content,
        timestamp: data.timestamp,
        author: {
          name: authorData.name,
          avatar: authorData.avatar
        }
      });
    }
    return commentList;
  };

  const retweet = async (originalTweetId: string, content?: string) => {
    if (!user) return;
    
    // 1. Create the retweet document
    await addDoc(collection(db, 'tweets'), {
      authorId: user.uid,
      content: content || '',
      timestamp: serverTimestamp(),
      type: 'retweet',
      originalTweetId,
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0
    });

    // 2. Increment the retweet count on the original
    const tweetRef = doc(db, 'tweets', originalTweetId);
    await updateDoc(tweetRef, {
      retweetsCount: increment(1)
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
    return false;
  };

  return (
    <TweetContext.Provider value={{ 
      tweets, 
      loading, 
      postTweet, 
      retweet, 
      toggleLike, 
      deleteTweet, 
      addComment, 
      getComments, 
      isLiked 
    }}>
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
