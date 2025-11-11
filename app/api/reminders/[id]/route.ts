import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { Reminder } from "@/models/Reminder";

function jsonOk(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function parseJson<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

type UpdateReminderBody = {
  title?: string;
  description?: string;
  date?: string | null;
  time?: string | null;
  category?: string;
  priority?: "low" | "medium" | "high";
  completed?: boolean;
};

export async function GET(_req: NextRequest, context: RouteContext<"/api/reminders/[id]">) {
  const { id } = await context.params; 
  await connectToDatabase();

  const item = await Reminder.findById(id).lean();
  if (!item) return jsonError("Reminder not found", 404);

  return jsonOk(item);
}

export async function PUT(req: NextRequest, context: RouteContext<"/api/reminders/[id]">) {
  const { id } = await context.params;
  await connectToDatabase();

  const body = await parseJson<UpdateReminderBody>(req);
  if (!body) return jsonError("Invalid JSON body", 400);

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.date === "string" || body.date === null) update.date = body.date || undefined;
  if (typeof body.time === "string" || body.time === null) update.time = body.time || undefined;
  if (typeof body.category === "string") update.category = body.category;
  if (typeof body.priority === "string") update.priority = body.priority;
  if (typeof body.completed === "boolean") update.completed = body.completed;

  const item = await Reminder.findByIdAndUpdate(id, update, { new: true });
  if (!item) return jsonError("Reminder not found", 404);

  return jsonOk(item);
}

export async function PATCH(req: NextRequest, context: RouteContext<"/api/reminders/[id]">) {
  return PUT(req, context);
}

export async function DELETE(_req: NextRequest, context: RouteContext<"/api/reminders/[id]">) {
  const { id } = await context.params;
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid reminder ID format", 400);
  }

  try {
    const res = await Reminder.findByIdAndDelete(id);
    if (!res) return jsonError("Reminder not found", 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return jsonError("Failed to delete reminder", 500);
  }
}
