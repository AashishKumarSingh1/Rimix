import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { jsonError, jsonOk, parseJson } from "@/lib/http";
import { Reminder } from "@/models/Reminder";

type CreateReminderBody = {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
};

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const completed = searchParams.get("completed");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  const filter: Record<string, unknown> = {};
  if (q) Object.assign(filter, { $text: { $search: q } });
  if (completed === "true") filter.completed = true;
  if (completed === "false") filter.completed = false;

  const items = await Reminder.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const total = await Reminder.countDocuments(filter);

  return jsonOk({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await parseJson<CreateReminderBody>(req);
  if (!body) return jsonError("Invalid JSON body", 400);

  const title = (body.title || "").trim();
  if (!title) return jsonError("Title is required", 422);

  const doc = await Reminder.create({
    title,
    description: body.description || "",
    date: body.date || undefined,
    time: body.time || undefined,
    category: body.category || "Personal",
    priority: body.priority || "medium",
  });

  return jsonOk(doc, { status: 201 });
}


