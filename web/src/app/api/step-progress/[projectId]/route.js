import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET /api/step-progress/[projectId]?page=N - get step progress for a page
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;
  const { searchParams } = new URL(request.url);
  const pageNumber = parseInt(searchParams.get("page") || "1");

  try {
    const projectRows = await sql`
      SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${session.user.id}
    `;
    if (!projectRows.length) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // get steps + their progress for this page
    const rows = await sql`
      SELECT 
        ps.id as step_id,
        ps.name,
        ps.position,
        COALESCE(psp.progress, 0) as progress
      FROM project_steps ps
      LEFT JOIN page_step_progress psp
        ON psp.step_id = ps.id AND psp.page_number = ${pageNumber} AND psp.project_id = ${projectId}
      WHERE ps.project_id = ${projectId}
      ORDER BY ps.position ASC
    `;

    return Response.json(rows);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/step-progress/[projectId] - update a step's progress for a page
export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  try {
    const projectRows = await sql`
      SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${session.user.id}
    `;
    if (!projectRows.length) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const { page_number, step_id, progress } = await request.json();

    const result = await sql`
      INSERT INTO page_step_progress (project_id, page_number, step_id, progress, updated_at)
      VALUES (${projectId}, ${page_number}, ${step_id}, ${progress}, CURRENT_TIMESTAMP)
      ON CONFLICT (page_number, step_id)
      DO UPDATE SET progress = ${progress}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    // Also update the overall page progress = avg of all steps for this page
    const avg = await sql`
      SELECT ROUND(AVG(psp.progress)) as avg_progress
      FROM project_steps ps
      LEFT JOIN page_step_progress psp
        ON psp.step_id = ps.id AND psp.page_number = ${page_number} AND psp.project_id = ${projectId}
      WHERE ps.project_id = ${projectId}
    `;

    const avgProgress = parseInt(avg[0]?.avg_progress || 0);

    await sql`
      UPDATE page_progress
      SET progress = ${avgProgress}, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ${projectId} AND page_number = ${page_number}
    `;

    return Response.json({
      stepProgress: result[0],
      pageProgress: avgProgress,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
