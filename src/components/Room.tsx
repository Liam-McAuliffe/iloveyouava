import { useState, useRef, useEffect, Suspense, useCallback, useMemo, memo, ReactNode } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, useGLTF, useProgress, Html } from '@react-three/drei';
import { Vector3, Raycaster, Vector2, Group, Mesh, PerspectiveCamera } from 'three';
import { LoadingSpinner } from './LoadingSpinner';
import { Tooltip } from './Tooltip';
import Scrapbook from './Scrapbook';

// Enhanced TypeScript types
interface RoomProps {
  onReady?: () => void;
}

interface CameraControllerProps {
  target: Vector3;
  isZoomedIn: boolean;
}

interface RoomModelProps {
  isZoomedIn: boolean;
  setIsZoomedIn: (value: boolean) => void;
  children: ReactNode;
}

// Device detection
const isMobileDevice = () => {
  return window.innerWidth < 768 || 'ontouchstart' in window;
};

// Loading progress component - memoized for better performance
const LoadingManager = memo(() => {
  const { progress } = useProgress();
  return (
    <Html center>
      <LoadingSpinner 
        progress={progress} 
        message="Loading 3D Environment" 
        minDisplayTime={2000} 
      />
    </Html>
  );
});

// Enhanced CameraController with mobile support
const CameraController = memo(({ target, isZoomedIn }: CameraControllerProps) => {
  const { camera } = useThree();
  const initialPosition = useRef(new Vector3(4, 6, 4));
  const zoomedPosition = useRef(new Vector3(0.0, 1.2, 0.6));
  const isAnimating = useRef(false);
  const animationStartTime = useRef(0);
  const prevIsZoomedIn = useRef(isZoomedIn);

  useFrame((state, delta) => {
    // Optimize by skipping frame calculation if no change and not animating
    if (prevIsZoomedIn.current === isZoomedIn && !isAnimating.current) {
      return;
    }
    
    prevIsZoomedIn.current = isZoomedIn;
    const targetPosition = isZoomedIn ? zoomedPosition.current : initialPosition.current;
    
    // Calculate eased lerp factor based on animation progress
    if (!isAnimating.current) {
      isAnimating.current = true;
      animationStartTime.current = state.clock.elapsedTime;
    }
    
    const animationDuration = 1.0; // 1 second animation
    const elapsed = state.clock.elapsedTime - animationStartTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Improved ease in-out function for smoother animation
    const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeInOut(progress);
    
    // Use eased progress for lerp
    camera.position.lerpVectors(camera.position, targetPosition, easedProgress * delta * 10);

    // Smoothly interpolate camera lookAt target
    const lookAtTarget = new Vector3();
    const currentLookAt = new Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10);
    currentLookAt.add(camera.position);

    const finalLookAt = isZoomedIn ? target : new Vector3(0, 1, 0);
    lookAtTarget.lerpVectors(currentLookAt, finalLookAt, easedProgress * delta * 10);
    camera.lookAt(lookAtTarget);

    // Reset animation state when complete
    if (progress >= 1) {
      isAnimating.current = false;
    }
  });

  return null;
});

