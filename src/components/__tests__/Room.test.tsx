import { render, screen } from '@testing-library/react';
import Room from '../Room';

// Mock Three.js components and hooks
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useThree: () => ({
    camera: {
      position: { set: jest.fn() },
      lookAt: jest.fn()
    },
    gl: {
      domElement: document.createElement('div')
    }
  }),
  useFrame: jest.fn()
}));

jest.mock('@react-three/drei', () => ({
  useGLTF: () => ({
    scene: {
      clone: () => ({
        traverse: jest.fn()
      })
    }
  }),
  Environment: () => null,
  useProgress: () => ({ progress: 100 })
}));

describe('Room Component', () => {
  it('renders loading state initially', () => {
    render(<Room onReady={() => {}} />);
    expect(screen.getByText(/Loading 3D Environment/i)).toBeInTheDocument();
  });

  it('renders back button when zoomed in', () => {
    render(<Room onReady={() => {}} />);
    const backButton = screen.getByText(/Back to Room/i);
    expect(backButton).toBeInTheDocument();
    expect(screen.getByText(/Return to room view/i)).toBeInTheDocument();
  });
}); 