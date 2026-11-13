import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      load={() => getJson<{ teams: Team[] }>('/api/teams').then(({ teams }) => teams)}
      renderItem={(team) => `${team.name} (${team.mascot ?? 'No mascot'}) · ${team.members.length} members`}
    />
  );
}
