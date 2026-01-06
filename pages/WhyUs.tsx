import React from 'react';
import { motion } from 'framer-motion';
import { Zap, WifiOff, Users, Music2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WhyUs: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      color: "text-yellow-400",
      title: "Ad-Free Experience",
      description: "Enjoy uninterrupted music. No banners, no audio ads, just pure sound from start to finish.",
      original: false,
      us: true
    },
    {
      icon: Music2,
      color: "text-[#1DB954]",
      title: "Hi-Res Audio (320kbps)",
      description: "Stream in crystal clear 320kbps quality without paying for a premium subscription.",
      original: "Paid Only",
      us: "Free Forever"
    },
    {
      icon: WifiOff,
      color: "text-blue-400",
      title: "Offline Mode",
      description: "Download any track, album, or playlist directly to your device and listen without internet.",
      original: "Paid Only",
      us: "Free Forever"
    },
    {
      icon: Users,
      color: "text-purple-400",
      title: "Real-time Social",
      description: "See what your friends are listening to in real-time and join their listening parties.",
      original: "Desktop Only",
      us: "All Devices"
    },
  ];

  return (
    <div className="min-h-full bg-black pb-32">
       {/* Hero Section */}
       <div className="relative py-20 px-6 overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#1DB954]/20 blur-[120px] rounded-full pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
               <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-1.5 rounded-full border border-[#1DB954]/50 bg-[#1DB954]/10 text-[#1DB954] text-xs font-bold uppercase tracking-widest"
               >
                   The Better Choice
               </motion.span>
               <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight"
               >
                   Music without <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-emerald-300">Limits.</span>
               </motion.h1>
               <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-[#B3B3B3] max-w-2xl leading-relaxed"
               >
                   We've rebuilt the streaming experience from the ground up to give you features that others charge for, completely free.
               </motion.p>
           </div>
       </div>

       {/* Features Grid */}
       <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
           {features.map((feature, idx) => (
               <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#121212] border border-white/5 p-8 rounded-2xl hover:border-white/10 transition-colors group"
               >
                   <div className="flex items-center justify-between mb-6">
                       <div className={`p-4 rounded-full bg-white/5 ${feature.color}`}>
                           <feature.icon size={32} />
                       </div>
                       <div className="text-right">
                           <div className="text-xs text-[#555] font-bold uppercase tracking-wider mb-1">Standard App</div>
                           <div className="text-sm text-red-400 font-bold flex items-center justify-end gap-1">
                               {typeof feature.original === 'boolean' ? <XCircle size={14} /> : feature.original}
                           </div>
                       </div>
                   </div>
                   
                   <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                   <p className="text-[#B3B3B3] leading-relaxed mb-6">{feature.description}</p>
                   
                   <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                       <span className="text-sm font-bold text-[#1DB954] flex items-center gap-2">
                           <CheckCircle2 size={16} />
                           Included with Vibestream
                       </span>
                       {typeof feature.us === 'string' && (
                           <span className="text-xs font-bold text-white bg-[#2A2A2A] px-2 py-1 rounded">
                               {feature.us}
                           </span>
                       )}
                   </div>
               </motion.div>
           ))}
       </div>

       {/* Bottom CTA */}
       <div className="mt-20 text-center px-6">
           <h2 className="text-3xl font-bold text-white mb-6">Ready to upgrade your listening?</h2>
           <button 
              onClick={() => navigate('/')}
              className="bg-[#1DB954] text-black font-bold text-lg px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(29,185,84,0.3)]"
           >
               Start Listening Now
           </button>
       </div>
    </div>
  );
};