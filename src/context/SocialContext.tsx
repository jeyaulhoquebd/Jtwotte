import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface SocialContextType {
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => Promise<boolean>;
  getFollowersCount: (userId: string) => Promise<number>;
  getFollowingCount: (userId: string) => Promise<number>;
  updateProfile: (data: any) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();

  const followUser = async (targetUserId: string) => {
    if (!user) return;
    
    // Check if already following
    const q = query(
      collection(db, 'followers'),
      where('followerId', '==', user.uid),
      where('followedId', '==', targetUserId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return;

    await addDoc(collection(db, 'followers'), {
      followerId: user.uid,
      followedId: targetUserId,
      createdAt: serverTimestamp()
    });

    // Send notification
    await sendNotification(targetUserId, {
      type: 'follow',
      senderId: user.uid,
      relatedId: user.uid,
      content: 'started following you'
    });
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;
    const q = query(
      collection(db, 'followers'),
      where('followerId', '==', user.uid),
      where('followedId', '==', targetUserId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await deleteDoc(doc(db, 'followers', snap.docs[0].id));
    }
  };

  const isFollowing = async (targetUserId: string) => {
    if (!user) return false;
    const q = query(
      collection(db, 'followers'),
      where('followerId', '==', user.uid),
      where('followedId', '==', targetUserId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const getFollowersCount = async (userId: string) => {
    const q = query(collection(db, 'followers'), where('followedId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  };

  const getFollowingCount = async (userId: string) => {
    const q = query(collection(db, 'followers'), where('followerId', '==', userId));
    const snap = await getDocs(q);
    return snap.size;
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), data);
  };

  return (
    <SocialContext.Provider value={{ 
      followUser, 
      unfollowUser, 
      isFollowing, 
      getFollowersCount, 
      getFollowingCount,
      updateProfile
    }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}
