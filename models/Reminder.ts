import { Schema, model, models } from "mongoose";

export type ReminderPriority = "low" | "medium" | "high";

export interface ReminderDocument {
  title: string;
  description?: string;
  date?: string;
  time?: string; 
  category?: string;
  priority: ReminderPriority;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<ReminderDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    date: { type: String },
    time: { type: String },
    category: { type: String, default: "Personal" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ReminderSchema.index({ title: "text", description: "text", category: "text" });

export const Reminder = models.Reminder || model("Reminder", ReminderSchema);



