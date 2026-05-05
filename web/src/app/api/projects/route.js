import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await sql`
      SELECT * FROM projects 
      WHERE user_id = ${session.user.id} 
      ORDER BY created_at DESC
    `;
    return Response.json(projects);
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
    const { title, total_pages, start_date, deadline } = body;

    const result = await sql`
      INSERT INTO projects (user_id, title, total_pages, start_date, deadline)
      VALUES (${session.user.id}, ${title}, ${total_pages}, ${start_date}, ${deadline})
      RETURNING *
    `;

    // Initialize page progress
    const project = result[0];
    const pageProgressQueries = [];
    for (let i = 1; i <= total_pages; i++) {
      pageProgressQueries.push(
        sql`INSERT INTO page_progress (project_id, page_number, progress) VALUES (${project.id}, ${i}, 0)`,
      );
    }
    if (pageProgressQueries.length > 0) {
      await sql.transaction(pageProgressQueries);
    }

    return Response.json(project);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
