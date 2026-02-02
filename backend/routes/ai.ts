import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Task } from '../models/Task';
import { connectDB } from '../db';

const router = Router();

router.use(authMiddleware);

// GET coaching advice
router.get('/coach', async (req: AuthRequest, res) => {
  try {
    await connectDB();

    // Fetch last 30 completed tasks
    const completedTasks = await (Task as any).find({
      assignedTo: req.user?.id,
      status: 'Done',
      isDeleted: false,
      parentId: null
    })
      .sort({ updatedAt: -1 })
      .limit(30);

    if (completedTasks.length === 0) {
      return res.json({
        advice: "Complete some tasks to get personalized coaching advice!"
      });
    }

    // Calculate stats
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.totalTimeSpent || 0), 0);
    const averageTime = totalTime / completedTasks.length;
    const highPriorityCount = completedTasks.filter(t => t.priority === 'High').length;

    // Generate AI Coaching Advice if Groq is available
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const taskSummary = completedTasks.map(t => ({
          title: t.title,
          priority: t.priority,
          timeSpent: t.totalTimeSpent
        }));

        const prompt = `You are an elite Performance Coach. Analyze this user's recently completed tasks and provide 2-3 paragraphs of MOTIVATIONAL and STRATEGIC coaching advice.
TASKS: ${JSON.stringify(taskSummary)}
STATS: Avg Time=${Math.round(averageTime)}m, High Priority Count=${highPriorityCount}/${completedTasks.length}

FORMATTING:
- Use professional yet supportive tone.
- Mention specific patterns you see in their task titles.
- Give one specific "Pro Tip" for tomorrow.
- Keep it under 150 words total.`;

        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });

        if (aiResponse.ok) {
          const result: any = await aiResponse.json();
          const advice = result.choices[0].message.content;
          return res.json({ advice });
        }
      } catch (e) {
        console.error("AI coaching failed:", e);
      }
    }

    // Generate fallback rule-based advice
    let advice = "Based on your task completion patterns:\n\n";
    if (averageTime > 120) advice += "⏱️ Your tasks take an average of " + Math.round(averageTime) + " minutes. Consider breaking larger tasks into smaller subtasks for better focus.\n\n";
    if (highPriorityCount > completedTasks.length * 0.5) advice += "⚠️ You're completing a lot of high-priority tasks. Make sure to schedule some lower-priority items to maintain balance.\n\n";
    advice += "✅ Great job completing " + completedTasks.length + " tasks! Keep up the momentum!";

    res.json({ advice });
  } catch (error) {
    console.error('Coaching error:', error);
    res.status(500).json({ advice: "Focus on your most important tasks today!" });
  }
});

