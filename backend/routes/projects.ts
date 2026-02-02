import { Router } from "express";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { connectDB } from "../db";

const router = Router();

router.use(authMiddleware);

// GET all projects for current user
router.get("/", async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const projects = await (Project as any).find({
            $or: [
                { owner: req.user?.id, isDeleted: false },
                { teamId: { $ne: null }, isDeleted: false }, // Simplification: any team member can see team projects
            ],
        }).sort({ createdAt: -1 });

        res.json(projects);
    } catch (error) {
        console.error("Get projects error:", error);
        res.status(500).json({ message: "Failed to fetch projects" });
    }
});

// CREATE project
router.post("/", async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const { name, description, status, teamId, deadline } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Project name is required" });
        }

        const project = await (Project as any).create({
            name,
            description,
            status: status || "Planning",
            owner: req.user?.id,
            teamId: teamId || null,
            deadline,
        });

        res.status(201).json(project);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ message: "Failed to create project" });
    }
});

// GET single project
router.get("/:id", async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const project = await (Project as any).findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json(project);
    } catch (error) {
        console.error("Get project error:", error);
        res.status(500).json({ message: "Failed to fetch project" });
    }
});

// GET tasks for a project
router.get("/:id/tasks", async (req: AuthRequest, res) => {
    try {
        await connectDB();
        const tasks = await (Task as any).find({
            projectId: req.params.id,
            isDeleted: false
        }).sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error("Get project tasks error:", error);
        res.status(500).json({ message: "Failed to fetch project tasks" });
    }
});

export default router;
