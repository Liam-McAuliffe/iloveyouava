import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Room from './components/Room';
import StartScreen from './components/StartScreen';
import { Howl } from 'howler';
import './App.css';

// Memoize components to prevent unnecessary re-renders
const MemoizedRoom = memo(Room);
const MemoizedStartScreen = memo(StartScreen);

// Create smooth transition presets
const fadeTransition = {
  duration: 1.5,
  ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for smooth motion
};

const slideTransition = {
  duration: 1.0,
  ease: [0.43, 0.13, 0.23, 0.96]
};

const App = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showRoom, setShowRoom] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState<Howl | null>(null);

  // States to manage the welcome message dismissal logic
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [minWelcomeTimePassed, setMinWelcomeTimePassed] = useState(false);

  // Initialize audio only after user interaction - use useCallback to memoize
  const initializeAudio = useCallback(() => {
    if (!backgroundMusic) {
      const music = new Howl({
        src: ['/backtrack.mp3'],
        loop: true,
        volume: volume,
        autoplay: false,
        html5: true, // Better performance with HTML5 Audio
        preload: false // Only load when needed
      });
      setBackgroundMusic(music);
      music.once('load', () => music.play());
    } else if (!backgroundMusic.playing()) {
      backgroundMusic.play();
    }
  }, [backgroundMusic, volume]);

  initializeAudio();
  
  // Function to handle starting the experience - use useCallback
  const handleBegin = useCallback(() => {
    setShowStartScreen(false);
    setIsRoomReady(false);
    setMinWelcomeTimePassed(false);
    setWelcomeMessage(true);
    setShowRoom(true);

    // Ensure minimum welcome time with requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const startTime = performance.now();
      const checkTime = () => {
        if (performance.now() - startTime >= 1000) {
          console.log("Minimum welcome time passed.");
          setMinWelcomeTimePassed(true);
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      requestAnimationFrame(checkTime);
    });
  }, [initializeAudio]);

  // Effect for body style
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      backgroundMusic?.stop();
      document.body.style.overflow = '';
    };
  }, [backgroundMusic]);

  // Effect for click outside volume with debounce for performance
  useEffect(() => {
    let timeoutId: number;
    
    const handleClickOutside = (event: MouseEvent) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (
          volumeControlRef.current &&
          !volumeControlRef.current.contains(event.target as Node)
        ) { /* Handle click outside if needed */ }
      }, 100); // Small debounce for better performance
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoize handlers for better performance
  const toggleMute = useCallback(() => {
    if (!backgroundMusic) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Smooth fade instead of abrupt mute
    if (newMutedState) {
      const currentVolume = backgroundMusic.volume();
      const fadeSteps = 10;
      const fadeInterval = 20; // ms
      
      for (let i = 0; i < fadeSteps; i++) {
        setTimeout(() => {
          const stepVolume = currentVolume * (fadeSteps - i - 1) / fadeSteps;
          backgroundMusic.volume(stepVolume);
          if (i === fadeSteps - 1) {
            backgroundMusic.mute(true);
            backgroundMusic.volume(currentVolume); // Restore for when unmuted
          }
        }, i * fadeInterval);
      }
    } else {
      backgroundMusic.mute(false);
      if (volume === 0) {
        const defaultVolume = 0.1;
        setVolume(defaultVolume);
        
        // Smooth volume increase
        const steps = 10;
        const interval = 20; // ms
        
        for (let i = 0; i < steps; i++) {
          setTimeout(() => {
            backgroundMusic.volume((i + 1) * defaultVolume / steps);
          }, i * interval);
        }
      }
    }
  }, [backgroundMusic, isMuted, volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!backgroundMusic) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Use requestAnimationFrame for smoother volume changes
    requestAnimationFrame(() => {
      // Smooth transition to new volume
      const currentVolume = backgroundMusic.volume();
      const volumeDiff = newVolume - currentVolume;
      const steps = 5;
      
      for (let i = 0; i < steps; i++) {
        setTimeout(() => {
          backgroundMusic.volume(currentVolume + (volumeDiff * (i + 1) / steps));
        }, i * 10);
      }
      
      // Handle mute state
      if (newVolume === 0) {
        if (!isMuted) { setIsMuted(true); setTimeout(() => backgroundMusic.mute(true), 50); }
      } else {
        if (isMuted) { setIsMuted(false); backgroundMusic.mute(false); }
      }
    });
  }, [backgroundMusic, isMuted]);

  // Callback for when Room signals it's ready - use useCallback
  const handleRoomReady = useCallback(() => {
    console.log("App received onReady signal from Room.");
    setIsRoomReady(true);
  }, []);

  // Effect to handle hiding the welcome message when conditions are met
  useEffect(() => {
    if (!welcomeMessage) return;

    if (isRoomReady && minWelcomeTimePassed) {
      console.log("Room ready AND min time passed, hiding welcome message.");
      // Use requestAnimationFrame for smoother state transition
      requestAnimationFrame(() => {
        setWelcomeMessage(false);
      });
    }
  }, [isRoomReady, minWelcomeTimePassed, welcomeMessage]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {showRoom && (
          <motion.div
            key="room"
            className="fixed inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
          >
            <MemoizedRoom onReady={handleRoomReady} />
          </motion.div>
        )}

        {welcomeMessage && (
          <motion.div
            key="welcome"
            className="fixed inset-0 w-full h-full bg-amber-50 flex items-center justify-center z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
          >
            <motion.h1
              className="text-[#2a1e18] text-7xl md:text-8xl font-extrabold drop-shadow-lg"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              I hope you enjoy!
            </motion.h1>
          </motion.div>
        )}

        {showStartScreen && (
          <motion.div
            key="start"
            className="fixed inset-0 z-50 bg-amber-50"
            initial={{ opacity: 1, y: 0 }}
            exit={{
              y: '-100%',
              transition: slideTransition,
            }}
          >
            <MemoizedStartScreen onBegin={handleBegin} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed top-4 right-4 z-50 volume-control"
        ref={volumeControlRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 p-2 bg-gray-800/60 backdrop-blur-sm rounded-full shadow-lg">
          <div className="w-8 flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="text-white text-lg focus:outline-none transition-opacity duration-200 hover:opacity-80"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
          </div>

          <input
            type="range"
            min="0" max="1" step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              e.stopPropagation();
              handleVolumeChange(e);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-2 flex-1 appearance-none rounded-lg outline-none cursor-pointer transition-all duration-200"
            style={{
              background: `linear-gradient(
                to right,
                #fbbf24 ${(isMuted ? 0 : volume) * 100}%,
                rgba(251,191,36,0.2) ${(isMuted ? 0 : volume) * 100}%
              )`,
            }}
          />

          <span className="w-8 text-right text-sm font-bold text-white">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default App;