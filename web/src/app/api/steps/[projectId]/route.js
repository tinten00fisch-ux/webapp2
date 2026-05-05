import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

const DEFAULT_STEPS = [
  "プロット",
  "ネーム",
  "コマ割り",
  "下書き",
  "ペン入れ",
  "ベタ",
  "トーン",
  "仕上げ",
  "チェック",
];

// GET /api/steps/[projectId] - get steps for a project (auto-init defaults if none)
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = params;

  try {
    // verify ownership
    const projectRows = await sql`
      SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${session.user.id}
    `;
    if (!projectRows.length) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    let steps = await sql`
      SELECT * FROM project_steps
      WHERE project_id = ${projectId}
      ORDER BY position ASC
    `;

    // auto-init default steps if project has none
    if (steps.length === 0) {
      const insertQueries = DEFAULT_STEPS.map(
        (name, i) =>
          sql`INSERT INTO project_steps (project_id, name, position) VALUES (${projectId}, ${name}, ${i}) RETURNING *`,
      );
      const results = await sql.transaction(insertQueries);
      steps = results.flat();
    }

    return Response.json(steps);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/steps/[projectId] - replace all steps for a project
export async function PUT(request, { params }) {
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

    const { steps } = await request.json();
    if (!Array.isArray(steps)) {
      return Response.json(
        { error: "steps must be an array" },
        { status: 400 },
      );
    }

    // get old step ids to figure out what to delete
    const oldSteps =
      await sql`SELECT id FROM project_steps WHERE project_id = ${projectId}`;
    const oldIds = oldSteps.map((s) => s.id);
    const keptIds = steps.filter((s) => s.id).map((s) => s.id);
    const deletedIds = oldIds.filter((id) => !keptIds.includes(id));

    // delete removed steps (cascades to page_step_progress)
    if (deletedIds.length > 0) {
      await sql(`DELETE FROM project_steps WHERE id = ANY($1)`, [deletedIds]);
    }

    // upsert remaining + new steps
    const upsertQueries = steps.map((s, i) => {
      if (s.id) {
        return sql`
          UPDATE project_steps SET name = ${s.name}, position = ${i}
          WHERE id = ${s.id} AND project_id = ${projectId}
          RETURNING *
        `;
      } else {
        return sql`
          INSERT INTO project_steps (project_id, name, position)
          VALUES (${projectId}, ${s.name}, ${i})
          RETURNING *
        `;
      }
    });

    const results =
      upsertQueries.length > 0 ? await sql.transaction(upsertQueries) : [];

    const updatedSteps = results.flat().sort((a, b) => a.position - b.position);
    return Response.json(updatedSteps);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
