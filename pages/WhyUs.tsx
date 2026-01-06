import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, WifiOff, Users, Music2, CheckCircle2, XCircle, ArrowLeft, Rocket, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WhyUs: React.FC = () => {
  const navigate = useNavigate();
  const [scrollOpacity, setScrollOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
        const opacity = Math.min(window.scrollY / 200, 1);
        setScrollOpacity(opacity);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const FeatureRow = ({ icon: Icon, title, desc, free, highlight = false }: any) => (
      <div className={`p-5 rounded-lg mb-2 flex items-center gap-4 transition-colors ${highlight ? 'bg-[#1DB954]/10 border border-[#1DB954]/20' : 'bg-[#181818] hover:bg-[#202020]'}`}>
          <div className={`p-3 rounded-full shrink-0 ${highlight ? 'bg-[#1DB954] text-black' : 'bg-[#2A2A2A] text-[#1DB954]'}`}>
              <Icon size={24} />
          </div>
          <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-[15px] ${highlight ? 'text-[#1DB954]' : 'text-white'}`}>{title}</h3>
              <p className="text-sm text-[#B3B3B3] leading-snug">{desc}</p>
          </div>
          <div className="shrink-0 pl-2">
              {free ? (
                  <div className="flex flex-col items-center">
                      <CheckCircle2 size={24} className="text-[#1DB954]" />
                      <span className="text-[10px] font-bold text-[#1DB954] mt-1">FREE</span>
                  </div>
              ) : (
                  <div className="flex flex-col items-center opacity-50">
                       <XCircle size={24} className="text-red-500" />
                       <span className="text-[10px] font-bold text-red-500 mt-1">PAID</span>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="min-h-full bg-[#121212] text-white pb-32 relative isolate">
       
       {/* Background Gradient */}
       <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#064e3b] via-[#121212] to-[#121212] -z-10 transition-colors" />

       {/* Sticky Header */}
       <div 
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-200"
        style={{ backgroundColor: `rgba(18, 18, 18, ${scrollOpacity})` }}
      >
          <button 
              onClick={() => navigate(-1)} 
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
              <ArrowLeft size={20} />
          </button>
          <span 
            className="font-bold text-sm opacity-0 transition-opacity duration-300"
            style={{ opacity: scrollOpacity }}
          >
            Why Vibestream?
          </span>
          <div className="w-8"></div> {/* Spacer */}
      </div>

       <div className="max-w-2xl mx-auto px-6 flex flex-col gap-6 -mt-2">
           
           {/* Hero */}
           <div className="flex flex-col items-center text-center gap-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(29,185,84,0.4)] mb-2">
                   <Rocket size={40} className="text-black" />
               </div>
               <h1 className="text-4xl font-black tracking-tight leading-none">
                   Better than <br/> the rest.
               </h1>
               <p className="text-[#B3B3B3] text-lg max-w-sm">
                   We unlocked every premium feature so you can just enjoy the music.
               </p>
           </div>

           {/* Comparison List */}
           <div className="flex flex-col gap-4">
               <div className="flex items-center justify-between px-2 mb-2">
                   <span className="text-xs font-bold uppercase tracking-widest text-white/50">Features</span>
                   <span className="text-xs font-bold uppercase tracking-widest text-[#1DB954]">Vibestream</span>
               </div>

               <FeatureRow 
                    icon={Zap} 
                    title="Ad-Free Listening" 
                    desc="Zero interruptions. Just you and your music." 
                    free={true} 
                    highlight={true}
               />

               <FeatureRow 
                    icon={Music2} 
                    title="High Quality Audio" 
                    desc="Stream in 320kbps clarity without paying extra." 
                    free={true} 
               />

               <FeatureRow 
                    icon={WifiOff} 
                    title="Offline Mode" 
                    desc="Download songs to your device and listen anywhere." 
                    free={true} 
               />

               <FeatureRow 
                    icon={Users} 
                    title="Social Parties" 
                    desc="Listen together with friends in real-time." 
                    free={true} 
               />

               <FeatureRow 
                    icon={ShieldCheck} 
                    title="No Data Tracking" 
                    desc="We don't sell your listening data to advertisers." 
                    free={true} 
               />

           </div>

           {/* Footer Action */}
           <div className="mt-8 text-center">
               <p className="text-sm text-[#777] mb-6">Stop paying for basic features.</p>
               <button 
                  onClick={() => navigate('/')}
                  className="bg-white text-black font-bold py-4 px-12 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
               >
                   Start Listening Free
               </button>
           </div>

       </div>
    </div>
  );
};