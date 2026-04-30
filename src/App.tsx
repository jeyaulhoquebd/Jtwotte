import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TweetProvider } from './context/TweetContext';
import LoginPage from './pages/LoginPage';
import HomeFeed from './pages/HomeFeed';
import Layout from './components/Layout';

// Placeholder Pages
const Explore = () => <div className="p-8"><h2 className="text-2xl font-bold font-display">Neural Streams (Explore)</h2><p className="text-white/40 mt-2">Discover global patterns.</p></div>;
const Notifications = () => <div className="p-8"><h2 className="text-2xl font-bold font-display">Signal Log (Notifications)</h2><p className="text-white/40 mt-2">Personal interactions tracked.</p></div>;
const Messages = () => <div className="p-8"><h2 className="text-2xl font-bold font-display">Encrypted Channels (Messages)</h2><p className="text-white/40 mt-2">1-to-1 secure data exchange.</p></div>;
const Profile = () => <div className="p-8"><h2 className="text-2xl font-bold font-display">Identity Hub (Profile)</h2><p className="text-white/40 mt-2">Your digital signature configuration.</p></div>;
const Settings = () => <div className="p-8"><h2 className="text-2xl font-bold font-display">System Params (Settings)</h2><p className="text-white/40 mt-2">Adjust core interaction variables.</p></div>;

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-jtweet-black flex flex-col items-center justify-center p-4">
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 bg-jtweet-cyan/20 blur-2xl rounded-full animate-pulse" />
        <div className="w-16 h-16 border-2 border-white/5 border-t-jtweet-cyan rounded-full animate-spin relative z-10" />
      </div>
      <p className="mt-6 font-display font-bold text-sm tracking-[0.2em] text-white/40 uppercase animate-pulse">
        Initializing Protocol
      </p>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <TweetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<HomeFeed />} />
              <Route path="explore" element={<Explore />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="messages" element={<Messages />} />
              <Route path="profile/:uid" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TweetProvider>
    </AuthProvider>
  );
}