// POST smart schedule with AI analysis
router.post('/schedule', async (req: AuthRequest, res) => {
  try {
    await connectDB();

    // Fetch all pending tasks assigned to the user
    const tasksRaw = await (Task as any).find({
      assignedTo: req.user?.id,
      status: 'Todo',
      isDeleted: false,
    });

    // Identify tasks that have children to avoid scheduling container tasks
    const allTaskIds = tasksRaw.map((t: any) => t._id);
    const tasksWithChildren = await (Task as any).find({
      parentId: { $in: allTaskIds },
      isDeleted: false
    }).distinct('parentId');

    const tasksWithChildrenSet = new Set(tasksWithChildren.map((id: any) => id.toString()));

    // Only schedule "leaf" tasks (tasks without subtasks) or tasks that are considered work units
    const pendingTasksRaw = tasksRaw.filter((t: any) => !tasksWithChildrenSet.has(t._id.toString()));

    // Sort by priority weight (High: 3, Medium: 2, Low: 1)
    const priorityWeight: { [key: string]: number } = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const pendingTasks = pendingTasksRaw.sort((a, b) => {
      const weightA = priorityWeight[a.priority || 'Medium'] || 0;
      const weightB = priorityWeight[b.priority || 'Medium'] || 0;
      return weightB - weightA;
    });

    const completedTasks = await (Task as any).find({
      assignedTo: req.user?.id,
      status: 'Done',
      isDeleted: false,
      parentId: null
    }).limit(20);

    if (pendingTasks.length === 0) {
      return res.json({ schedule: [] });
    }

    // AI Scheduler with explicit logging
    const groqApiKey = process.env.GROQ_API_KEY;
    console.log("[AI Schedule] Key present:", !!groqApiKey);

    if (groqApiKey) {
      try {
        const taskData = pendingTasks.map(t => ({
          title: t.title,
          priority: t.priority || "Medium",
          description: t.description || ""
        }));

        const prompt = `You are a high-performance productivity assistant. Create a DAILY ROADMAP.
TASKS:
${JSON.stringify(taskData, null, 2)}

STRICT RULES:
1. Start at 09:00 AM.
2. Back-to-back tasks (NO GAPS).
3. VARIATION: Assign realistic minutes. NEVER use 60m for all. Coding/Dev = 90-150m, Emails/Admin = 15-30m.
4. Output ONLY valid JSON: { "schedule": [ { "title", "start", "end", "duration", "priority", "description", "reasoning" } ] }`;

        console.log("[AI Schedule] Requesting from Groq...");
        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        if (!aiResponse.ok) {
          const err = await aiResponse.text();
          console.error("[AI Schedule] API Error:", aiResponse.status, err);
        } else {
          const result: any = await aiResponse.json();
          const content = result.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (parsed.schedule) {
              console.log("[AI Schedule] Successfully generated roadmap.");
              return res.json({ schedule: parsed.schedule });
            }
          }
          console.error("[AI Schedule] Invalid response:", content);
        }
      } catch (e: any) {
        console.error("[AI Schedule] Error:", e.message);
      }
    }

    // Fallback to rule-based logic if Groq fails or is not configured
    const schedule = [];
    let elapsedMinutes = 0;
    const workStartHour = 9;

    const formatTime = (totalMinutes: number) => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, "0")}`;
    };

    const calculateTaskDuration = (task: any) => {
      let duration = task.priority === 'High' ? 90 : task.priority === 'Low' ? 30 : 60;
      const title = (task.title || "").toLowerCase();
      if (title.includes("meeting")) duration = 30;
      else if (title.includes("bug")) duration += 30;
      else if (title.includes("build")) duration += 60;
      return Math.min(Math.max(duration, 15), 240);
    };

    for (const task of pendingTasks) {
      const taskDuration = calculateTaskDuration(task);
      const startMinutes = workStartHour * 60 + elapsedMinutes;
      const endMinutes = startMinutes + taskDuration;

      schedule.push({
        title: task.title,
        priority: task.priority || "Medium",
        description: task.description || "",
        start: formatTime(startMinutes),
        end: formatTime(endMinutes),
        duration: taskDuration,
        reasoning: `Allocated ${taskDuration} minutes based on complexity and priority (Static Fallback).`
      });

      elapsedMinutes += taskDuration;
    }

    res.json({ schedule });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ schedule: [] });
  }
});

// GET productivity score
router.get('/productivity-score', async (req: AuthRequest, res) => {
  try {
    await connectDB();

    const completedTasks = await (Task as any).find({
      assignedTo: req.user?.id,
      status: 'Done',
      isDeleted: false,
      parentId: null
    }).sort({ updatedAt: -1 }).limit(30);

    const allTasks = await (Task as any).find({
      assignedTo: req.user?.id,
      isDeleted: false,
      parentId: null
    });

    if (completedTasks.length === 0) {
      return res.json({
        score: 0,
        metrics: {
          tasksCompleted: 0,
          completionRate: 0,
          averageTimePerTask: 0,
          highPriorityCompleted: 0,
          trend: 'No data yet'
        }
      });
    }

    const totalCompleted = completedTasks.length;
    const completionRate = Math.round((totalCompleted / (allTasks.length || 1)) * 100);
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.totalTimeSpent || 0), 0);
    const averageTime = Math.round(totalTime / totalCompleted);
    const highPriorityCompleted = completedTasks.filter(t => t.priority === 'High').length;

    // Calculate score (0-100)
    const completionScore = Math.min(completionRate, 50);
    const efficiencyScore = averageTime < 60 ? 30 : averageTime < 90 ? 20 : 10;
    const priorityScore = highPriorityCompleted > 0 ? 20 : 0;
    const score = Math.round(completionScore + efficiencyScore + priorityScore);

    // Determine trend
    const lastWeekTasks = completedTasks.filter(t => {
      const daysDiff = Math.floor((Date.now() - new Date(t.updatedAt || 0).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });
    const trend = lastWeekTasks.length > (totalCompleted / 4) ? '📈 Improving' : '📉 Needs focus';

    // Generate AI Suggestions if Groq is available
    let suggestions = [
      "Break down large tasks into smaller subtasks (15-30 mins each).",
      "Focus on completing High-priority tasks during your peak energy hours.",
      "Minimize context switching by batching similar tasks together."
    ];

    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey && totalCompleted > 0) {
      try {
        const statsInfo = {
          score,
          completionRate,
          averageTime,
          highPriorityCompleted,
          totalCompleted,
          trend
        };

        const prompt = `You are a Senior Productivity Consultant. Analyze these user performance metrics and provide 3 SHORT, ACTIONABLE, and HIGH-IMPACT improvement suggestions.
METRICS: ${JSON.stringify(statsInfo)}

