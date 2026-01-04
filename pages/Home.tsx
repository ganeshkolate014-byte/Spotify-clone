import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../services/api';
import { Song, Album } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Bell, History, Settings, Play, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SongCard } from '../components/SongCard';

export const Home: React.FC = () => {
  const [daylist, setDaylist] = useState<Song[]>([]);
  const [recent, setRecent] = useState<(Song | Album)[]>([]); 
  const { history, playSong, currentUser } = usePlayerStore();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    let query = 'Top Hits 2024';
    if (hour >= 5 && hour < 12) query = 'Morning Acoustic';
    else if (hour >= 12 && hour < 17) query = 'Upbeat Pop';
    else query = 'Late Night Vibes';

    const fetchData = async () => {
      const songs = await api.searchSongs(query);
      setDaylist(songs);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Populate recent with history or default items
    if (history.length > 0) {
      setRecent(history.slice(0, 6));
    } else {
       // Defaults to populate the grid if empty history
       Promise.all([
         api.searchSongs("The Weeknd"),
         api.searchAlbums("Starboy"),
         api.searchSongs("Taylor Swift"),
         api.searchAlbums("1989"),
       ]).then(([songs, albums, songs2, albums2]) => {
          setRecent([...songs.slice(0,1), ...albums.slice(0,1), ...songs2.slice(0,1), ...albums2.slice(0,1)]);
       });
    }
  }, [history]);

  const ShortcutCard: React.FC<{ title: string, image?: string, isLikedSongs?: boolean, onClick?: () => void }> = ({ title, image, isLikedSongs = false, onClick }) => (
    <div 
        onClick={onClick}
        className="glass-card flex items-center gap-0 cursor-pointer h-[48px] overflow-hidden group rounded-[4px] bg-[#2A2A2A] hover:bg-[#3E3E3E] transition-colors"
    >
        {isLikedSongs ? (
            <div className="h-full w-[48px] bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 opacity-100">
                <svg role="img" height="18" width="18" aria-hidden="true" viewBox="0 0 24 24" fill="white"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"></path></svg>
            </div>
        ) : (
            <img src={image} className="h-[48px] w-[48px] object-cover shrink-0 shadow-none" alt=""/>
        )}
        <div className="flex flex-1 items-center justify-between pr-2 pl-2 overflow-hidden">
             <span className="font-bold text-[11px] md:text-[13px] leading-tight line-clamp-2 text-white pr-1">{title}</span>
        </div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-white px-4 hover:underline cursor-pointer tracking-tight">{title}</h2>
  );

  const handleProfileClick = () => {
    if (currentUser) {
        navigate('/profile');
    } else {
        navigate('/login');
    }
  };

  return (
    <div className={`flex flex-col gap-6 min-h-full pb-36 pt-2 relative`}>
      {/* Background Gradient */}
      <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#1E1E1E] to-[#121212] -z-10"></div>

      {/* Top Header */}
      <div className="px-4 pt-4 flex items-center justify-start gap-3 sticky top-0 z-20 py-2 bg-transparent backdrop-blur-sm md:backdrop-blur-none">
         {/* Profile Icon */}
         <div 
            onClick={handleProfileClick}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1DB954] to-[#1ed760] flex items-center justify-center font-bold text-black text-sm shrink-0 cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-md"
         >
             {currentUser && currentUser.image ? (
                 <img src={currentUser.image} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                 <span className="font-bold">{currentUser ? currentUser.name.charAt(0).toUpperCase() : <UserCircle size={20} />}</span>
             )}
         </div>
         
         {/* Filter Chips */}
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
             <button className="px-4 py-1.5 bg-[#1DB954] text-black rounded-full text-[13px] font-medium transition-transform shadow-sm whitespace-nowrap active:scale-95">All</button>
             <button className="px-4 py-1.5 bg-[#2A2A2A] text-white rounded-full text-[13px] font-medium whitespace-nowrap border border-transparent hover:bg-[#333] active:scale-95">Music</button>
             <button className="px-4 py-1.5 bg-[#2A2A2A] text-white rounded-full text-[13px] font-medium whitespace-nowrap border border-transparent hover:bg-[#333] active:scale-95">Podcasts</button>
         </div>
      </div>

      {/* Grid Shortcuts (Jump back in) */}
      <div className="px-4 mt-2">
          <h2 className="text-2xl font-bold text-white mb-4">Jump back in</h2>
          <div className="grid grid-cols-2 gap-2">
            <ShortcutCard title="Liked Songs" isLikedSongs onClick={() => navigate('/library')} />
            {recent.slice(0, 5).map((item, idx) => (
                <ShortcutCard 
                    key={item.id + idx} 
                    title={item.name} 
                    image={getImageUrl(item.image)}
                    onClick={() => item.type === 'song' ? playSong(item as Song, [item as Song]) : navigate(`/album/${item.id}`)}
                />
            ))}
          </div>
      </div>

      {/* Recommended Section */}
      <section className="mt-2">
        <SectionTitle title="Made For You" />
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar px-4 snap-x">
            {daylist.map((item, i) => (
                <div key={i} className="snap-start">
                    <SongCard item={item} onPlay={() => playSong(item, daylist)} />
                </div>
            ))}
        </div>
      </section>

      {/* Popular Artists */}
       <section>
        <SectionTitle title="Your favorite artists" />
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar px-4 snap-x">
            {daylist.slice(0,6).map((item, i) => (
                <div key={i} className="snap-start">
                    <SongCard item={item} round={true} />
                </div>
            ))}
        </div>
      </section>
      
       {/* Recently Played */}
      <section>
        <SectionTitle title="Recently played" />
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar px-4 snap-x">
            {recent.length > 0 ? recent.map((item, i) => (
                <div key={i} className="snap-start">
                    <SongCard item={item} onPlay={() => item.type === 'song' && playSong(item as Song, [item as Song])} />
                </div>
            )) : (
                 <div className="text-[#B3B3B3] text-sm px-4 h-[100px] flex items-center">Play some music to see it here.</div>
            )}
        </div>
      </section>
    </div>
  );
};