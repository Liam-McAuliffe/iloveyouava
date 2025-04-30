# I Love You Ava - Interactive 3D Scrapbook

A romantic interactive web experience featuring a 3D scrapbook in a cozy isometric room.

## Features

- 3D isometric room built with Three.js and React Three Fiber
- Interactive scrapbook with 5 pages
- Beautiful animations and transitions
- Romantic background music
- Responsive design with Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Blender (for 3D model creation)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/components/Room.tsx` - Main 3D scene component
- `src/components/Scrapbook.tsx` - Interactive scrapbook component
- `public/book.glb` - 3D model of the scrapbook (to be created in Blender)
- `public/background-music.mp3` - Background music file

## Creating the 3D Model

1. Create a low-poly isometric room in Blender
2. Model the scrapbook and its pages
3. Export as GLB format to `public/book.glb`

## Adding Content

1. Add your photos to the `public/images` directory
2. Update the scrapbook pages in `Scrapbook.tsx`
3. Add your personal messages and stickers

## Building for Production

```bash
npm run build
```

## License

MIT