// --- Helper component to signal readiness ---
const ReadySignal = memo(({ onReady }: { onReady?: () => void }) => {
  useEffect(() => {
    // This useEffect runs only *after* all sibling Suspense dependencies are resolved
    if (onReady) {
      console.log("Suspense resolved, calling onReady..."); // Debug log
      requestAnimationFrame(() => {
        onReady();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount (after Suspense resolves)

  return null; // Doesn't render anything visible
});

// Enhanced RoomModel with mobile optimization and tooltips
const RoomModelRefactored = memo(({ isZoomedIn, setIsZoomedIn, children }: RoomModelProps) => {
  const { scene } = useGLTF('/living-room.glb', true); // Add true for priority loading
  const { camera, gl } = useThree();
  const raycaster = useRef(new Raycaster());
  const mousePosition = useRef(new Vector2());
  const groupRef = useRef<Group>(null);
  const targetRotation = useRef(new Vector2());
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);
  const sceneRef = useRef(scene);
  const rafId = useRef<number | null>(null);

  // Update scene reference when it changes
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  // Handle click/touch interaction with debounce for performance
  const handleInteraction = useCallback((event: MouseEvent | TouchEvent) => {
    if (isZoomedIn) return;

    const pos = 'touches' in event ? event.touches[0] : event;
    const { clientX, clientY } = pos;
    const { clientWidth, clientHeight } = gl.domElement;
    const x = (clientX / clientWidth) * 2 - 1;
    const y = -(clientY / clientHeight) * 2 + 1;

    mousePosition.current.set(x, y);
    raycaster.current.setFromCamera(mousePosition.current, camera);
    const intersects = raycaster.current.intersectObject(sceneRef.current, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const clickableNames = ['CoffeTable', 'Table', 'Scrapbook', 'Book'];
      
      if (clickableNames.some(name => clickedObject.name.includes(name))) {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          setIsZoomedIn(true);
          rafId.current = null;
        });
      }
    }
  }, [camera, gl, isZoomedIn, setIsZoomedIn]);

  // Setup event listeners
  useEffect(() => {
    const element = gl.domElement;
    const eventType = 'touchstart';
    
    element.addEventListener(eventType, handleInteraction as any);
    return () => {
      element.removeEventListener(eventType, handleInteraction as any);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [gl, handleInteraction]);

  // Handle parallax effect with throttling for performance
  const handleParallax = useCallback((event: MouseEvent | TouchEvent) => {
    if (isZoomedIn) {
      targetRotation.current.set(0, 0);
      return;
    }

    const pos = 'touches' in event ? event.touches[0] : event;
    const x = (pos.clientX / window.innerWidth - 0.5) * 2;
    const y = (pos.clientY / window.innerHeight - 0.5) * 2;
    
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      targetRotation.current.set(
        y * 0.03,
        x * 0.03
      );
      rafId.current = null;
    });
  }, [isZoomedIn]);

  // Setup parallax effect with throttle
  useEffect(() => {
    let lastCall = 0;
    let timeoutId: number | undefined;
    
    const throttledParallax = (event: any) => {
      const now = Date.now();
      if (now - lastCall < 16) return; // ~60fps
      lastCall = now;
      handleParallax(event);
    };

    const eventType = 'touchmove';
    window.addEventListener(eventType, throttledParallax as any);
    
    return () => {
      window.removeEventListener(eventType, throttledParallax as any);
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleParallax]);

  // Handle mobile optimization
  useEffect(() => {
    const currentScene = sceneRef.current;
    if (!currentScene) return;

    const updateMeshes = () => {
      currentScene.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    };

    // Use RAF to ensure this happens outside render
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      updateMeshes();
      rafId.current = null;
    });
    
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      {children}
    </group>
  );
});

// Main Room component
const Room = ({ onReady }: RoomProps) => {
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <Canvas
        camera={{
          position: [4, 6, 4] as [number, number, number],
          fov: 45
        }}
        shadows
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false
        }}
      >
        <Suspense fallback={<LoadingManager />}>
          <color attach="background" args={["#2a1e18"]} />
          <Environment preset="apartment" />
          <ambientLight intensity={0.5} />
          
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          
          <CameraController
            target={new Vector3(0, 1, 0)}
            isZoomedIn={isZoomedIn}
          />

          <RoomModelRefactored
            isZoomedIn={isZoomedIn}
            setIsZoomedIn={setIsZoomedIn}
          >
            <Scrapbook />
          </RoomModelRefactored>

          <ReadySignal onReady={onReady} />
        </Suspense>
      </Canvas>

      {isZoomedIn && (
        <Tooltip content="Return to room view" position="right">
          <button
            className="fixed top-4 left-4 z-10 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-md transition-colors duration-200 ease-in-out"
            onClick={() => setIsZoomedIn(false)}
            aria-label="Back to room"
          >
            Back to Room
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default Room;