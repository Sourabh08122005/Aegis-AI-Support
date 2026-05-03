import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { auth, signIn, signOut } from './lib/firebase';
import { Button } from './components/ui/button';
import { Shield, MessageSquare, BarChart3, LogOut, User as UserIcon } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="w-12 h-12 text-indigo-600" />
          <p className="text-slate-500 font-medium">Initializing Aegis AI...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Aegis AI
                </span>
              </Link>

              <div className="flex items-center gap-6">
                {user ? (
                  <>
                    <Link to="/chat" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Support
                    </Link>
                    <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <UserIcon className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-500 hover:text-red-600">
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button onClick={signIn} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/chat" element={user ? <ChatInterface user={user} /> : <LandingPage />} />
              <Route path="/admin" element={user ? <AdminDashboard user={user} /> : <LandingPage />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Toaster position="bottom-right" richColors />
      </div>
    </Router>
  );
}
