import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/calendar - get all events, deadlines, and stamps for the user
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Custom events
    const events = await sql`
      SELECT 
        ce.id,
        ce.title,
        ce.event_date,
        ce.event_type,
        ce.color,
        ce.project_id,
        p.title as project_title
      FROM calendar_events ce
      LEFT JOIN projects p ON p.id = ce.project_id
      WHERE ce.user_id = ${session.user.id}
      ORDER BY ce.event_date ASC
    `;

    // Project deadlines (auto-generated)
    const deadlines = await sql`
      SELECT 
        id,
        title,
        deadline as event_date,
        'deadline' as event_type,
        '#E53E3E' as color
      FROM projects
      WHERE user_id = ${session.user.id}
        AND deadline IS NOT NULL
      ORDER BY deadline ASC
    `;

    // Daily stamps
    const stamps = await sql`
      SELECT stamp_date as event_date
      FROM daily_stamps
      WHERE user_id = ${session.user.id}
      ORDER BY stamp_date DESC
    `;

    // Login streak
    const streakRows = await sql`
      SELECT current_streak, longest_streak, last_login_date
      FROM login_streaks
      WHERE user_id = ${session.user.id}
    `;

    return Response.json({
      events,
      deadlines,
      stamps: stamps.map((s) => s.event_date),
      streak: streakRows[0] || { current_streak: 0, longest_streak: 0 },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/calendar - create a new event
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, event_date, event_type, color, project_id } =
      await request.json();

    if (!title || !event_date) {
      return Response.json(
        { error: "title and event_date are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO calendar_events (user_id, project_id, title, event_date, event_type, color)
      VALUES (
        ${session.user.id},
        ${project_id || null},
        ${title},
        ${event_date},
        ${event_type || "custom"},
        ${color || "#4A90E2"}
      )
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
