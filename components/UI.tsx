import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';

// Raw lyrics data provided by user
const LYRICS_RAW = `
00:00 You can call me honey if you want because I'm the one you want
00:06 mm-mm
00:11 When anyone called me sweetheart it was passive aggressive
00:16 At the bar and the check was telling me to back off cause a man had looked at me wrong
00:23 If anyone called me honey it was standing in the bathroom
00:28 Why'd he say that? Skirt don't fit me and I cried the whole way home
00:35 But you touch my face
00:40 Redefine all of those blues
00:43 When you say
00:46 Honey
00:47 Summer time spreads pink skies
00:50 You can call me honey if you want because I'm the one you want
00:54 Winter green kiss all mine
00:56 You give it different meaning cause you mean it when you say
00:59 Honey I'm home we could play house we could bet on picking your poison
01:04 The baddest in the land what's the plan?
01:06 What's the plan?
01:07 You could be my forever nightstand
01:09 Honey
01:11 When anyone called me sweetheart it was passive aggressive
01:16 At the bar and the check was telling me to back off cause a man had looked at me wrong
01:21 He looked at me wrong
01:23 If anyone called me honey it was standing in the bathroom
01:28 Why'd he say that? Skirt don't fit me and I cried the whole way home
01:34 But you touch my face
01:39 Redefine all of those blues
01:42 When you say yeah
01:48 You can call me honey if you want because I'm the one you want
01:52 I'm the one you want
01:54 You give it different meaning cause you mean it when you say
01:57 Sweetie it's yours kicking in doors ticket to more
02:00 Give me more buy the paint and the color of your eyes
02:04 Of your eyes
02:05 And graffiti my whole damn life
02:08 Honey
02:09 When anyone called me late night he was screwing around with my mind
02:14 Asking what are you wearing? Too hard to remember in the morning
02:21 And when anyone called me lovely they were finding ways not to praise me
02:26 But you say it like you're in awe of me and you stay until the morning
02:33 Honey
02:34 When anyone called me sweetheart it was passive aggressive
02:39 At the bar and the check was telling me to back off cause a man had looked at me wrong
02:45 He looked at me wrong
02:46 If anyone called me honey it was standing in the bathroom
02:51 Why'd he say that? Skirt don't fit me and I cried the whole way home
02:56 Cried the whole way home
02:58 But you can call me honey if you want
`;

interface LyricLine {
  time: number;
  text: string;
}

const parseLyrics = (raw: string): LyricLine[] => {
  return raw.trim().split('\n').map(line => {
    const parts = line.trim().split(' ');
    const timePart = parts[0];
    const textPart = parts.slice(1).join(' ');
    
    const [min, sec] = timePart.split(':').map(parseFloat);
    const totalSeconds = min * 60 + sec;
    
    return { time: totalSeconds, text: textPart };
  }).filter(l => !isNaN(l.time));
};

