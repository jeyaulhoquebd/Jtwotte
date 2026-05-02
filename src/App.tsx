import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TweetProvider } from './context/TweetContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { SocialProvider } from './context/SocialContext';
import LoginPage from './pages/LoginPage';
import HomeFeed from './pages/HomeFeed';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NeuralNetworkPage from './pages/NeuralNetworkPage';
import DeleteCenter from './pages/DeleteCenter';
import ExplorePage from './pages/ExplorePage';
import { ShieldCheck, Zap } from 'lucide-react';

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
      <NotificationProvider>
        <SocialProvider>
          <MessageProvider>
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
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="explore" element={<ExplorePage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="profile/:uid" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="network" element={<NeuralNetworkPage />} />
                    <Route path="delete" element={<DeleteCenter />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </BrowserRouter>
            </TweetProvider>
          </MessageProvider>
        </SocialProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
