import React from 'react';
import { Check, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPromo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-black text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-[#333] to-black opacity-40 z-0"></div>

      {/* Header */}
      <div className="z-10 flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="bg-black/50 p-2 rounded-full">
            <X size={24} className="text-white"/>
          </button>
      </div>

      <div className="z-10 flex-1 flex flex-col px-8 pt-4 pb-12">
          
          <div className="flex-1 flex flex-col justify-center">
             <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                 Premium is better.
             </h1>
             
             <div className="space-y-6 mb-12">
                 <div className="flex items-center gap-4">
                     <Check size={28} className="text-[#1DB954]" strokeWidth={3} />
                     <span className="text-xl font-bold">No ad interruptions.</span>
                 </div>
                 <div className="flex items-center gap-4">
                     <Check size={28} className="text-[#1DB954]" strokeWidth={3} />
                     <span className="text-xl font-bold">Play any song.</span>
                 </div>
                 <div className="flex items-center gap-4">
                     <Check size={28} className="text-[#1DB954]" strokeWidth={3} />
                     <span className="text-xl font-bold">Higher sound quality.</span>
                 </div>
                 <div className="flex items-center gap-4">
                     <Check size={28} className="text-[#1DB954]" strokeWidth={3} />
                     <span className="text-xl font-bold">Offline listening.</span>
                 </div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
              <button className="w-full bg-white text-black font-bold py-4 rounded-full text-lg hover:scale-105 transition-transform">
                  GET PREMIUM INDIVIDUAL
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="w-full bg-transparent border border-[#555] text-white font-bold py-4 rounded-full text-lg hover:border-white transition-colors"
              >
                  NO THANKS
              </button>
              <p className="text-[10px] text-center text-[#777] mt-4 px-4 leading-relaxed">
                  Premium Individual only. ₹119/month after. Terms and conditions apply. Offer not available to users who have already tried Premium.
              </p>
          </div>
      </div>
    </div>
  );
};