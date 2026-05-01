import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch or create user doc in Firestore
        const userRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const isOwner = fbUser.email === "jeyaulhoque2025@gmail.com" || fbUser.email === "jeyaulbooks@gmail.com";
          const newUser = {
            uid: fbUser.uid,
            name: isOwner ? "Jeyaul Hoque" : (fbUser.displayName || 'Anonymous'),
            email: fbUser.email,
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            bio: isOwner ? "Founder of JTweet Infinity | System Architect" : '',
            role: isOwner ? "founder" : "user",
            createdAt: serverTimestamp()
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        } else {
          const userData = userSnap.data();
          const isOwner = fbUser.email === "jeyaulhoque2025@gmail.com" || fbUser.email === "jeyaulbooks@gmail.com";
          
          // Auto-upgrade if email matches but role isn't founder
          if (isOwner && userData.role !== 'founder') {
            await setDoc(userRef, { ...userData, role: 'founder' }, { merge: true });
            setUser({ ...userData, role: 'founder' });
          } else {
            setUser(userData);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
