import { useRef, useEffect, useState, useCallback } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
// Import specific types from 'three', including AnimationAction
import {
  Group,
  Mesh,
  Vector2,
  Raycaster,
  LoopOnce,
  AnimationMixer,
  type AnimationAction // Use 'type' for type-only imports
} from 'three';

interface ScrapbookProps {
  // Optional props can be added later if needed
}

const Scrapbook = ({}: ScrapbookProps) => {
  const bookRef = useRef<Group>(null);
  const { scene, materials, animations } = useGLTF('/scrap-book.glb'); // Ensure this path is correct
  const { actions, mixer } = useAnimations(animations, bookRef);
  const { camera, gl } = useThree();

  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());

  // Calculate total number of pages based on detected animations
  const totalPages = animations.filter(anim => anim.name.startsWith('Page_')).length;
  const hasCoverAnimation = animations.some(anim => anim.name.includes('BookCover'));

  // Apply materials and shadows from the Blender model
  useEffect(() => {
    if (scene && materials) {
      console.log('Applying materials:', Object.keys(materials));
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          if (object.name.includes('BookCover') && materials.Cover) {
            object.material = materials.Cover;
          } else if (object.name.startsWith('Page') && materials.Page) {
            object.material = materials.Page;
          }
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    } else {
        console.warn("Scene or materials not found/loaded correctly for Scrapbook.");
    }
  }, [scene, materials]);

  // --- MOVED this definition BEFORE the useEffect that uses it ---
  // Function to determine and play the correct animation
  const playNextPageAnimation = useCallback(() => {
    if (isAnimating || !actions) return;

    let actionName: string | null = null;
    if (currentPage === 0 && hasCoverAnimation && actions['BookCover_TopAction']) {
        actionName = 'BookCover_TopAction';
    } else if (currentPage > 0 && actions[`Page_${currentPage}Action`]) {
        actionName = `Page_${currentPage}Action`;
    }

    const actionToPlay = actionName ? actions[actionName] : null;

    if (actionToPlay) {
       console.log(`Attempting to play animation: ${actionName} for page ${currentPage}`);
       setIsAnimating(true);
       actionToPlay.reset().play();
    } else {
        console.log(`No animation found for page ${currentPage} or action name ${actionName}`);
        // Reset to page 0 if no next animation found (or handle differently)
        setCurrentPage(0);
        // Optionally play closing animation if applicable
    }
  }, [isAnimating, actions, currentPage, hasCoverAnimation, mixer, setIsAnimating, setCurrentPage]);
  // --- End of moved block ---

  // Handle book animations setup and 'finished' listener
  useEffect(() => {
    if (mixer && actions && Object.keys(actions).length > 0) {
      console.log('Available scrapbook animations:', Object.keys(actions));

      Object.values(actions).forEach(action => {
        if (action) {
          action.clampWhenFinished = true;
          action.setLoop(LoopOnce, 1);
        }
      });

      // Use the imported AnimationAction type here
      const onFinished = (event: { action: AnimationAction }) => {
         console.log(`Animation finished: ${event.action.getClip().name}`);
         const actionName = event.action.getClip().name;
         if (actionName.includes('BookCover') || actionName.startsWith('Page_')) {
             setCurrentPage(prev => {
                 const nextPage = prev + 1;
                 const effectiveTotalPages = hasCoverAnimation ? totalPages + 1 : totalPages;
                 return nextPage >= effectiveTotalPages ? 0 : nextPage; // Loop back
             });
         }
         setIsAnimating(false);
      };

      mixer.addEventListener('finished', onFinished);

      return () => {
        mixer.removeEventListener('finished', onFinished);
      };
    }
  }, [actions, mixer, totalPages, hasCoverAnimation]); // Dependencies

  // Handle click on book to turn pages
  const handleClick = useCallback((event: MouseEvent) => { // Wrap handleClick in useCallback
    if (isAnimating || !bookRef.current) return;

    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObject(bookRef.current, true);

    if (intersects.length > 0) {
       console.log('Clicked on book part:', intersects[0].object.name, 'at page:', currentPage);
       playNextPageAnimation();
    }
  // Add dependencies to useCallback for handleClick
  }, [gl, camera, isAnimating, currentPage, playNextPageAnimation]);

  // Setup click listener for the canvas
  useEffect(() => {
    const domElement = gl.domElement;
    // Pass the memoized handleClick
    domElement.addEventListener('click', handleClick);

    return () => {
      domElement.removeEventListener('click', handleClick);
    };
  // Dependency array now includes the stable handleClick reference
  }, [gl, handleClick]);

  // Animation loop update
  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });

  return (
    <group
      ref={bookRef}
      position={[0, 0.575, 0.25]}
      scale={[0.15, 0.15, 0.15]}
      rotation={[0, 0, 0]}
    >
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload('/scrap-book.glb');

export default Scrapbook;