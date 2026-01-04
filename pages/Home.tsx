import React, { useEffect, useState } from 'react';
import { api, getImageUrl } from '../services/api';
import { Song, Album } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { Bell, History, Settings, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SongCard } from '../components/SongCard';

export const Home: React.FC = () => {
  const [daylist, setDaylist] = useState<Song[]>([]);
  const [recent, setRecent] = useState<(Song | Album)[]>([]); 
  const { history, playSong } = usePlayerStore();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  // Dynamic background color based on time (simulated)
  const bgGradient = "bg-gradient-to-b from-[#1e3a8a] to-[#121212]"; // Deep blue start

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
    if (history.length > 0) {
      setRecent(history.slice(0, 6));
    } else {
       // Default content to fill grid if empty
       Promise.all([
         api.searchSongs("The Weeknd"),
         api.searchAlbums("Starboy"),
       ]).then(([songs, albums]) => {
          setRecent([...songs.slice(0,3), ...albums.slice(0,3)]);
       });
    }
  }, [history]);

  const ShortcutCard: React.FC<{ title: string, image?: string, isLikedSongs?: boolean, onClick?: () => void }> = ({ title, image, isLikedSongs = false, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-[#303030]/60 hover:bg-[#454545]/80 transition-colors rounded-[4px] flex items-center gap-0 cursor-pointer h-[48px] overflow-hidden group shadow-sm"
    >
        {isLikedSongs ? (
            <div className="h-full w-[48px] bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 opacity-100">
                <svg role="img" height="18" width="18" aria-hidden="true" viewBox="0 0 24 24" fill="white"><path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"></path></svg>
            </div>
        ) : (
            <img src={image} className="h-[48px] w-[48px] object-cover shadow-lg shrink-0" alt=""/>
        )}
        <div className="flex flex-1 items-center justify-between pr-3 pl-3">
             <span className="font-bold text-[13px] leading-tight line-clamp-2 text-white">{title}</span>
             {/* Hover Play Button */}
             <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={16} fill="black" className="ml-0.5 text-black" />
             </div>
        </div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
      <h2 className="text-2xl font-bold mb-4 text-white px-4 hover:underline cursor-pointer">{title}</h2>
  );

  return (
    <div className={`flex flex-col gap-6 min-h-full pb-32 pt-2 relative`}>
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#222266] to-[#121212] -z-10 opacity-80"></div>

      {/* Top Header */}
      <div className="px-4 pt-4 flex items-center justify-between gap-3 sticky top-0 z-20 py-2">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center font-bold text-black text-xs">A</div>
             <button className="px-3 py-1.5 bg-[#1DB954] text-black rounded-full text-xs font-semibold hover:scale-105 transition-transform">All</button>
             <button className="px-3 py-1.5 bg-[#2A2A2A] text-white rounded-full text-xs font-medium hover:bg-[#333]">Music</button>
             <button className="px-3 py-1.5 bg-[#2A2A2A] text-white rounded-full text-xs font-medium hover:bg-[#333]">Podcasts</button>
         </div>
         <div className="flex items-center gap-5 text-white/80">
             <Bell size={20} className="hover:text-white cursor-pointer" />
             <History size={20} className="hover:text-white cursor-pointer" />
             <Settings size={20} className="hover:text-white cursor-pointer" />
         </div>
      </div>

      {/* Greeting Title */}
      <div className="px-4 mt-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">{greeting}</h1>
      </div>

      {/* Grid Shortcuts */}
      <div className="px-4">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 mt-4">
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
      <section className="mt-4">
        <SectionTitle title="Made For You" />
        <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar px-4">
            {daylist.map((item, i) => (
                <SongCard key={i} item={item} onPlay={() => playSong(item, daylist)} />
            ))}
        </div>
      </section>

      {/* Recently Played */}
      <section>
        <SectionTitle title="Recently played" />
        <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar px-4">
            {recent.length > 0 ? recent.map((item, i) => (
                <SongCard key={i} item={item} onPlay={() => item.type === 'song' && playSong(item as Song, [item as Song])} />
            )) : (
                 <div className="text-[#B3B3B3] text-sm px-4 h-[200px] flex items-center">Play some music to see it here.</div>
            )}
        </div>
      </section>
      
      {/* Popular Artists */}
       <section>
        <SectionTitle title="Your favorite artists" />
        <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar px-4">
            {daylist.slice(0,6).map((item, i) => (
                <SongCard key={i} item={item} round={true} />
            ))}
        </div>
      </section>
    </div>
  );
};