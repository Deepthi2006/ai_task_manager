import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Done"],
      default: "Todo",
    },
    deadline: { type: Date },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    isFocusSession: { type: Boolean, default: false },
    energyLevelRequired: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    userEnergyPostTask: { type: Number },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    isPrivate: { type: Boolean, default: false },
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
      },
    ],
    timeLog: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        durationMinutes: { type: Number, default: 0 },
      },
    ],
    totalTimeSpent: { type: Number, default: 0 },
    priority: { type: String, enum: ["Low", "Medium", "High"] },
    aiPriorityReasoning: { type: String },
    aiEstimatedDuration: { type: Number },
    aiConfidenceScore: { type: Number },
    aiTags: [{ type: String }],
    lastAnalyzedDescription: { type: String },
    aiAnalysisCache: { type: Object },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

export const Task = (mongoose.models.Task as mongoose.Model<any>) || mongoose.model("Task", TaskSchema);
