import { useEffect, useState, useRef } from 'react';

interface ScreenShakeProps {
  trigger: number;
  intensity?: number;
  children: React.ReactNode;
}

export function ScreenShake({ trigger, intensity = 10, children }: ScreenShakeProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    if (trigger === 0) return;

    let frames = 0;
    const maxFrames = 15;
    const shake = () => {
      if (frames >= maxFrames) {
        setOffset({ x: 0, y: 0 });
        return;
      }
      const decay = 1 - frames / maxFrames;
      setOffset({
        x: (Math.random() - 0.5) * intensity * decay,
        y: (Math.random() - 0.5) * intensity * decay,
      });
      frames++;
      requestAnimationFrame(shake);
    };
    shake();
  }, [trigger, intensity]);

  return (
    <div
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.05s ease-out',
      }}
    >
      {children}
    </div>
  );
}
