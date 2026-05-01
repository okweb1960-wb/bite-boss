import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [users, sessions, shareEvents] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Session.list('-created_date', 500),
      base44.asServiceRole.entities.ShareEvent.list('-created_date', 1000),
    ]);

    // Basic session metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'results').length;
    const swipingSessions = sessions.filter(s => s.status === 'swiping').length;

    // Sessions per user
    const sessionsByUser = {};
    sessions.forEach(s => {
      const email = s.created_by || 'anonymous';
      sessionsByUser[email] = (sessionsByUser[email] || 0) + 1;
    });

    // Popular locations
    const locationCounts = {};
    sessions.forEach(s => {
      if (s.location_text) {
        locationCounts[s.location_text] = (locationCounts[s.location_text] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));

    // Sessions over time (last 30 days, grouped by day)
    const now = new Date();
    const dayCounts = {};
    sessions.forEach(s => {
      const d = new Date(s.created_date);
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        const key = d.toISOString().split('T')[0];
        dayCounts[key] = (dayCounts[key] || 0) + 1;
      }
    });
    const sessionsOverTime = Object.entries(dayCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return Response.json({
      users,
      stats: {
        totalUsers: users.length,
        totalSessions,
        completedSessions,
        swipingSessions,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        totalShares: shareEvents.length,
        winnerShares: shareEvents.filter(e => e.share_type === 'winner').length,
        maybesShares: shareEvents.filter(e => e.share_type === 'maybes_list').length,
      },
      sessionsByUser,
      topLocations,
      sessionsOverTime,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});