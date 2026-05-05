import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = params;

  try {
    const body = await request.json();
    const { page_number, progress } = body;

    // Verify ownership
    const project = await sql`
      SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${session.user.id}
    `;
    if (project.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const result = await sql`
      UPDATE page_progress 
      SET progress = ${progress}, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ${projectId} AND page_number = ${page_number}
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
