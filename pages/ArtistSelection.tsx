import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Artist } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR_ARTISTS = [
  "Taylor Swift", "The Weeknd", "Drake", "Bad Bunny", "BTS", 
  "Ariana Grande", "Kanye West", "Eminem", "Coldplay", "Imagine Dragons",
  "Justin Bieber", "Ed Sheeran", "Dua Lipa", "Post Malone", "Rihanna",
  "Billie Eilish", "Harry Styles", "Bruno Mars", "Adele", "Travis Scott"
];

export const ArtistSelection: React.FC = () => {
  const navigate = useNavigate();
  const { favoriteArtists, toggleArtistLike, syncUserToCloud } = usePlayerStore();
  
  const [displayArtists, setDisplayArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Initial Load
  useEffect(() => {
    const fetchPopular = async () => {
      setIsLoading(true);
      try {
        // We fetch a few "pages" of popular artists by name to populate the grid
        const promises = POPULAR_ARTISTS.slice(0, 12).map(name => api.searchArtists(name));
        const results = await Promise.all(promises);
        
        // Flatten and deduplicate
        const flatArtists = results.flat().filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setDisplayArtists(flatArtists);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPopular();
  }, []);

  // Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        try {
           const results = await api.searchArtists(searchQuery);
           setDisplayArtists(results);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
      } else if (displayArtists.length === 0 && !isLoading) {
         // Reload popular if cleared search and empty (optional, simplifed here)
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggle = (artist: Artist) => {
    toggleArtistLike(artist);
    setHasChanges(true);
  };

  const handleDone = async () => {
    // Save to cloud if logged in
    await syncUserToCloud('private');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-4 relative">
      
      {/* Header */}
      <div className="px-6 flex flex-col gap-4 sticky top-0 bg-black/95 backdrop-blur-sm z-30 pb-4">
          <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center hover:bg-[#333] transition-colors"
              >
                 <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-bold">Choose Artists</h1>
              <div className="w-10"></div> {/* Spacer */}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50" size={20} />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-black pl-12 pr-4 py-3 rounded-md font-medium placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
              />
          </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
          {isLoading && displayArtists.length === 0 ? (
              <div className="flex justify-center pt-20">
                  <Loader2 size={40} className="animate-spin text-[#1DB954]" />
              </div>
          ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-4 pt-4">
                  {displayArtists.map((artist) => {
                      const isSelected = favoriteArtists.some(a => a.id === artist.id);
                      
                      return (
                          <motion.div 
                              key={artist.id}
                              className="flex flex-col items-center gap-3 cursor-pointer group"
                              onClick={() => handleToggle(artist)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                          >
                              <div className="relative w-24 h-24 md:w-32 md:h-32">
                                  <motion.img 
                                      src={getImageUrl(artist.image)} 
                                      alt={artist.name} 
                                      className={`w-full h-full object-cover rounded-full shadow-lg transition-all duration-300 ${isSelected ? 'brightness-50' : 'brightness-100 group-hover:brightness-90'}`}
                                      animate={{ scale: isSelected ? 0.9 : 1 }}
                                      transition={{ duration: 0.2, ease: "easeOut" }}
                                  />
                                  <AnimatePresence>
                                    {isSelected && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0 }} 
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            transition={{ duration: 0.2, ease: "backOut" }}
                                            className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10"
                                        >
                                            <CheckCircle2 size={20} className="text-[#1DB954] fill-white bg-white rounded-full" />
                                        </motion.div>
                                    )}
                                  </AnimatePresence>
                                  {/* Ring Effect */}
                                  {isSelected && (
                                      <motion.div 
                                        layoutId={`ring-${artist.id}`}
                                        className="absolute inset-0 rounded-full border-[3px] border-[#1DB954]"
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1.05 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                      />
                                  )}
                              </div>
                              <span className={`text-center font-bold text-sm truncate w-full px-1 ${isSelected ? 'text-white' : 'text-[#B3B3B3]'}`}>
                                  {artist.name}
                              </span>
                          </motion.div>
                      );
                  })}
              </div>
          )}
      </div>

      {/* Floating Done Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-40 flex justify-center">
          <motion.button 
             onClick={handleDone}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="bg-white text-black font-bold text-base py-3 px-12 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
          >
              Done
          </motion.button>
      </div>
    </div>
  );
};