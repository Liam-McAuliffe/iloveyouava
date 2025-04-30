import { useState, useRef, useEffect, Suspense } from 'react'; // Added useEffect to imports
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
// Suspense is already imported
import Scrapbook from './Scrapbook';
import { Vector3, Raycaster, Vector2, Group } from 'three'; // Removed unused Mesh types

// Interface for props passed TO Room component from App
interface RoomProps {
  onReady?: () => void; // Callback function to signal when ready
  // Add setWelcomeMessage if Room needs to trigger it directly (alternative approach)
  // setWelcomeMessage?: (value: boolean) => void;
}

// Keep existing interfaces CameraControllerProps, RoomModelProps if needed elsewhere
// (Though RoomModelProps might overlap/be replaced by RoomProps depending on structure)
interface CameraControllerProps {
  target: Vector3;
  isZoomedIn: boolean;
  // Removed setIsZoomedIn as CameraController shouldn't control zoom state directly
}

interface RoomModelPropsInternal { // Renamed to avoid conflict if RoomModelProps is used externally
  setIsZoomedIn: (isZoomed: boolean) => void;
  children?: React.ReactNode;
}


// --- CameraController Component ---
// No changes needed here conceptually, but removed setIsZoomedIn prop
const CameraController = ({ target, isZoomedIn }: CameraControllerProps) => {
  const { camera } = useThree();
  const initialPosition = useRef(new Vector3(4, 4, 4));
  const zoomedPosition = useRef(new Vector3(0.0, 1.2, 0.6)); // Keep this

  useFrame(() => {
    const targetPosition = isZoomedIn ? zoomedPosition.current : initialPosition.current;
    camera.position.lerp(targetPosition, 0.05);
    if (isZoomedIn) {
       camera.lookAt(target); // Only lookAt target when zoomed
    } else {
       // Optionally, lerp lookAt back to origin or initial view target if needed
       camera.lookAt(0, 1, 0); // Example: look towards center of scene origin
    }
  });

  return null;
};


