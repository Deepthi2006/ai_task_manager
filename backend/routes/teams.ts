import { Router } from 'express';
import crypto from 'crypto';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { connectDB } from '../db';

const router = Router();

router.use(authMiddleware);

// GET all teams for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const teams = await Team.find({
      'members.userId': req.user?.id
    }).populate('members.userId', 'name email');

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch teams' });
  }
});

// GET single team details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const team = await Team.findById(req.params.id).populate('members.userId', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Security: Ensure requester is a member
    const isMember = team.members.some(m => m.userId && (m.userId as any)._id.toString() === req.user?.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch team' });
  }
});

// CREATE team
router.post('/create', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const { name, jobRoles, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const team = await Team.create({
      name,
      description: description || '',
      inviteCode,
      jobRoles: jobRoles || [],
      createdBy: req.user?.id,
      members: [{
        userId: req.user?.id,
        role: 'Owner',
        jobTitle: 'Owner'
      }]
    });

    // Add team to user's list
    await User.findByIdAndUpdate(req.user?.id, {
      $push: { teams: { teamId: team._id, role: 'Owner' } }
    });

    const populatedTeam = await Team.findById(team._id).populate('members.userId', 'name email');
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create team' });
  }
});

// JOIN team with invite code
router.post('/join', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const { inviteCode, jobRole } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if already a member
    const isMember = team.members.some(m => m.userId?.toString() === req.user?.id);
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    team.members.push({
      userId: req.user?.id as any,
      role: 'Member',
      jobTitle: jobRole || 'Member'
    });
    await team.save();

    // Add team to user's list
    await User.findByIdAndUpdate(req.user?.id, {
      $push: { teams: { teamId: team._id, role: 'Member' } }
    });

    const populatedTeam = await Team.findById(team._id).populate('members.userId', 'name email');
    res.json({ message: 'Joined team successfully', team: populatedTeam });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to join team' });
  }
});

// UPDATE team
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const { name, description, jobRoles } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is owner
    const isOwner = team.members.some(m => m.userId?.toString() === req.user?.id && m.role === 'Owner');
    if (!isOwner) {
      return res.status(403).json({ message: 'Only team owner can update team' });
    }

    if (name) team.name = name;
    if (description) team.description = description;
    if (jobRoles) team.jobRoles = jobRoles;

    await team.save();
    const updatedTeam = await Team.findById(team._id).populate('members.userId', 'name email');
    res.json(updatedTeam);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update team' });
  }
});

// REMOVE member from team
router.delete('/:id/members/:memberId', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is owner
    const isOwner = team.members.some(m => m.userId?.toString() === req.user?.id && m.role === 'Owner');
    if (!isOwner) {
      return res.status(403).json({ message: 'Only team owner can remove members' });
    }

    team.members = team.members.filter(m => m.userId?.toString() !== req.params.memberId);
    await team.save();

    // Remove team from user's list
    await User.findByIdAndUpdate(req.params.memberId, {
      $pull: { teams: { teamId: team._id } }
    });

    const updatedTeam = await Team.findById(team._id).populate('members.userId', 'name email');
    res.json(updatedTeam);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to remove member' });
  }
});

// DELETE team
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is owner
    const isOwner = team.members.some(m => m.userId?.toString() === req.user?.id && m.role === 'Owner');
    if (!isOwner) {
      return res.status(403).json({ message: 'Only team owner can delete team' });
    }

    // Remove team from all members
    await User.updateMany(
      { 'teams.teamId': team._id },
      { $pull: { teams: { teamId: team._id } } }
    );

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to delete team' });
  }
});

export default router;