RULES:
1. Provide exactly 3 suggestions.
2. Each suggestion must be under 15 words.
3. Be specific to the numbers (e.g., if completion rate is low, suggest why).
4. Return ONLY a valid JSON object: { "suggestions": ["...", "...", "..."] }`;

        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        if (aiResponse.ok) {
          const result: any = await aiResponse.json();
          const parsed = JSON.parse(result.choices[0].message.content);
          if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions;
          }
        }
      } catch (e) {
        console.error("AI suggestions failed:", e);
      }
    }

    res.json({
      score: Math.min(score, 100),
      metrics: {
        tasksCompleted: totalCompleted,
        completionRate: completionRate,
        averageTimePerTask: averageTime,
        highPriorityCompleted: highPriorityCompleted,
        trend: trend
      },
      suggestions
    });
  } catch (error) {
    console.error('Productivity score error:', error);
    res.status(500).json({ score: 0, metrics: {} });
  }
});

// GET burnout score
router.get('/burnout-score', async (req: AuthRequest, res) => {
  try {
    await connectDB();

    const allTasks = await (Task as any).find({
      assignedTo: req.user?.id,
      isDeleted: false,
      parentId: null
    });

    const todoTasks = allTasks.filter(t => t.status === 'Todo');
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress');
    const completedTasks = allTasks.filter(t => t.status === 'Done');

    // Calculate workload metrics
    const highPriorityTodo = todoTasks.filter(t => t.priority === 'High').length;
    const totalHighPriority = allTasks.filter(t => t.priority === 'High').length;
    const taskLoadRatio = Math.min((todoTasks.length + inProgressTasks.length) / (completedTasks.length || 1), 5);

    const averageTimeSpent = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((sum, t) => sum + (t.totalTimeSpent || 0), 0) / completedTasks.length)
      : 0;

    // Calculate burnout score (0-100, higher = more burnout risk)
    let burnoutScore = 0;

    // Workload factor (40 points max)
    if (taskLoadRatio > 4) burnoutScore += 40;
    else if (taskLoadRatio > 3) burnoutScore += 30;
    else if (taskLoadRatio > 2) burnoutScore += 20;
    else if (taskLoadRatio > 1) burnoutScore += 10;

    // High priority overload (30 points max)
    if (highPriorityTodo > 5) burnoutScore += 30;
    else if (highPriorityTodo > 3) burnoutScore += 20;
    else if (highPriorityTodo > 1) burnoutScore += 10;

    // Time pressure (20 points max)
    if (averageTimeSpent > 120) burnoutScore += 20;
    else if (averageTimeSpent > 90) burnoutScore += 10;

    // In progress tasks (10 points max)
    if (inProgressTasks.length > 3) burnoutScore += 10;

    const burnoutLevel = burnoutScore > 70 ? '🔴 Critical' :
      burnoutScore > 50 ? '🟠 High' :
        burnoutScore > 30 ? '🟡 Moderate' :
          '🟢 Healthy';

    // AI-driven Burnout Analysis
    let reasons = ["High volume of pending work.", "Multiple high-priority deadlines.", "Steady task accumulation."];
    let recoveryTips = ["Start with a single easy win to build momentum.", "Decline or delegate non-essential meetings.", "Take a strict 15-minute break every 2 hours."];

    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const burnoutData = {
          score: burnoutScore,
          level: burnoutLevel,
          todoCount: todoTasks.length,
          highPriorityTodo,
          inProgressCount: inProgressTasks.length,
          loadRatio: taskLoadRatio
        };

        const prompt = `You are a Workplace Wellness Expert. Analyze this user's workload data and identify the CORE REASONS for their burnout risk and provide RECOVERY TIPS.
METRICS: ${JSON.stringify(burnoutData)}

RULES:
1. Identify 3 specific REASONS for their current score level.
2. Provide 3 specific, ACTIONABLE RECOVERY TIPS.
3. Keep each point under 12 words.
4. Return ONLY a valid JSON object: { "reasons": ["...", "...", "..."], "tips": ["...", "...", "..."] }`;

        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        if (aiResponse.ok) {
          const result: any = await aiResponse.json();
          const parsed = JSON.parse(result.choices[0].message.content);
          if (parsed.reasons && parsed.tips) {
            reasons = parsed.reasons;
            recoveryTips = parsed.tips;
          }
        }
      } catch (e) {
        console.error("AI burnout analysis failed:", e);
      }
    }

    res.json({
      score: Math.min(burnoutScore, 100),
      level: burnoutLevel,
      metrics: {
        unfinishedTasks: todoTasks.length + inProgressTasks.length,
        highPriorityUnfinished: highPriorityTodo,
        inProgressCount: inProgressTasks.length,
        taskLoadRatio: taskLoadRatio.toFixed(2),
        averageTimePerTask: averageTimeSpent,
        recommendation: burnoutScore > 50
          ? '⚠️ Action required to prevent total burnout'
          : '✅ Sustainable work patterns detected'
      },
      reasons,
      recoveryTips
    });
  } catch (error) {
    console.error('Burnout score error:', error);
    res.status(500).json({ score: 0, level: '🟢 Healthy', metrics: {} });
  }
});

export default router;