const UI: React.FC = () => {
  const { phase, gesture, cameraActive, toggleCamera } = useAppStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [currentLyric, setCurrentLyric] = useState<string>('');
  
  const lyrics = useMemo(() => parseLyrics(LYRICS_RAW), []);

  // Handle Autoplay logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Try playing immediately
    const startPlay = async () => {
        try {
            await audio.play();
            setIsPlaying(true);
            setAutoplayBlocked(false);
        } catch (err) {
            console.log("Autoplay blocked, waiting for interaction.");
            setAutoplayBlocked(true);
            setIsPlaying(false);
        }
    };
    startPlay();

    // 2. Global fallback for interaction
    const handleUserInteraction = () => {
        if (audio.paused) {
            audio.play().then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
            }).catch(e => console.error("Play failed:", e));
        }
    };

    // Add listeners to document to catch the first click anywhere
    ['click', 'touchstart', 'keydown'].forEach(event => 
        document.addEventListener(event, handleUserInteraction, { once: true })
    );

    return () => {
         ['click', 'touchstart', 'keydown'].forEach(event => 
            document.removeEventListener(event, handleUserInteraction)
        );
    };
  }, []);

  // Sync lyrics
  const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      const currentTime = audioRef.current.currentTime;
      
      // Find the active lyric line
      // We want the last line where line.time <= currentTime
      let activeText = '';
      for (let i = 0; i < lyrics.length; i++) {
          if (lyrics[i].time <= currentTime) {
              activeText = lyrics[i].text;
          } else {
              break; 
          }
      }
      if (activeText !== currentLyric) {
          setCurrentLyric(activeText);
      }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
      } else {
          audioRef.current.play();
          setIsPlaying(true);
          setAutoplayBlocked(false);
      }
    }
  };

  // Translation helpers
  const getGestureName = (g: string) => {
      switch(g) {
          case 'Open_Palm': return '五指张开';
          case 'Closed_Fist': return '握拳';
          default: return '无';
      }
  };

  const getPhaseName = (p: string) => {
      switch(p) {
          case 'tree': return '圣诞树';
          case 'blooming': return '绽放';
          case 'nebula': return '星云照片墙';
          case 'collapsing': return '复原';
          default: return p;
      }
  };

  const audioSrc = "./Honey%20(Song%20by%20Taylor%20Swift).mp3";

  return (
    <>
      {/* Title */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center mix-blend-screen">
        <h1 
            className="font-cursive text-6xl md:text-9xl text-yellow-300 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] opacity-90 transition-all duration-1000"
            style={{ 
                transform: phase === 'tree' ? 'scale(1)' : 'scale(1.5)',
                opacity: phase === 'tree' ? 1 : 0.2 // Fade out when in nebula
            }}
        >
          Merry Christmas
        </h1>
      </div>

      {/* Top Left Status */}
      <div className="fixed top-4 left-4 z-20">
        <div className="glass-panel p-4 rounded-xl text-white max-w-xs">
           <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="font-bold text-sm uppercase tracking-wider">系统状态</span>
           </div>
           <div className="space-y-1 text-sm font-light text-gray-200">
               <p>当前阶段: <span className="text-yellow-300 uppercase">{getPhaseName(phase)}</span></p>
               <p>手势指令: <span className="text-blue-300 font-mono">{getGestureName(gesture)}</span></p>
           </div>
           
           <button 
              onClick={toggleCamera}
              className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 transition rounded border border-white/10 text-xs font-semibold"
           >
              {cameraActive ? '关闭摄像头' : '开启摄像头'}
           </button>
        </div>
      </div>

      {/* Center Autoplay Hint (Only if blocked) */}
      {autoplayBlocked && !isPlaying && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="glass-panel px-6 py-3 rounded-full animate-bounce">
                  <p className="text-white text-lg font-light tracking-widest">点击屏幕开始播放音乐 🎵</p>
              </div>
          </div>
      )}

      {/* Bottom Music Player & Lyrics */}
      <div className="fixed bottom-10 left-0 w-full z-20 flex flex-col items-center gap-4 pointer-events-none">
         
         {/* Dynamic Lyrics Display */}
         <div className="h-12 flex items-center justify-center px-4 transition-all duration-500">
             <p className="text-yellow-100 font-light text-xl md:text-2xl text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-[fadeIn_0.5s_ease-out]">
                 {currentLyric || "♪ ~"}
             </p>
         </div>

         {/* Personalized Text */}
         <div className="text-center animate-pulse">
             <span className="font-cursive text-2xl text-yellow-200 drop-shadow-[0_0_5px_rgba(253,230,138,0.5)]">
                 Merry Christmas Ms. Hu
             </span>
         </div>

         {/* Player Controls (Pointer events enabled for button) */}
         <div className="pointer-events-auto">
             <button 
                onClick={toggleAudio}
                className={`
                    w-16 h-16 rounded-full flex items-center justify-center 
                    transition-all duration-500 hover:scale-110
                    ${isPlaying ? 'animate-pulse' : 'opacity-60'}
                `}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    boxShadow: isPlaying ? '0 0 30px rgba(167, 243, 208, 0.5)' : 'none',
                    backdropFilter: 'blur(5px)'
                }}
             >
                 <div className={`text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                    ❄️
                 </div>
             </button>
         </div>

         <audio 
            ref={audioRef} 
            loop 
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
         />
      </div>
    </>
  );
};

export default UI;