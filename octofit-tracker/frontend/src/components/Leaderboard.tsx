import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardItem = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getJson<{ leaderboard?: LeaderboardItem[] }>('/api/leaderboard');
        if (active) {
          setRows(response.leaderboard ?? []);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Unable to load leaderboard');
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
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error ?? undefined}
      emptyMessage="No leaderboard"
    >
      {!loading && !error && rows.length > 0 ? (
        <ol className="mb-0 ps-3">
          {rows.map((row, index) => (
            <li key={`${row.teamName ?? 'team'}-${index}`}>
              #{row.rank ?? index + 1} {row.teamName ?? 'Team'} — {row.totalPoints ?? 0} points
            </li>
          ))}
        </ol>
      ) : null}
    </CapabilityCard>
  );
}
