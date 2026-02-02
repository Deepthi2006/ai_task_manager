import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  inviteCode: { type: String, unique: true, required: true },
  jobRoles: [{ type: String }],
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Owner', 'Admin', 'Member', 'Viewer'], default: 'Member' },
    jobTitle: { type: String }
  }],
  description: { type: String },
  avatar: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Team = (mongoose.models.Team as mongoose.Model<any>) || mongoose.model('Team', TeamSchema);
