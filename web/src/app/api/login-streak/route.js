import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// POST /api/login-streak - record daily login and update streak
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Insert stamp (ignore if already exists today)
    await sql`
      INSERT INTO daily_stamps (user_id, stamp_date)
      VALUES (${userId}, CURRENT_DATE)
      ON CONFLICT (user_id, stamp_date) DO NOTHING
    `;

    // Get current streak row
    const streakRows = await sql`
      SELECT * FROM login_streaks WHERE user_id = ${userId}
    `;

    if (!streakRows.length) {
      // First login ever
      const result = await sql`
        INSERT INTO login_streaks (user_id, current_streak, longest_streak, last_login_date)
        VALUES (${userId}, 1, 1, CURRENT_DATE)
        RETURNING *
      `;
      return Response.json({ streak: result[0], isNew: true });
    }

    const streak = streakRows[0];
    const lastDate = new Date(streak.last_login_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already logged in today, no change
      return Response.json({ streak, alreadyLogged: true });
    }

    let newStreak;
    if (diffDays === 1) {
      // Consecutive day - increment
      newStreak = streak.current_streak + 1;
    } else {
      // Gap - reset
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, streak.longest_streak);

    const result = await sql`
      UPDATE login_streaks
      SET
        current_streak = ${newStreak},
        longest_streak = ${newLongest},
        last_login_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    return Response.json({ streak: result[0], newStreak });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/login-streak - get current streak info
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT * FROM login_streaks WHERE user_id = ${session.user.id}
    `;
    return Response.json(rows[0] || { current_streak: 0, longest_streak: 0 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
