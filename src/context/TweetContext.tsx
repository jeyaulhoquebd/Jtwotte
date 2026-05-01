import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where,
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
import { parseMediaLinks } from '../lib/mediaParser';

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

export type ReactionType = 'like' | 'love' | 'insightful' | 'fire' | 'rocket';

export interface Tweet {
  id: string;
  authorId: string;
  content: string;
  timestamp: any;
  type: 'tweet' | 'retweet' | 'reply';
  likesCount: number;
  reactions?: Record<ReactionType, number>;
  retweetsCount: number;
  repliesCount: number;
  impressions?: number;
  originalTweetId?: string;
  originalTweet?: Tweet | null;
  media?: {
    youtubeId?: string;
    facebookVideoId?: string;
    tiktokId?: string;
    instagramId?: string;
    images?: string[];
    originalUrl?: string;
  };
  author?: {
    name: string;
    avatar: string;
    handle: string;
    role?: string;
  };
}

interface TweetContextType {
  tweets: Tweet[];
  loading: boolean;
  theme: 'cyber' | 'dark' | 'plasma';
  toggleTheme: () => void;
  setTheme: (theme: 'cyber' | 'dark' | 'plasma') => void;
  postTweet: (content: string, media?: { url: string, type: string }) => Promise<void>;
  retweet: (originalTweetId: string, content?: string) => Promise<void>;
  toggleLike: (tweetId: string) => Promise<void>;
  toggleReaction: (tweetId: string, type: ReactionType) => Promise<void>;
  deleteTweet: (tweetId: string) => Promise<void>;
  deleteAllTweets: () => Promise<void>;
  addComment: (tweetId: string, content: string) => Promise<void>;
  getComments: (tweetId: string) => Promise<Comment[]>;
  isLiked: (tweetId: string) => boolean;
  getUserReaction: (tweetId: string) => ReactionType | null;
  lastAction: { type: string, data: any } | null;
  undoAction: () => Promise<void>;
  customFilters: string[];
  addCustomFilter: (filter: string) => void;
  removeCustomFilter: (filter: string) => void;
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

const TweetContext = createContext<TweetContextType | undefined>(undefined);

export function TweetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [likedTweets, setLikedTweets] = useState<Set<string>>(new Set());
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>( {});
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'cyber' | 'dark' | 'plasma'>(() => {
    const saved = localStorage.getItem('jtweet-theme');
    return (saved as 'cyber' | 'dark' | 'plasma') || 'cyber';
  });
  const [lastAction, setLastAction] = useState<{ type: string, data: any } | null>(null);
  const [customFilters, setCustomFilters] = useState<string[]>(() => {
    const saved = localStorage.getItem('jtweet-filters');
    return saved ? JSON.parse(saved) : [];
  });

  const addCustomFilter = (filter: string) => {
    if (customFilters.includes(filter)) return;
    const next = [...customFilters, filter];
    setCustomFilters(next);
    localStorage.setItem('jtweet-filters', JSON.stringify(next));
  };

  const removeCustomFilter = (filter: string) => {
    const next = customFilters.filter(f => f !== filter);
    setCustomFilters(next);
    localStorage.setItem('jtweet-filters', JSON.stringify(next));
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'cyber' ? 'dark' : (prev === 'dark' ? 'plasma' : 'cyber');
      localStorage.setItem('jtweet-theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'plasma');
    if (theme !== 'cyber') {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setLikedTweets(new Set());
      setUserReactions({});
      return;
    }

    // Fetch user reactions
    const q = query(collection(db, 'user_reactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reactions: Record<string, ReactionType> = {};
      const likes = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        reactions[data.tweetId] = data.type;
        if (data.type === 'like') likes.add(data.tweetId);
      });
      setUserReactions(reactions);
      setLikedTweets(likes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'user_reactions');
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
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

    const q = query(collection(db, 'tweets'), orderBy('timestamp', 'desc'));
    const globalAuthorCache: Record<string, any> = {};
    let latestSnapshotId = 0;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const snapshotId = ++latestSnapshotId;
      
      const processSnapshot = async () => {
        try {
          const docs = snapshot.docs;
          const promises = docs.map(async (d) => {
            const data = d.data();
            const authorId = data.authorId;
            
            let authorData = globalAuthorCache[authorId];
            if (!authorData) {
              try {
                const userSnap = await getDoc(doc(db, 'users', authorId));
                authorData = userSnap.exists() ? userSnap.data() : { name: 'Unknown', avatar: '', handle: '@unknown' };
                const baseHandle = authorData.name.toLowerCase().replace(/\s/g, '');
                authorData.handle = `@${baseHandle}`;
                globalAuthorCache[authorId] = authorData;
              } catch (e) {
                authorData = { name: 'Unknown', avatar: '', handle: '@unknown' };
              }
            }

            let originalTweet = null;
            if (data.type === 'retweet' && data.originalTweetId) {
              try {
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
              } catch (e) {}
            }

            return {
              id: d.id,
              ...data,
              author: authorData,
              originalTweet
            } as Tweet;
          });

          const results = await Promise.all(promises);
          
          if (snapshotId === latestSnapshotId) {
            setTweets(results);
            setLoading(false);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'tweets');
        }
      };

      processSnapshot();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tweets');
    });

