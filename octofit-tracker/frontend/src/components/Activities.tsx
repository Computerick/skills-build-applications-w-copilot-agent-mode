import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      emptyMessage="No activities yet."
      load={() => getJson<{ activities: Activity[] }>('/api/activities').then(({ activities }) => activities)}
      renderItem={(activity) => `${activity.type} · ${activity.minutes} minutes · ${activity.points} points`}
    />
  );
}
