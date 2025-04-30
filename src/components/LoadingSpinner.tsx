import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingSpinnerProps {
  progress?: number;
  message?: string;
  minDisplayTime?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  progress = 0,
  message = 'Loading...',
  minDisplayTime = 2000 // 2 seconds minimum display time
}) => {
  const [shouldShow, setShouldShow] = useState(true);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Smoothly animate the progress
    const animationDuration = 500; // 500ms for smooth progress updates
    const startValue = displayProgress;
    const endValue = progress;
    const startTime = Date.now();

    const animateProgress = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Ease out cubic function
      const t = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * t;

      setDisplayProgress(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      }
    };

    requestAnimationFrame(animateProgress);
  }, [progress]);

  useEffect(() => {
    // Only start the minimum display timer when progress reaches 100
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, minDisplayTime);

      return () => clearTimeout(timer);
    }
  }, [progress, minDisplayTime]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div 
          className="fixed inset-0 bg-amber-50 flex flex-col items-center justify-center z-50"
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="relative w-24 h-24 mb-8">
            <motion.div
              className="absolute inset-0 border-4 border-amber-200 rounded-full"
              style={{ borderTopColor: '#F59E0B' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-amber-200 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-amber-500"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          {/* Progress text */}
          <p className="text-amber-800 font-medium">
            {message} ({Math.round(displayProgress)}%)
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 