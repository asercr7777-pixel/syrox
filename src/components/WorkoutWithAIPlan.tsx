import { useEffect } from 'react';
import { SixDayWorkout } from './SixDayWorkout';

export function WorkoutWithAIPlan() {
  useEffect(() => {
    const enableAddExercise = () => {
      document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        if (button.textContent?.replace(/\s+/g, ' ').trim().includes('Add Exercise')) {
          button.disabled = false;
        }
      });
    };
    enableAddExercise();
    const observer = new MutationObserver(enableAddExercise);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });
    return () => observer.disconnect();
  }, []);

  return <SixDayWorkout />;
}
