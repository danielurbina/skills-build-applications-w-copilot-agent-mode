import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutItem = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getJson<{ suggestions?: WorkoutItem[] }>('/api/workouts/suggestions/mona@example.com');
        if (active) {
          setWorkouts(response.suggestions ?? []);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Unable to load workouts');
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error ?? undefined}
      emptyMessage="No workout suggestions"
    >
      {!loading && !error && workouts.length > 0 ? (
        <ul className="list-group list-group-flush">
          {workouts.map((workout, index) => (
            <li className="list-group-item" key={`${workout.title ?? 'workout'}-${index}`}>
              <strong>{workout.title ?? 'Workout'}</strong>
              <div>{workout.focus ?? 'General'} · {workout.reason ?? 'Recommended for your goals'}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
