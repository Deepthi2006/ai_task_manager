import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        status: {
            type: String,
            enum: ["Active", "Completed", "On Hold", "Planning"],
            default: "Planning",
        },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null,
        },
        deadline: { type: Date },
        isPrivate: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
    },
    { timestamps: true }
);

export const Project = (mongoose.models.Project as mongoose.Model<any>) || mongoose.model("Project", ProjectSchema);
