import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard scores yet."
      load={() => getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard').then(({ leaderboard }) => leaderboard)}
      renderItem={(entry) => `#${entry.rank} ${entry.teamName} · ${entry.totalPoints} points`}
    />
  );
}
