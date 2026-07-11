import { Modal } from './Modal';
import { triggerConfetti } from './Confetti';
import type { DropResult } from '../../store/types';
import { RARITY_META } from '../../data/collections';
import { useEffect } from 'react';

interface RewardModalProps {
  drops: DropResult[];
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function RewardModal({ drops, open, onClose, title = 'Rewards Earned' }: RewardModalProps) {
  useEffect(() => {
    if (open && drops.length > 0) {
      triggerConfetti(80);
    }
  }, [open, drops.length]);

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="space-y-3">
        {drops.length === 0 && <p className="text-ink-300 text-sm">No rewards this time.</p>}
        {drops.map((d, i) => {
          const meta = d.rarity ? RARITY_META[d.rarity] : null;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border bg-ink-950/50 animate-slide-up"
              style={{ borderColor: meta?.color ?? '#3a4159', animationDelay: `${i * 80}ms` }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{
                  background: `radial-gradient(circle, ${meta?.color ?? '#3a4159'}40, transparent 70%)`,
                  boxShadow: `0 0 20px ${meta?.glow ?? 'transparent'}`,
                }}
              >
                {d.type === 'aura' ? '✨' : d.type === 'weapon' ? '⚔️' : d.type === 'title' ? '🏷️' : d.type === 'shield' ? '🛡️' : d.type === 'badge' ? '🏅' : '🎁'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{d.label}</p>
                {meta && (
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <button onClick={onClose} className="btn-primary w-full mt-2">Claim</button>
      </div>
    </Modal>
  );
}
