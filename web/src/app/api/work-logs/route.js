import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await sql`
      SELECT 
        logged_at as date,
        SUM(duration_seconds) as total_seconds
      FROM work_logs
      WHERE user_id = ${session.user.id}
      GROUP BY logged_at
      ORDER BY logged_at DESC
      LIMIT 30
    `;
    return Response.json(logs);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { project_id, duration_seconds } = body;

    const result = await sql`
      INSERT INTO work_logs (user_id, project_id, duration_seconds)
      VALUES (${session.user.id}, ${project_id}, ${duration_seconds})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
