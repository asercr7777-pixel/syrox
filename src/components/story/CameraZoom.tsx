import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CameraZoomProps {
  zoom: number;
  children: ReactNode;
  panX?: number;
  panY?: number;
}

export function CameraZoom({ zoom, children, panX = 0, panY = 0 }: CameraZoomProps) {
  return (
    <motion.div
      animate={{
        scale: zoom,
        x: panX,
        y: panY,
      }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      style={{ transformOrigin: 'center center' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
