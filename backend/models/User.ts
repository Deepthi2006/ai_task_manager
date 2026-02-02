import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    teams: [
      {
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        role: { type: String, enum: ["Admin", "Member"], default: "Member" },
        jobTitle: { type: String },
      },
    ],
    productivitySettings: {
      workHoursStart: { type: String, default: "09:00" },
      workHoursEnd: { type: String, default: "17:00" },
      energyProfile: { type: Object, default: {} },
    },
  },
  { timestamps: true },
);

export const User = (mongoose.models.User as mongoose.Model<any>) || mongoose.model("User", UserSchema);
