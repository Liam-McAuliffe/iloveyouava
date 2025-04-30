import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Define type for stickers
interface Sticker {
  id: string;
  src: string;
  rotation: number;
  scale: number;
  x: number;
  y: number;
}

// Define initial sticker type
interface InitialSticker {
  id: string;
  src: string;
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  rotate: number;
}

// Define the StartScreen component props
const StartScreen = ({ onBegin }: { onBegin: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const constraintsRef = useRef(null);

  // State for hovering letter
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);

  // State for stickers placed on the main area
  const [addedStickers, setAddedStickers] = useState<Sticker[]>([]);

  // State for the sticker currently being dragged from the inventory
  const [draggingSticker, setDraggingSticker] = useState<Sticker | null>(null);

  // Available stickers for the inventory
  const availableStickers = [
    { id: 'apple', src: '/stickers/apple-sticker.png' },
    { id: 'butterfly', src: '/stickers/butterfly-sticker.png' },
    { id: 'comet', src: '/stickers/comet-sticker.png' },
    { id: 'heart-dot', src: '/stickers/heart-dot-sticker.png' },
    { id: 'heart', src: '/stickers/heart-sticker.png' },
    { id: 'hi', src: '/stickers/hi-sticker.png' },
    { id: 'love', src: '/stickers/love-sticker.png' },
    { id: 'moon', src: '/stickers/moon-sticker.png' },
    { id: 'rainbow', src: '/stickers/rainbow-sticker.png' },
    { id: 'smile', src: '/stickers/smile-sticker.png' },
    { id: 'star', src: '/stickers/star-sticker.png' },
    { id: 'strawberry', src: '/stickers/strawberry-sticker.png' },
    { id: 'tulip', src: '/stickers/tulip-sticker.png' },
    { id: 'green-flower', src: '/stickers/green-flower-sticker.png' },
  ];

  // Initial stickers that are already on the canvas
  const initialStickers: InitialSticker[] = [
    { id: 'flower', src: '/stickers/flower-sticker.png', position: { top: '-16px', right: '-10px' }, rotate: -15 },
    { id: 'heart', src: '/stickers/heart-sticker.png', position: { left: '-10px', top: '20px' }, rotate: 12 },
    { id: 'butterfly', src: '/stickers/butterfly-sticker.png', position: { right: '20px', top: '64px' }, rotate: -5 },
    { id: 'rainbow', src: '/stickers/rainbow-sticker.png', position: { left: '12px', bottom: '10px' }, rotate: 15 },
    { id: 'green-flower', src: '/stickers/green-flower-sticker.png', position: { right: '16px', bottom: '24px' }, rotate: -10 },
  ];

  // Letter configurations for I LOVE YOU AVA!
  const letters = [
    // I
    { text: 'I', color: 'text-rose-400', shadow: 'drop-shadow-[0_2px_4px_rgba(244,63,94,0.6)]', delay: 0.1, duration: 3.0, amplitude: 8, rotateRange: [-5, 5] },
    // L
    { text: 'L', color: 'text-teal-400', shadow: 'drop-shadow-[0_2px_4px_rgba(45,212,191,0.6)]', delay: 0.2, duration: 2.5, amplitude: 6, rotateRange: [-4, 4] },
    // O
    { text: 'O', color: 'text-pink-300', shadow: 'drop-shadow-[0_2px_4px_rgba(249,168,212,0.6)]', delay: 0.3, duration: 3.5, amplitude: 10, rotateRange: [-6, 6] },
    // V
    { text: 'V', color: 'text-amber-400', shadow: 'drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)]', delay: 0.4, duration: 2.8, amplitude: 7, rotateRange: [-3, 3] },
    // E
    { text: 'E', color: 'text-emerald-400', shadow: 'drop-shadow-[0_2px_4px_rgba(52,211,153,0.6)]', delay: 0.5, duration: 3.2, amplitude: 9, rotateRange: [-5, 5] },

    // Y
    { text: 'Y', color: 'text-yellow-400', shadow: 'drop-shadow-[0_2px_4px_rgba(250,204,21,0.6)]', delay: 0.3, duration: 3.4, amplitude: 8, rotateRange: [-4, 4] },
    // O
    { text: 'O', color: 'text-red-400', shadow: 'drop-shadow-[0_2px_4px_rgba(248,113,113,0.6)]', delay: 0.4, duration: 2.9, amplitude: 7, rotateRange: [-5, 5] },
    // U
    { text: 'U', color: 'text-yellow-300', shadow: 'drop-shadow-[0_2px_4px_rgba(253,224,71,0.6)]', delay: 0.5, duration: 3.7, amplitude: 10, rotateRange: [-6, 6] },

    // A
    { text: 'A', color: 'text-emerald-300', shadow: 'drop-shadow-[0_2px_4px_rgba(110,231,183,0.6)]', delay: 0.6, duration: 3.3, amplitude: 7, rotateRange: [-4, 4] },
    // V
    { text: 'V', color: 'text-violet-300', shadow: 'drop-shadow-[0_2px_4px_rgba(196,181,253,0.6)]', delay: 0.7, duration: 3.6, amplitude: 8, rotateRange: [-5, 5] },
    // A
    { text: 'A', color: 'text-rose-300', shadow: 'drop-shadow-[0_2px_4px_rgba(253,164,175,0.6)]', delay: 0.8, duration: 2.8, amplitude: 6, rotateRange: [-3, 3] },
    // !
    { text: '!', color: 'text-teal-300', shadow: 'drop-shadow-[0_2px_4px_rgba(94,234,212,0.6)]', delay: 0.9, duration: 3.2, amplitude: 10, rotateRange: [-7, 7] },
  ];

  // Effect for initial load and preventing text selection
  useEffect(() => {
    // Simulate loading delay for better entrance effect
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    // Disable text selection during drag operations
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.userSelect = '';
      clearTimeout(timer);
    };
  }, []);

  const startDraggingNewSticker = (stickerId: string, stickerSrc: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const randomRotation = Math.floor(Math.random() * 30) - 15;
    const randomScale = 0.8 + Math.random() * 0.4;

    const newSticker: Sticker = {
      id: `${stickerId}-${Date.now()}`,
      src: stickerSrc,
      rotation: randomRotation,
      scale: randomScale,
      x: e.clientX,
      y: e.clientY
    };

    setDraggingSticker(newSticker);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (draggingSticker) {
      setDraggingSticker({
        ...draggingSticker,
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const finishDragging = (e: React.MouseEvent | MouseEvent) => {
    if (draggingSticker) {
      const finalSticker = {
        ...draggingSticker,
        x: e.clientX,
        y: e.clientY
      };

      setAddedStickers(prev => [...prev, finalSticker]);
      setDraggingSticker(null);
    }
  };

  // REMOVED: Sparkle component

  // REMOVED: generateSparkles function

  // Render an animated letter with effects
  const renderAnimatedLetter = (letter: { text: string, color: string, shadow: string, delay: number, duration: number, amplitude: number, rotateRange: number[] }, index: number) => {
    const isHovered = hoveredLetter === `${letter.text}-${index}`;
    const letterVariants = {
      initial: {
        y: index < 5 ? -100 : 100,
        opacity: 0,
        rotate: 0,
        scale: 1
      },
      animate: {
        y: [0, -letter.amplitude, 0],
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: {
          y: {
            delay: letter.delay,
            duration: letter.duration,
            repeat: Infinity,
            repeatType: "reverse",
          },
          opacity: {
            duration: 0.5,
            delay: letter.delay,
          }
        }
      },
      hover: {
        scale: 1.2,
        rotate: Math.random() < 0.5
          ? letter.rotateRange[0]
          : letter.rotateRange[1],
        y: 0, // Keep y fixed on hover to prevent jumping from animation
        transition: {
          scale: {
            duration: 0.3,
            type: "spring",
            stiffness: 300
          },
          rotate: {
            duration: 0.3
          }
        }
      }
    };

    return (
      <motion.div
        key={`${letter.text}-${index}`}
        className={`relative text-7xl font-bold ${letter.color} ${letter.shadow} mr-2 z-30 cursor-pointer`}
        variants={letterVariants}
        initial="initial"
        animate={isHovered ? "hover" : "animate"}
        onHoverStart={() => setHoveredLetter(`${letter.text}-${index}`)}
        onHoverEnd={() => setHoveredLetter(null)}
        // REMOVED: onTapStart and onTap props
      >
        {/* Optional: Glowing effect on hover (can be removed if not desired) */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 -z-10 rounded-full blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ backgroundColor: letter.color.includes('rose') ? '#fda4af' :
                                    letter.color.includes('teal') ? '#5eead4' :
                                    letter.color.includes('amber') ? '#fbbf24' :
                                    letter.color.includes('emerald') ? '#6ee7b7' :
                                    letter.color.includes('pink') ? '#f9a8d4' :
                                    letter.color.includes('yellow') ? '#fde047' :
                                    letter.color.includes('violet') ? '#c4b5fd' :
                                    letter.color.includes('red') ? '#f87171' : '#6ee7b7' }}
          />
        )}

        {/* REMOVED: id attribute and generateSparkles call */}
        <div className="relative">
          {/* The actual letter */}
          {letter.text}
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-amber-50 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={finishDragging}
    >
      {/* REMOVED: CSS for letter tap animation */}

      {/* Sticker Inventory Sidebar */}
      <motion.div
        className="fixed left-0 top-0 h-full w-28 bg-amber-100/80 backdrop-blur-sm shadow-lg flex flex-col items-center pt-10 pb-4 space-y-4 overflow-y-auto z-30"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >

        {/* Inventory stickers */}
        {availableStickers.map((sticker) => (
          <motion.div
            key={sticker.id}
            className="w-16 h-16 cursor-grab hover:bg-amber-200/50 rounded-md p-1 transition-colors duration-150"
            whileHover={{ scale: 1.1 }}
            onMouseDown={(e) => startDraggingNewSticker(sticker.id, sticker.src, e)}
          >
            <img
              src={sticker.src}
              alt={`${sticker.id} sticker`}
              className="w-full h-full object-contain pointer-events-none"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Main content area with constraints for initial stickers */}
      <div ref={constraintsRef} className="relative w-full md:w-3/4 lg:w-2/3 h-4/5 flex flex-col items-center justify-center">
        {/* Background decorative elements */}
        <motion.div
          className="absolute w-full h-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          {/* Additional decorative elements */}
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-pink-100/30 blur-xl"
            style={{ top: '20%', left: '20%' }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-teal-100/30 blur-xl"
            style={{ bottom: '15%', right: '25%' }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          />
          <motion.div
            className="absolute w-24 h-24 rounded-full bg-amber-100/40 blur-xl"
            style={{ top: '30%', right: '20%' }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 9, repeat: Infinity, delay: 1 }}
          />
        </motion.div>

        {/* Initial stickers with fixed positions */}
        {initialStickers.map((sticker) => (
          <motion.div
            key={sticker.id}
            className="absolute w-20 h-20 z-20"
            style={sticker.position}
            initial={{ rotate: sticker.rotate, scale: 0 }}
            animate={{
              rotate: sticker.rotate,
              scale: isLoaded ? 1 : 0,
              y: isLoaded ? [0, -5, 0] : 0
            }}
            transition={{
              delay: Math.random() * 1.5,
              duration: 0.5,
              type: 'spring',
              y: {
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2
              }
            }}
          >
            <img
              src={sticker.src}
              alt={`${sticker.id} sticker`}
              className="w-full h-full object-contain pointer-events-none"
            />
          </motion.div>
        ))}

        {/* Letter rows with animated spacing */}
        <motion.div
          className="flex flex-col items-center space-y-4 z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* First row: I LOVE */}
          <motion.div
            className="flex flex-wrap justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {letters.slice(0, 5).map((letter, index) => renderAnimatedLetter(letter, index))}
          </motion.div>

          {/* Second row: YOU */}
          <motion.div
            className="flex flex-wrap justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {letters.slice(5, 8).map((letter, index) => renderAnimatedLetter(letter, index + 5))}
          </motion.div>

          {/* Third row: AVA! */}
          <motion.div
            className="flex flex-wrap justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {letters.slice(8).map((letter, index) => renderAnimatedLetter(letter, index + 8))}
          </motion.div>
        </motion.div>

        {/* Begin button with enhanced animation */}
        <motion.button
          className="mt-16 rounded-full px-10 py-3 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 text-amber-800 text-2xl font-bold shadow-lg hover:shadow-amber-200/50 focus:outline-none focus:ring-4 focus:ring-amber-200 relative overflow-hidden"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px -5px rgba(251, 191, 36, 0.3)"
          }}
          whileTap={{ scale: 0.98 }}
          onClick={onBegin}
        >
          {/* REMOVED: Button sparkle effect span */}

          <span className="relative z-10">BEGIN</span>
        </motion.button>

        {/* REMOVED: Floating hearts decorations */}
      </div>

      {/* Render user-added stickers from inventory */}
      {addedStickers.map((sticker) => (
        <motion.div
          key={sticker.id}
          className="fixed w-16 h-16 z-20" // Ensure added stickers appear above initial ones if needed
          style={{
            left: 0,
            top: 0,
            transform: `translate(${sticker.x}px, ${sticker.y}px) translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
            willChange: 'transform', // Optimization for animation
          }}
          // Added simple drag functionality to placed stickers
          drag
          dragConstraints={{ left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight }} // Basic window constraints
          dragMomentum={false} // Optional: disable momentum after drag
          // REMOVED: handleExistingStickerDragEnd as coordinates are updated automatically by drag prop + style
        >
          <img
            src={sticker.src}
            alt="Sticker"
            className="w-full h-full object-contain pointer-events-none" // prevent image interference with drag
          />
        </motion.div>
      ))}

      {/* Preview of currently dragging sticker */}
      {draggingSticker && (
        <motion.div
          className="fixed w-16 h-16 cursor-grabbing z-50 pointer-events-none" // Highest z-index, no pointer events
          style={{
            left: 0,
            top: 0,
            transform: `translate(${draggingSticker?.x ?? 0}px, ${draggingSticker?.y ?? 0}px) translate(-50%, -50%) rotate(${draggingSticker?.rotation ?? 0}deg) scale(${draggingSticker?.scale ?? 1})`,
            willChange: 'transform',
          }}
        >
          <img
            src={draggingSticker?.src ?? ''}
            alt="Dragging sticker"
            className="w-full h-full object-contain"
          />
        </motion.div>
      )}
    </div>
  );
};

export default StartScreen;