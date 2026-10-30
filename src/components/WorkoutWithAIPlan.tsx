import { TrainingCommand } from './TrainingCommand';
import { WeeklyTrainingProgram } from './WeeklyTrainingProgram';

export function WorkoutWithAIPlan() {
  return <>
    <WeeklyTrainingProgram />
    <TrainingCommand />
  </>;
}

export default WorkoutWithAIPlan;
