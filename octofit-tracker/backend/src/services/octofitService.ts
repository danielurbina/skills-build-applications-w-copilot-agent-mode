import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function invalidObjectId(value: unknown): boolean {
  return typeof value !== 'string' || !mongoose.isValidObjectId(value);
}

function normalizeReason(match: string, context: string) {
  return `Matches your ${match} focus because of your recent ${context} activity.`;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Activity payload is required');
  }

  const payload = input as Record<string, unknown>;
  const userId = getString(payload.userId);
  const teamId = getString(payload.teamId);
  const type = getString(payload.type);
  const minutes = Number(payload.minutes);

  if (!userId || invalidObjectId(userId) || !teamId || invalidObjectId(teamId) || !type || !Number.isFinite(minutes) || minutes <= 0) {
    throw new HttpError(400, 'Activity requires a valid userId, teamId, type, and positive minutes');
  }

  const userExists = await User.exists({ _id: userId });
  const teamExists = await Team.exists({ _id: teamId });
  if (!userExists || !teamExists) {
    throw new HttpError(400, 'Activity references a user or team that does not exist');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Team payload is required');
  }

  const payload = input as Record<string, unknown>;
  const name = getString(payload.name);
  const mascot = getString(payload.mascot);
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];

  if (!name) {
    throw new HttpError(400, 'Team name is required');
  }
  if (!mascot) {
    throw new HttpError(400, 'Team mascot is required');
  }

  const members = rawMembers.filter((member) => typeof member === 'string' && mongoose.isValidObjectId(member));
  if (rawMembers.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw new HttpError(400, 'All team members must be valid ObjectIds');
  }

  const team = await Team.create({
    name,
    mascot,
    members: members.map((member) => new mongoose.Types.ObjectId(member)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = getString(userEmail)?.toLowerCase();
  if (!normalizedEmail) {
    throw new HttpError(404, 'User not found');
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypes = recentActivities.map((activity) => String(activity.type).trim().toLowerCase()).filter(Boolean);
  const goal = String(user.fitnessGoal ?? '').trim().toLowerCase();

  const workouts = await Workout.find().lean();
  if (!workouts.length) {
    return [];
  }

  const scored = workouts.map((workout) => {
    const focus = String(workout.focus ?? '').trim().toLowerCase();
    let score = 0;
    if (goal && focus === goal) score += 3;
    if (recentTypes.includes(focus)) score += 2;
    if (focus === 'strength' && goal === 'strength') score += 1;
    if (focus === 'endurance' && goal === 'endurance') score += 1;

    const matchType = score >= 3 ? (goal && focus === goal ? 'goal' : 'recent activity') : 'recent activity';
    const reason = matchType === 'goal'
      ? `Matches your ${focus} goal and supports your training plan.`
      : normalizeReason(focus || 'workout', recentTypes[0] ?? 'latest');

    return { workout, score, reason };
  });

  scored.sort((a, b) => b.score - a.score || a.workout.title.localeCompare(b.workout.title));

  return scored.map(({ workout, reason }) => ({
    ...workout,
    reason,
  }));
}

export { User };
