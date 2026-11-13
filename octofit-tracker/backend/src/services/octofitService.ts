import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function invalidInput(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): never {
  throw Object.assign(new Error(message), { status: 404 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) invalidInput('Activity body must be an object');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) invalidInput('A valid userId is required');
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) invalidInput('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) invalidInput('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) invalidInput('Minutes must be a positive number');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) invalidInput('User does not exist');
  if (!team) invalidInput('Team does not exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) invalidInput('Team body must be an object');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) invalidInput('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) invalidInput('Team mascot is required');
  if (!Array.isArray(members)) {
    invalidInput('Team members must be valid user IDs');
  }
  const memberIds = members.filter((member): member is string => typeof member === 'string' && Types.ObjectId.isValid(member));
  if (memberIds.length !== members.length) invalidInput('Team members must be valid user IDs');
  const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
  if (existingMembers !== new Set(memberIds).size) invalidInput('One or more team members do not exist');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string): string {
  const normalizedType = type.toLowerCase();
  if (['run', 'cycle', 'walk'].includes(normalizedType)) return 'endurance';
  if (['strength', 'weights'].includes(normalizedType)) return 'strength';
  if (['yoga', 'stretch'].includes(normalizedType)) return 'mobility';
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) notFound('User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).select('type').lean();
  const activityFocus = recentActivity ? focusForActivity(recentActivity.type) : undefined;
  const focusCandidates = [...new Set([activityFocus, user.fitnessGoal].filter((focus): focus is string => Boolean(focus)))];
  const matchingResults = await Promise.all(focusCandidates.map(async (focus) => ({
    focus,
    workouts: await Workout.find({ focus }).sort({ title: 1 }).lean(),
  })));
  const match = matchingResults.find(({ workouts }) => workouts.length > 0);
  const workouts = match?.workouts ?? await Workout.find().sort({ title: 1 }).lean();

  return workouts.map((workout) => ({
    ...workout,
    reason: workout.focus === activityFocus
      ? `Recommended because your recent ${recentActivity?.type} activity aligns with ${activityFocus}.`
      : workout.focus === user.fitnessGoal
        ? `Recommended because it supports your ${user.fitnessGoal} fitness goal.`
        : `Suggested as an alternative for your ${user.fitnessGoal} fitness goal.`,
  }));
}

export { User };
