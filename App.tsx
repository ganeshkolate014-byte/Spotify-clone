import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
// import { FriendsActivity } from './components/FriendsActivity'; // MAINTENANCE
import { Player } from './components/Player';
import { BottomNav } from './components/BottomNav';
// import { ChatWindow } from './components/ChatWindow'; // MAINTENANCE
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { AlbumDetails } from './pages/AlbumDetails';
import { ArtistDetails } from './pages/ArtistDetails';
import { LoginPromo } from './pages/LoginPromo';
import { LikedSongs } from './pages/LikedSongs';
import { PlaylistDetails } from './pages/PlaylistDetails';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { Social } from './pages/Social';
import { AnimatePresence, motion } from 'framer-motion';

// Page Transition Wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

// Animated Routes Component
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="/library" element={<PageTransition><Library /></PageTransition>} />
        <Route path="/social" element={<PageTransition><Social /></PageTransition>} />
        <Route path="/album/:id" element={<PageTransition><AlbumDetails /></PageTransition>} />
        <Route path="/artist/:id" element={<PageTransition><ArtistDetails /></PageTransition>} />
        <Route path="/playlist/:id" element={<PageTransition><PlaylistDetails /></PageTransition>} />
        <Route path="/premium" element={<PageTransition><LoginPromo /></PageTransition>} />
        <Route path="/liked" element={<PageTransition><LikedSongs /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

// Layout wrapper to handle scroll behavior and structure
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Pages that don't need sidebar/player
  const isFullScreenPage = ['/premium', '/login', '/signup'].includes(location.pathname);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
    }
  }, [location.pathname]);

  return (
    <div className="flex h-[100dvh] w-screen bg-black text-white overflow-hidden">
      {!isFullScreenPage && <Sidebar />}
      
      <main 
        ref={mainRef}
        className={`flex-1 relative overflow-y-auto bg-black md:bg-surface md:rounded-lg md:my-2 md:mx-0 no-scrollbar overscroll-none ${isFullScreenPage ? 'z-50 !m-0 !rounded-none' : ''}`}
      >
         {/* Main Content */}
        {children}
        {/* Spacer for bottom nav/player on mobile */}
        {!isFullScreenPage && <div className="h-32 md:h-24 w-full"></div>}
      </main>

      {/* Right Sidebar (Desktop only) - DISABLED FOR MAINTENANCE */}
      {/* {!isFullScreenPage && <FriendsActivity />} */}

      {/* Global Chat Window Overlay (Desktop) - DISABLED FOR MAINTENANCE */}
      {/* {!isFullScreenPage && <div className="hidden md:block"><ChatWindow /></div>} */}

      {!isFullScreenPage && <Player />}
      {!isFullScreenPage && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </HashRouter>
  );
};

export default App;