import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Room from './components/Room';
import StartScreen from './components/StartScreen';
import { Howl } from 'howler';
import './App.css';

const App = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showRoom, setShowRoom] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const [welcomeMessage, setWelcomeMessage] = useState(false);

  // States to manage the welcome message dismissal logic
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [minWelcomeTimePassed, setMinWelcomeTimePassed] = useState(false);

  const [backgroundMusic] = useState(
    new Howl({
      src: ['/backtrack.mp3'],
      loop: true,
      volume: 0.5,
    })
  );

  // Effect for body style (unchanged)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    return () => {
      backgroundMusic.stop();
      document.body.style.overflow = '';
    };
  }, [backgroundMusic]);

  // Effect for click outside volume (unchanged)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target as Node)
      ) { /* Handle click outside if needed */ }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Audio Controls (unchanged) ---
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    backgroundMusic.mute(newMutedState);
    if (!newMutedState && volume === 0) {
      const defaultVolume = 0.1;
      setVolume(defaultVolume);
      backgroundMusic.volume(defaultVolume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    backgroundMusic.volume(newVolume);
    if (newVolume === 0) {
      if (!isMuted) { setIsMuted(true); backgroundMusic.mute(true); }
    } else {
      if (isMuted) { setIsMuted(false); backgroundMusic.mute(false); }
    }
  };
  // --- End Audio Controls ---


  // Callback for when Room signals it's ready
  const handleRoomReady = () => {
    console.log("App received onReady signal from Room."); // Debug
    setIsRoomReady(true); // Mark room as ready
  };

  // Function to handle starting the experience
  const handleBegin = () => {
    if (!backgroundMusic.playing()) {
      backgroundMusic.play();
    }
    setShowStartScreen(false); // Trigger StartScreen exit

    // Reset readiness flags and show welcome message
    setIsRoomReady(false);
    setMinWelcomeTimePassed(false);
    setWelcomeMessage(true); // Trigger WelcomeMessage fade-in

    // Start loading Room component concurrently
    setShowRoom(true);

    // Set timer for minimum welcome message display time (e.g., 1000ms = 1 second)
    setTimeout(() => {
      console.log("Minimum welcome time passed."); // Debug
      setMinWelcomeTimePassed(true);
    }, 1000); // Adjust duration as needed
  };

  // Effect to handle hiding the welcome message when conditions are met
  useEffect(() => {
    // Only proceed if the welcome message is currently supposed to be shown
    if (!welcomeMessage) return;

    if (isRoomReady && minWelcomeTimePassed) {
      console.log("Room ready AND min time passed, hiding welcome message."); // Debug
      setWelcomeMessage(false); // Trigger WelcomeMessage fade-out
    }
    // Add welcomeMessage to dependency array to re-evaluate if it changes externally
  }, [isRoomReady, minWelcomeTimePassed, welcomeMessage]);


  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* AnimatePresence without mode="wait" */}
      <AnimatePresence>
        {showRoom && (
          <motion.div
            key="room"
            className="fixed inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            {/* Pass the onReady callback */}
            <Room onReady={handleRoomReady} />
          </motion.div>
        )}

         {welcomeMessage && (
             <motion.div
                 key="welcome"
                 className="fixed inset-0 w-full h-full bg-amber-50 flex items-center justify-center z-40"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 1.5 }} // Fade-in and fade-out duration
             >
                 <motion.h1
                     className="text-[#2a1e18] text-7xl md:text-8xl font-extrabold drop-shadow-lg"
                     initial={{ y: 30, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ duration: 1, ease: 'easeOut' }}
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
                transition: { duration: 1.0, ease: 'easeInOut' },
              }}
            >
             <StartScreen onBegin={handleBegin} />
           </motion.div>
         )}
      </AnimatePresence>

      {/* Volume Controls (unchanged) */}
      <div
  className="fixed top-4 right-4 z-50"
  ref={volumeControlRef}
>
  <div className="flex items-center gap-2 p-2 bg-gray-800/60 rounded-full shadow-lg">
    {/* Icon container with fixed width */}
    <div className="w-8 flex justify-center">
      <button
        onClick={toggleMute}
        className="text-white text-lg focus:outline-none"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
      </button>
    </div>

    {/* Slider */}
    <input
      type="range"
      min="0" max="1" step="0.01"
      value={isMuted ? 0 : volume}
      onChange={handleVolumeChange}
      className="h-2 flex-1 appearance-none rounded-lg outline-none cursor-pointer"
      style={{
        background: `linear-gradient(
          to right,
          #fbbf24 ${(isMuted ? 0 : volume) * 100}%,
          rgba(251,191,36,0.2) ${(isMuted ? 0 : volume) * 100}%
        )`,
      }}
    />

    {/* Percentage label */}
    <span className="w-8 text-right text-sm font-bold text-white">
      {Math.round((isMuted ? 0 : volume) * 100)}%
    </span>
  </div>
</div>

    </div>
  );
};

export default App;