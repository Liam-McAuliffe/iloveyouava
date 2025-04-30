import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import Scrapbook from './Scrapbook'; // Ensure this path is correct

import { Vector3, Raycaster, Vector2, Group, Mesh } from 'three';

// Interface for props passed TO Room component from App
interface RoomProps {
  onReady?: () => void;
}


// Interface for props passed TO Room component from App
interface RoomProps {
  onReady?: () => void; // Callback function to signal when ready
}

// Interface for CameraController props
interface CameraControllerProps {
  target: Vector3;
  isZoomedIn: boolean;
}

// --- CameraController Component ---
const CameraController = ({ target, isZoomedIn }: CameraControllerProps) => {
  const { camera } = useThree();
  const initialPosition = useRef(new Vector3(4, 4, 4)); // Keep initial position
  const zoomedPosition = useRef(new Vector3(0.0, 1.2, 0.6)); // Keep zoomed position
  const isAnimating = useRef(false);
  const animationStartTime = useRef(0);

  useFrame((state) => {
    const targetPosition = isZoomedIn ? zoomedPosition.current : initialPosition.current;
    
    // Calculate eased lerp factor based on animation progress
    if (!isAnimating.current) {
      isAnimating.current = true;
      animationStartTime.current = state.clock.elapsedTime;
    }
    
    const animationDuration = 1.0; // 1 second animation
    const elapsed = state.clock.elapsedTime - animationStartTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Ease in-out function for smoother animation
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const easedProgress = easeInOut(progress);
    
    // Use eased progress for lerp
    camera.position.lerpVectors(camera.position, targetPosition, easedProgress);

    // Smoothly interpolate camera lookAt target
    const lookAtTarget = new Vector3();
    const currentLookAt = new Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10);
    currentLookAt.add(camera.position);

    const finalLookAt = isZoomedIn ? target : new Vector3(0, 1, 0);
    lookAtTarget.lerpVectors(currentLookAt, finalLookAt, easedProgress);
    camera.lookAt(lookAtTarget);

    // Reset animation state when complete
    if (progress >= 1) {
      isAnimating.current = false;
    }
  });

  return null;
};


// --- Helper component to signal readiness ---
const ReadySignal = ({ onReady }: { onReady?: () => void }) => {
  useEffect(() => {
    // This useEffect runs only *after* all sibling Suspense dependencies are resolved
    if (onReady) {
      console.log("Suspense resolved, calling onReady..."); // Debug log
      onReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount (after Suspense resolves)

  return null; // Doesn't render anything visible
};

// --- Main Room Component ---
const Room = ({ onReady }: RoomProps) => { // Accept onReady prop
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const tablePosition = useRef(new Vector3(0.0, 0.45, 0.0)); // Target for camera zoom

  const handleBackToRoom = () => {
      setIsZoomedIn(false);
      // Parallax effect will automatically re-enable in RoomModelRefactored
      // because its behavior depends on the isZoomedIn prop.
  };

  // Interface for RoomModelRefactored props
  interface RoomModelProps {
      isZoomedIn: boolean; // Receive zoom state from parent
      setIsZoomedIn: (isZoomed: boolean) => void; // Keep function to trigger zoom
      children?: React.ReactNode;
  }

  // --- Refactored RoomModel ---
  const RoomModelRefactored = ({ isZoomedIn, setIsZoomedIn, children }: RoomModelProps) => {
      const { scene } = useGLTF('/living-room.glb');
      const { camera, gl } = useThree();
      const raycaster = useRef(new Raycaster());
      const mousePosition = useRef(new Vector2());
      const groupRef = useRef<Group>(null);
      const targetRotation = useRef(new Vector2());

      // Parallax effect based on mouse movement
      useEffect(() => {
          const handleMouseMove = (event: MouseEvent) => {
              // Check if the event originated from the volume control
              const volumeControl = document.querySelector('.volume-control');
              if (volumeControl && volumeControl.contains(event.target as Node)) {
                  return;
              }

              if (isZoomedIn) {
                  targetRotation.current.set(0,0);
                  return;
              };
              const x = (event.clientX / window.innerWidth - 0.5) * 2;
              const y = (event.clientY / window.innerHeight - 0.5) * 2;
              targetRotation.current.set(y * 0.03, x * 0.03);
          };
          window.addEventListener('mousemove', handleMouseMove);
          return () => window.removeEventListener('mousemove', handleMouseMove);
      }, [isZoomedIn]);

      // Handle click to zoom in
      useEffect(() => {
          const handleClick = (event: MouseEvent) => {
              // Check if the event originated from the volume control
              const volumeControl = document.querySelector('.volume-control');
              if (volumeControl && volumeControl.contains(event.target as Node)) {
                  return;
              }

              if (isZoomedIn) return;

              const { clientX, clientY } = event;
              const { clientWidth, clientHeight } = gl.domElement;
              const x = (clientX / clientWidth) * 2 - 1;
              const y = -(clientY / clientHeight) * 2 + 1;
              mousePosition.current.set(x, y);
              raycaster.current.setFromCamera(mousePosition.current, camera);
              const intersects = raycaster.current.intersectObject(scene, true);

              if (intersects.length > 0) {
                  const clickedObjectName = intersects[0].object.name;
                  const clickableNames = ['CoffeTable', 'Table', 'Scrapbook', 'Book'];
                  if (clickableNames.some(name => clickedObjectName.includes(name))) {
                      setIsZoomedIn(true);
                  }
              }
          };
          const currentElement = gl.domElement;
          currentElement.addEventListener('click', handleClick);
          return () => {
              currentElement.removeEventListener('click', handleClick);
          };
      }, [gl, camera, scene, setIsZoomedIn, isZoomedIn]);

      // Apply scene properties recursively
      useEffect(() => {
          scene.traverse((object) => {
              // Enable shadows for all meshes in the loaded model
              if (object instanceof Mesh) {
                  object.castShadow = true;
                  object.receiveShadow = true;
              }
          });
      }, [scene]);


      return (
          <group ref={groupRef}>
              <primitive object={scene} />
              {children}
          </group>
      );
  };


  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <Canvas
        camera={{ position: [4, 3, 4], fov: 50 }} // Initial camera settings
        shadows // Enable shadows
        gl={{ antialias: true }} // Enable anti-aliasing
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}> {/* Suspense for loading assets */}
          <color attach="background" args={["#2a1e18"]} /> {/* Background color */}
          <Environment preset="apartment" /> {/* Environment lighting */}
          <ambientLight intensity={0.5} /> {/* Ambient light */}
          {/* Directional light for shadows */}
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024} // Shadow map resolution
            shadow-mapSize-height={1024}
            shadow-camera-far={50} // Shadow camera properties
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          {/* Additional fill light */}
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Camera controller component */}
          <CameraController target={tablePosition.current} isZoomedIn={isZoomedIn} />

          {/* The main room model */}
          <RoomModelRefactored isZoomedIn={isZoomedIn} setIsZoomedIn={setIsZoomedIn}>
            {/* Scrapbook is now always rendered as a child */}
            <Scrapbook />
          </RoomModelRefactored>

          {/* Signal readiness after Suspense resolves */}
          <ReadySignal onReady={onReady} />
        </Suspense>
      </Canvas>

      {/* Back button appears only when zoomed in */}
      {isZoomedIn && (
        <button
          className="fixed top-4 left-4 z-10 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-md back-to-room-btn"
          onClick={handleBackToRoom} // Use the handler to zoom out
        >
          Back to Room
        </button>
      )}
    </div>
  );
};

// Ensure the component is exported
export default Room;