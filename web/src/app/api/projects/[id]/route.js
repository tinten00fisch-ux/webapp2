import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const projectResult = await sql`
      SELECT * FROM projects WHERE id = ${id} AND user_id = ${session.user.id}
    `;
    if (projectResult.length === 0) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const progress = await sql`
      SELECT * FROM page_progress WHERE project_id = ${id} ORDER BY page_number ASC
    `;

    return Response.json({
      project: projectResult[0],
      progress: progress,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { title, header_image_url } = body;

    const setClauses = [];
    const values = [];

    if (title !== undefined) {
      setClauses.push(`title = $${values.length + 1}`);
      values.push(title);
    }
    if (header_image_url !== undefined) {
      setClauses.push(`header_image_url = $${values.length + 1}`);
      values.push(header_image_url);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const query = `
      UPDATE projects 
      SET ${setClauses.join(", ")} 
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `;

    const result = await sql(query, [...values, id, session.user.id]);

    if (result.length === 0) {
      return Response.json(
        { error: "Project not found or not owned" },
        { status: 404 },
      );
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
