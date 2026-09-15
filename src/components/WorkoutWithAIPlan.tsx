import { Workout2 } from './Workout2';
import { WorkoutDayPlanBar } from './WorkoutDayPlanBar';
import './workout-spacing.css';
import './workout-six-day.css';

export function WorkoutWithAIPlan() {
  return (
    <>
      <WorkoutDayPlanBar />
      <Workout2 />
    </>
  );
}