    return unsubscribe;
  }, []);

  const postTweet = async (content: string, pMedia?: { url: string, type: string }) => {
    if (!user) return;

    const parsed = parseMediaLinks(content);
    let media: any = pMedia ? { images: [pMedia.url], type: pMedia.type } : {};
    
    if (parsed.youtubeId) {
      media.youtubeId = parsed.youtubeId;
      media.originalUrl = `https://www.youtube.com/watch?v=${parsed.youtubeId}`;
    }
    if (parsed.facebookVideoId) {
      media.facebookVideoId = parsed.facebookVideoId;
      media.originalUrl = `https://www.facebook.com/watch/?v=${parsed.facebookVideoId}`;
    }
    if (parsed.tiktokId) {
      media.tiktokId = parsed.tiktokId;
      media.originalUrl = `https://www.tiktok.com/video/${parsed.tiktokId}`;
    }
    if (parsed.instagramId) {
      media.instagramId = parsed.instagramId;
      media.originalUrl = `https://www.instagram.com/reels/${parsed.instagramId}/`;
    }
    if (parsed.imageUrls) {
      media.images = [...(media.images || []), ...parsed.imageUrls];
    }

    try {
      await addDoc(collection(db, 'tweets'), {
        authorId: user.uid,
        content: parsed.cleanContent,
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
      const tweetDoc = await getDoc(doc(db, 'tweets', tweetId));
      if (!tweetDoc.exists()) {
        console.warn(`Tweet ${tweetId} not found for deletion.`);
        return;
      }
      
      const tweetData = tweetDoc.data();
      const isAdminEmail = user?.email === 'jeyaulhoque2025@gmail.com' || user?.email === 'jeyaulbooks@gmail.com';
      const isAdmin = user.role === 'admin' || user.role === 'founder' || isAdminEmail;
      const isOwner = tweetData.authorId === user.uid;

      if (!isAdmin && !isOwner) {
        alert("Authorization failure: Node ownership required for signal redaction.");
        return;
      }

      // Optimistic update
      setTweets(prev => prev.filter(t => t.id !== tweetId));

      await deleteDoc(doc(db, 'tweets', tweetId));
      
      // Cleanup associated data
      // 1. Reactions
      const reactionsQuery = query(collection(db, 'user_reactions'), where('tweetId', '==', tweetId));
      getDocs(reactionsQuery).then(snap => {
        snap.forEach(d => deleteDoc(doc(db, 'user_reactions', d.id)).catch(() => {}));
      });

      // 2. Comments (In Firestore, subcollections must be deleted manually)
      const commentsQuery = query(collection(db, 'tweets', tweetId, 'comments'));
      getDocs(commentsQuery).then(snap => {
        snap.forEach(d => deleteDoc(doc(db, 'tweets', tweetId, 'comments', d.id)).catch(() => {}));
      });

      // 3. Notifications
      const notificationsQuery = query(collection(db, 'notifications'), where('relatedId', '==', tweetId));
      getDocs(notificationsQuery).then(snap => {
        snap.forEach(d => deleteDoc(doc(db, 'notifications', d.id)).catch(() => {}));
      });

      // 4. Bookmarks (if implemented)
      const bookmarksQuery = query(collection(db, 'bookmarks'), where('tweetId', '==', tweetId));
      getDocs(bookmarksQuery).then(snap => {
        snap.forEach(d => deleteDoc(doc(db, 'bookmarks', d.id)).catch(() => {}));
      });

    } catch (error) {
      console.error('Delete failed:', error);
      handleFirestoreError(error, OperationType.DELETE, `tweets/${tweetId}`);
    }
  };

  const deleteAllTweets = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
      alert("Unauthorized: Only higher administrative nodes can initiate a purge.");
      return;
    }
    
      if (!window.confirm("CRITICAL ACTION: This will permanently erase ALL signals from the network. This cannot be undone. Proceed?")) {
        return;
      }

    try {
      const snapshot = await getDocs(collection(db, 'tweets'));
      const batchSize = 100;
      let count = 0;
      
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'tweets', d.id));
        count++;
      }
      
      alert(`Purge complete. ${count} signals erased from history.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'tweets');
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

  const toggleReaction = async (tweetId: string, type: ReactionType) => {
    if (!user) return;
    const reactionRef = doc(db, 'user_reactions', `${user.uid}_${tweetId}`);
    const tweetRef = doc(db, 'tweets', tweetId);
    
    try {
      const reactionSnap = await getDoc(reactionRef);
      const existingReaction = reactionSnap.exists() ? reactionSnap.data().type as ReactionType : null;

      setLastAction({ 
        type: 'reaction', 
        data: { tweetId, type, previousType: existingReaction } 
      });

      if (existingReaction === type) {
        // Remove reaction
        await deleteDoc(reactionRef);
        await updateDoc(tweetRef, {
          [`reactions.${type}`]: increment(-1),
          likesCount: type === 'like' ? increment(-1) : increment(0)
        });
      } else if (existingReaction) {
        // Change reaction
        await updateDoc(reactionRef, { type, updatedAt: serverTimestamp() });
        await updateDoc(tweetRef, {
          [`reactions.${existingReaction}`]: increment(-1),
          [`reactions.${type}`]: increment(1),
          likesCount: type === 'like' ? increment(1) : (existingReaction === 'like' ? increment(-1) : increment(0))
        });
      } else {
        // New reaction
        await setDoc(reactionRef, { 
          userId: user.uid, 
          tweetId, 
          type, 
          createdAt: serverTimestamp() 
        });
        await updateDoc(tweetRef, {
          [`reactions.${type}`]: increment(1),
          likesCount: type === 'like' ? increment(1) : increment(0)
        });

        // Notify tweet author
        const tweetSnap = await getDoc(tweetRef);
        if (tweetSnap.exists()) {
          const tweetData = tweetSnap.data();
          if (tweetData.authorId !== user.uid) {
             await sendNotification(tweetData.authorId, {
               type: 'reaction',
               senderId: user.uid,
               relatedId: tweetId,
               content: `reacted with ${type} to your signal`
             });
          }
        }
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `user_reactions/${user.uid}_${tweetId}`);
    }
  };

  const getUserReaction = (tweetId: string) => {
    return userReactions[tweetId] || null;
  };

  const isLiked = (tweetId: string) => {
    return userReactions[tweetId] === 'like';
  };

  const undoAction = async () => {
    if (!lastAction) return;

    const { type, data } = lastAction;
    setLastAction(null);

    try {
      if (type === 'reaction') {
        const { tweetId, previousType } = data;
        if (previousType) {
          await toggleReaction(tweetId, previousType);
        } else {
          // If it was a new reaction, toggling the same type again will remove it
          await toggleReaction(tweetId, data.type);
        }
      } else if (type === 'post') {
        // We'd need to track the ID of the posted tweet
        if (data.id) await deleteTweet(data.id);
      }
    } catch (e) {
      console.error("Undo failed", e);
    }
  };

  return (
    <TweetContext.Provider value={{ 
      tweets, 
      loading, 
      theme,
      toggleTheme,
      setTheme,
      postTweet, 
      retweet, 
      toggleLike: (id) => toggleReaction(id, 'like'),
      toggleReaction,
      deleteTweet, 
      deleteAllTweets,
      addComment, 
      getComments, 
      isLiked,
      getUserReaction,
      lastAction,
      undoAction,
      customFilters,
      addCustomFilter,
      removeCustomFilter
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
