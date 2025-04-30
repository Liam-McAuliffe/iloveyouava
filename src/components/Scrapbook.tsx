import { useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { Group, Mesh, Vector2, Raycaster, LoopOnce } from 'three'

interface ScrapbookProps {
  // Optional props can be added later
}

const Scrapbook = ({}: ScrapbookProps) => {
  const bookRef = useRef<Group>(null)
  const { scene, nodes, materials, animations } = useGLTF('/scrap-book.glb')
  const { actions, mixer } = useAnimations(animations, bookRef)
  const { camera, gl } = useThree()
  
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const raycaster = useRef(new Raycaster())
  const mouse = useRef(new Vector2())

  // Apply materials from the Blender model
  useEffect(() => {
    if (scene && materials.Cover && materials.Page) {
      console.log('Found materials:', materials);
      
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          // Apply the correct material based on object name
          if (object.name.includes('BookCover')) {
            object.material = materials.Cover;
          } else if (object.name.includes('Page')) {
            object.material = materials.Page;
          }
          
          // Enable shadows
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    }
  }, [scene, materials]);

  // Handle book animations
  useEffect(() => {
    if (animations && actions) {
      // Set up animations
      console.log('Available animations:', Object.keys(actions));
      
      // Configure animation settings
      Object.values(actions).forEach(action => {
        if (action) {
          action.clampWhenFinished = true;
          action.setLoop(LoopOnce, 0);
        }
      });
    }
  }, [animations, actions]);

  // Handle click on book to turn pages
  const handleClick = (event: MouseEvent) => {
    if (isAnimating) return;
    
    // Calculate mouse position
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);
    
    // Check for intersections with the book
    const intersects = bookRef.current 
      ? raycaster.current.intersectObject(bookRef.current, true)
      : [];
    
    if (intersects.length > 0) {
      console.log('Clicked on book part:', intersects[0].object.name);
      playNextPageAnimation();
    }
  };
  
  // Setup click listener
  useEffect(() => {
    const handleClickWrapper = (event: MouseEvent) => {
      handleClick(event);
    };
    
    gl.domElement.addEventListener('click', handleClickWrapper);
    
    return () => {
      gl.domElement.removeEventListener('click', handleClickWrapper);
    };
  }, [gl, currentPage, isAnimating]);
  
  // Animation
  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });
  
  // Function to play the next page animation
  const playNextPageAnimation = () => {
    if (isAnimating) return;
    
    let actionToPlay = null;
    
    // Determine which animation to play based on current page
    if (currentPage === 0) {
      actionToPlay = actions['BookCover_TopAction'];
    } else if (currentPage >= 1 && currentPage <= 5) {
      actionToPlay = actions[`Page_${currentPage}Action`];
    }
    
    if (actionToPlay) {
      console.log(`Playing animation: ${currentPage === 0 ? 'Cover' : `Page ${currentPage}`}`);
      setIsAnimating(true);
      
      // Reset and play the animation
      actionToPlay
        .reset()
        .setLoop(LoopOnce, 0)
        .play();
      
      // Handle animation completion
      const onFinished = () => {
        setCurrentPage(prev => prev + 1);
        setIsAnimating(false);
        mixer.removeEventListener('finished', onFinished);
      };
      
      mixer.addEventListener('finished', onFinished);
    }
  };

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

export default Scrapbook 