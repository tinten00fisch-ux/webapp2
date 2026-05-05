import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// DELETE /api/calendar/[id] - delete a calendar event
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const result = await sql`
      DELETE FROM calendar_events
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (!result.length) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/calendar/[id] - update a calendar event
export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const { title, event_date, color } = await request.json();

    const result = await sql`
      UPDATE calendar_events
      SET
        title = COALESCE(${title}, title),
        event_date = COALESCE(${event_date}, event_date),
        color = COALESCE(${color}, color)
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

    if (!result.length) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
