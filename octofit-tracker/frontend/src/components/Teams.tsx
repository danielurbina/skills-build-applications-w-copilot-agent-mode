import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = {
  name?: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getJson<{ teams?: TeamItem[] }>('/api/teams');
        if (active) {
          setTeams(response.teams ?? []);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Unable to load teams');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error ?? undefined}
      emptyMessage="No teams"
    >
      {!loading && !error && teams.length > 0 ? (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li className="list-group-item" key={`${team.name ?? 'team'}-${index}`}>
              <strong>{team.name ?? 'Team'}</strong> ({team.mascot ?? 'Mascot'})
              <div>{(team.members ?? []).join(', ') || 'No members yet'}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
