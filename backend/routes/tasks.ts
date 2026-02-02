import { Router } from "express";
import { Task } from "../models/Task";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { connectDB } from "../db";

const router = Router();

// Middleware
router.use(authMiddleware);

// GET all tasks for current user
router.get("/", async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const tasks = await (Task as any).find({
      $or: [
        { assignedTo: req.user?.id, isDeleted: false },
        { teamId: { $ne: null }, isDeleted: false },
      ],
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Failed to fetch tasks",
      });
  }
});

// GET all team tasks
router.get("/team/:teamId", async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const { teamId } = req.params;

    const tasks = await (Task as any).find({
      teamId: teamId,
      isDeleted: false
    })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Get team tasks error:", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch team tasks"
    });
  }
});

// GET single task
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const task = await (Task as any).findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check access: owner or team member
    if (task.assignedTo?.toString() !== req.user?.id && !task.teamId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Failed to fetch task",
      });
  }
});

// CREATE task
router.post("/", async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const { title, description, priority, teamId, projectId, parentId, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    // Create task with AI analysis (basic version)
    const task = await (Task as any).create({
      title,
      description: description || "",
      priority: priority || "Medium",
      teamId: teamId || null,
      projectId: projectId || null,
      parentId: parentId || null,
      assignedTo: assignedTo || req.user?.id,
      isPrivate: !teamId,
      // AI fields will be populated by background job in real implementation
      aiPriorityReasoning: `Auto-analyzed: ${title}`,
      aiEstimatedDuration: 60,
      aiConfidenceScore: 80,
      aiTags: [],
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Failed to create task",
      });
  }
});

// UPDATE task
router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const { status, priority, description } = req.body;

    const task = await (Task as any).findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check ownership
    if (task.assignedTo?.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update fields
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (description) task.description = description;

    await task.save();

    // Auto-complete parent if all subtasks are done
    if (status === "Done" && task.parentId) {
      const parent = await (Task as any).findById(task.parentId);
      if (parent) {
        const siblings = await (Task as any).find({ parentId: task.parentId, isDeleted: false });
        const allDone = siblings.every((s: any) => s.status === "Done");
        if (allDone) {
          parent.status = "Done";
          await parent.save();
        }
      }
    }

    res.json(task);
  } catch (error) {
    console.error("Update task error:", error);
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Failed to update task",
      });
  }
});

// DELETE task (soft delete)
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    await connectDB();
    const task = await (Task as any).findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check ownership
    if (task.assignedTo?.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    res
      .status(500)
      .json({
        message:
          error instanceof Error ? error.message : "Failed to delete task",
      });
  }
});

export default router;