// --- RoomModel Component ---
// Simplified to focus on rendering and click handling
const RoomModel = ({ setIsZoomedIn, children }: RoomModelPropsInternal) => {
  const { scene } = useGLTF('/living-room.glb');
  const { camera, gl } = useThree();
  const raycaster = useRef(new Raycaster());
  const mousePosition = useRef(new Vector2());
  const groupRef = useRef<Group>(null);
  const targetRotation = useRef(new Vector2());
  const isZoomedInRef = useRef(false); // Local ref to track zoom for parallax

  // Mouse movement effect for parallax
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isZoomedInRef.current) return; // Use local ref

      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      targetRotation.current.set(y * 0.15, x * 0.15);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []); // Dependency array is empty, runs once

  // Smooth parallax rotation
  useFrame(() => {
    if (groupRef.current && !isZoomedInRef.current) { // Use local ref
      groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.05;
    }
  });

  // Click to zoom
  useEffect(() => {
      const handleClick = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        const { clientWidth, clientHeight } = gl.domElement;

        const x = (clientX / clientWidth) * 2 - 1;
        const y = -(clientY / clientHeight) * 2 + 1;
        mousePosition.current.set(x, y);

        raycaster.current.setFromCamera(mousePosition.current, camera);
        const intersects = raycaster.current.intersectObject(scene, true);

        if (intersects.length > 0) {
            const clickedObjectName = intersects[0].object.name;
            // Make click target more specific if needed (e.g., the scrapbook object name)
            if (clickedObjectName.includes('CoffeTable') || clickedObjectName.includes('Table') || clickedObjectName.includes('Scrapbook')) { // Example names
                setIsZoomedIn(true);
                isZoomedInRef.current = true; // Update local ref
                targetRotation.current.set(0, 0); // Reset parallax target
            }
        }
      };

      const currentElement = gl.domElement;
      currentElement.addEventListener('click', handleClick);

      return () => {
         currentElement.removeEventListener('click', handleClick);
      };
  }, [gl, camera, scene, setIsZoomedIn]); // Add dependencies


   // Effect to handle returning from zoom (resetting parallax)
   useEffect(() => {
     // This effect runs when isZoomedIn changes *in the parent*
     // We need a way to detect the change back to false.
     // The 'Back' button directly sets the parent state.
     // Let's simplify: the RoomModel doesn't need to track the parent's isZoomedIn state directly.
     // It just needs its *own* ref (`isZoomedInRef`) to disable parallax.
     // The parent component handles the actual state and button.
     // When the Back button is clicked, the PARENT sets isZoomedIn to false.
     // We just need to update our local ref when the zoom *happens*.

     // We can reset the local ref if the component somehow re-renders while NOT zoomed.
     // However, the click handler already sets it. The main issue is resetting parallax
     // smoothly when the "Back" button is pressed.
     // Let's handle the smooth rotation reset in the parent's onClick for the Back button.
   }, []); // Simplified dependency


  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      {children}
    </group>
  );
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
      // We need to reset the RoomModel's parallax ref here if possible,
      // or ensure the parallax effect correctly re-enables.
      // Currently, RoomModel uses its internal isZoomedInRef.
      // WhensetIsZoomedIn(false) happens, RoomModel doesn't automatically know.
      // This needs rethinking - maybe RoomModel should receive isZoomedIn as a prop too.

      // Let's pass isZoomedIn to RoomModel and remove its internal ref tracking.
  };


  // Let's refactor RoomModel to accept isZoomedIn prop
  // Remove RoomModelPropsInternal, use RoomModelProps interface

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

      useEffect(() => {
          const handleMouseMove = (event: MouseEvent) => {
              if (isZoomedIn) { // Use prop directly
                  // Optionally reset target rotation instantly when zoomed
                  targetRotation.current.set(0,0);
                  if (groupRef.current) {
                    groupRef.current.rotation.x = 0; // Snap back rotation? Or let lerp handle it?
                    groupRef.current.rotation.y = 0;
                  }
                  return;
              };
              const x = (event.clientX / window.innerWidth - 0.5) * 2;
              const y = (event.clientY / window.innerHeight - 0.5) * 2;
              targetRotation.current.set(y * 0.15, x * 0.15);
          };
          window.addEventListener('mousemove', handleMouseMove);
          return () => window.removeEventListener('mousemove', handleMouseMove);
      }, [isZoomedIn]); // Re-run if isZoomedIn changes

      useFrame(() => {
          if (groupRef.current) {
            // Lerp towards target rotation OR towards 0 if zoomed in
            const targetX = isZoomedIn ? 0 : targetRotation.current.x;
            const targetY = isZoomedIn ? 0 : targetRotation.current.y;
            groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
            groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
          }
      });

      useEffect(() => {
          const handleClick = (event: MouseEvent) => {
             if (isZoomedIn) return; // Don't re-trigger zoom if already zoomed

              const { clientX, clientY } = event;
              const { clientWidth, clientHeight } = gl.domElement;
              const x = (clientX / clientWidth) * 2 - 1;
              const y = -(clientY / clientHeight) * 2 + 1;
              mousePosition.current.set(x, y);
              raycaster.current.setFromCamera(mousePosition.current, camera);
              const intersects = raycaster.current.intersectObject(scene, true);
              if (intersects.length > 0) {
                  const clickedObjectName = intersects[0].object.name;
                  if (clickedObjectName.includes('CoffeTable') || clickedObjectName.includes('Table') || clickedObjectName.includes('Scrapbook')) {
                      setIsZoomedIn(true); // Call parent state setter
                  }
              }
          };
          const currentElement = gl.domElement;
          currentElement.addEventListener('click', handleClick);
          return () => {
             currentElement.removeEventListener('click', handleClick);
          };
      }, [gl, camera, scene, setIsZoomedIn, isZoomedIn]); // Add isZoomedIn dependency

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
        camera={{ position: [4, 3, 4], fov: 50 }}
        shadows
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#2a1e18"]} />
          <Environment preset="apartment" />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />

          <CameraController target={tablePosition.current} isZoomedIn={isZoomedIn} />

          {/* Use the refactored RoomModel */}
          <RoomModelRefactored isZoomedIn={isZoomedIn} setIsZoomedIn={setIsZoomedIn}>
             {/* Render Scrapbook only when zoomed in? Or always present? */}
             {/* Assuming Scrapbook is always present but maybe only interactive when zoomed */}
             <Scrapbook />
          </RoomModelRefactored>

          {/* Signal readiness after Suspense resolves */}
          <ReadySignal onReady={onReady} />
        </Suspense>
      </Canvas>

      {/* Back button using handleBackToRoom */}
      {isZoomedIn && (
        <button
          className="fixed top-4 left-4 z-10 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-md back-to-room-btn"
          onClick={handleBackToRoom} // Use the handler
        >
          Back to Room
        </button>
      )}
    </div>
  );
};

export default Room;