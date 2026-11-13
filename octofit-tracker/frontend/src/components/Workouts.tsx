import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; reason?: string };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions available."
      load={() => getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`).then(({ suggestions }) => suggestions)}
      renderItem={(workout) => <><strong>{workout.title}</strong>{workout.reason && <span> — {workout.reason}</span>}</>}
    />
  );
}
