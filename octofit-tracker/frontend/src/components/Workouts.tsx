import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

function renderWorkout(workout: WorkoutSuggestion) {
  const details = [
    workout.focus,
    typeof workout.minutes === 'number' ? `${workout.minutes} min` : undefined,
    workout.difficulty,
  ].filter((detail): detail is string => Boolean(detail)).join(' · ');

  return (
    <>
      <strong>{workout.title}</strong>
      {details && <span> — {details}</span>}
      {workout.reason && <span> — {workout.reason}</span>}
    </>
  );
}

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions available."
      load={() => getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`).then(({ suggestions }) => suggestions)}
      renderItem={renderWorkout}
    />
  );
}
