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
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  postTweet: (content: string, media?: { url: string, type: string }) => Promise<void>;
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
  const { sendNotification } = useNotifications();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [likedTweets, setLikedTweets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLikedTweets(new Set());
      return;
    }
    
    // This is a bit expensive for a prototype but necessary for real-time like status
    // In production, we might only check for visible tweets
    const q = query(collection(db, 'tweets')); // We'd need a better way to find all liked by me
    // Better: listen to a theoretical /users/{uid}/likes collection
    // For now, let's just listen to context pulses or manage it locally
  }, [user]);

  useEffect(() => {
    // CRITICAL CONSTRAINT: Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Listen to ALL tweets
    const q = query(collection(db, 'tweets'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
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
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'tweets');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tweets');
    });

    return unsubscribe;
  }, []);

  const postTweet = async (content: string, pMedia?: { url: string, type: string }) => {
    if (!user) return;

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const imageRegex = /(https?:\/\/[\w\-\.]+(?:\/|[\w\-\.\/]+)\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[\w\-\.\&\=]+)?)/gi;

    let media: any = pMedia ? { images: [pMedia.url], type: pMedia.type } : {};
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

    try {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tweets');
    }
  };

  const deleteTweet = async (tweetId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'tweets', tweetId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tweets/${tweetId}`);
    }
  };

  const addComment = async (tweetId: string, content: string) => {
    if (!user) return;
    const path = `tweets/${tweetId}/comments`;
    try {
      await addDoc(collection(db, 'tweets', tweetId, 'comments'), {
        authorId: user.uid,
        content,
        timestamp: serverTimestamp(),
        tweetId
      });
      await updateDoc(doc(db, 'tweets', tweetId), {
        repliesCount: increment(1)
      });

      // Notify tweet author
      const tweetSnap = await getDoc(doc(db, 'tweets', tweetId));
      if (tweetSnap.exists()) {
        const tweetData = tweetSnap.data();
        if (tweetData.authorId !== user.uid) {
           await sendNotification(tweetData.authorId, {
             type: 'comment',
             senderId: user.uid,
             relatedId: tweetId,
             content: 'replied to your signal'
           });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const getComments = async (tweetId: string): Promise<Comment[]> => {
    const path = `tweets/${tweetId}/comments`;
    const q = query(collection(db, 'tweets', tweetId, 'comments'), orderBy('timestamp', 'asc'));
    try {
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
    } catch (error) {
       handleFirestoreError(error, OperationType.GET, path);
       return [];
    }
  };

  const retweet = async (originalTweetId: string, content?: string) => {
    if (!user) return;
    
    try {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tweets');
    }
  };

  const toggleLike = async (tweetId: string) => {
    if (!user) return;
    const likeRef = doc(db, 'tweets', tweetId, 'likes', user.uid);
    const tweetRef = doc(db, 'tweets', tweetId);
    
    try {
      const likeSnap = await getDoc(likeRef);
      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(tweetRef, { likesCount: increment(-1) });
        setLikedTweets(prev => {
          const next = new Set(prev);
          next.delete(tweetId);
          return next;
        });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(tweetRef, { likesCount: increment(1) });
        setLikedTweets(prev => new Set(prev).add(tweetId));

        // Notify tweet author
        const tweetSnap = await getDoc(tweetRef);
        if (tweetSnap.exists()) {
          const tweetData = tweetSnap.data();
          if (tweetData.authorId !== user.uid) {
             await sendNotification(tweetData.authorId, {
               type: 'like',
               senderId: user.uid,
               relatedId: tweetId,
               content: 'energized your signal'
             });
          }
        }
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `tweets/${tweetId}/likes/${user.uid}`);
    }
  };

  const isLiked = (tweetId: string) => {
    return likedTweets.has(tweetId);
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
