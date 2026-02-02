import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2, Circle, AlertCircle, Sparkles, Calendar, Brain, TrendingUp, Zap, Target, Clock, FolderKanban } from "lucide-react";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskList } from "@/components/tasks/TaskList";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  priority?: "Low" | "Medium" | "High";
  deadline?: string;
  assignedTo?: string;
  teamId?: string;
  parentId?: string;
}

interface ScheduleItem {
  title: string;
  priority: string;
  description: string;
  start: string;
  end: string;
  duration: number;
  reasoning: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useSocket((event) => {
    if (event.type === "TASK_UPDATED" || event.type === "BOTTLENECK_ALERT") {
      fetchTasks();
    }
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, [user, token]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const response = await fetch('/api/agent/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setSchedule(data.schedule || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const rootTasks = useMemo(() => tasks.filter(t => !t.parentId), [tasks]);
  const personalTasks = useMemo(() => rootTasks.filter((t) => !t.teamId), [rootTasks]);
  const todoTasks = useMemo(() => rootTasks.filter((t) => t.status === "Todo"), [rootTasks]);
  const inProgressTasks = useMemo(() => rootTasks.filter((t) => t.status === "In Progress"), [rootTasks]);
  const doneTasks = useMemo(() => rootTasks.filter((t) => t.status === "Done"), [rootTasks]);

  const stats = [
    { label: "Active Momentum", value: rootTasks.length, icon: TrendingUp, color: "from-primary to-indigo-600", bg: "bg-primary/10" },
    { label: "Active Sprints", value: inProgressTasks.length, icon: Zap, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10" },
    { label: "Peak Performance", value: doneTasks.length, icon: Target, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
    { label: "High Priority", value: rootTasks.filter(t => t.priority === "High").length, icon: AlertCircle, color: "from-rose-500 to-orange-500", bg: "bg-rose-500/10" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High": return "bg-rose-500/10 text-rose-600 border-rose-200";
      case "Medium": return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "Low": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      default: return "bg-muted";
    }
  };

  return (
    <Layout>
      <div className="space-y-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div className="space-y-2">
            <Badge className="premium-gradient text-white px-4 py-1.5 rounded-full border-0 font-bold mb-4 shadow-lg shadow-primary/20">
              <Sparkles className="w-3.5 h-3.5 mr-2" /> System Status: Optimized
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
              Awaiting Command, <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{user?.name}</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl">
              Elevate your productivity. You have <span className="text-primary font-bold">{todoTasks.length} objectives</span> and <span className="text-blue-600 font-bold">{inProgressTasks.length} active workstreams</span>.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="premium-gradient text-white h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30 border-0 group"
            >
              <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-500" />
              Initialize Task
            </Button>
          </motion.div>
        </motion.div>

        {/* Dynamic Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={item} className="group">
              <Card className="glass-card hover-lift border-0 overflow-hidden relative cursor-default">
                <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 bg-gradient-to-br ${stat.color} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
                <CardContent className="pt-8 pb-6 px-8 relative">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className={`w-7 h-7 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-bold text-sm tracking-widest uppercase">{stat.label}</p>
                    <div className="text-4xl font-black text-foreground">{stat.value}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission Control Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-0 backdrop-blur-3xl overflow-hidden">
            <CardHeader className="border-b border-white/20 bg-white/40 pb-6 pt-8 px-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">Mission Control</CardTitle>
                  <CardDescription className="text-base font-medium">Unified task management and AI-optimized roadmap</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="bg-white/40 p-1.5 rounded-2xl border border-white/60 mb-8 h-auto flex flex-wrap gap-1">
                  {["personal", "all", "todo", "in-progress", "done"].map(tab => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="px-6 py-3 rounded-xl font-bold transition-all data-[state=active]:premium-gradient data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger
                    value="schedule"
                    className="gap-2 px-6 py-3 rounded-xl font-black text-primary data-[state=active]:premium-gradient data-[state=active]:text-white transition-all ml-auto"
                  >
                    <Sparkles className="w-5 h-5" />
                    Neural Roadmap
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="personal" className="mt-0 focus-visible:outline-none">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <span className="text-lg font-bold text-muted-foreground animate-pulse">Syncing workstreams...</span>
                      </div>
                    ) : personalTasks.length === 0 ? (
                      <div className="text-center py-24 glass-card rounded-3xl border-dashed border-2">
                        <Circle className="w-20 h-20 text-muted-foreground/10 mx-auto mb-6" />
                        <p className="text-xl font-bold text-muted-foreground">Clear Horizon. No objectives recorded.</p>
                      </div>
                    ) : (
                      <TaskList tasks={tasks} initialTasks={personalTasks} onTaskUpdate={fetchTasks} />
                    )}
                  </TabsContent>

                  <TabsContent value="all" className="mt-0 focus-visible:outline-none">
                    <TaskList tasks={tasks} onTaskUpdate={fetchTasks} />
                  </TabsContent>

                  <TabsContent value="schedule" className="mt-0 focus-visible:outline-none">
                    <div className="space-y-8">
                      <div className="flex items-center justify-between bg-primary/5 p-6 rounded-3xl border border-primary/10">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Brain className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black">Neural Network Planner</h3>
                            <p className="text-base text-muted-foreground font-medium">Llama 3.3 optimized sequence based on cognitive load models.</p>
                          </div>
                        </div>
                        <Button
                          onClick={fetchSmartSchedule}
                          disabled={loadingSchedule}
                          className="premium-gradient text-white h-14 px-8 rounded-2xl font-bold shadow-xl border-0"
                        >
                          {loadingSchedule ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <TrendingUp className="w-5 h-5 mr-3" />}
                          Generate Roadmap
                        </Button>
                      </div>

                      {loadingSchedule ? (
                        <div className="py-32 flex flex-col items-center justify-center space-y-6">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-20 h-20 rounded-full border-b-4 border-primary"
                          />
                          <p className="text-2xl font-black text-primary animate-pulse tracking-tight">Synthesizing High-Performance Schedule...</p>
                        </div>
                      ) : schedule.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                          {schedule.map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="group glow-border"
                            >
                              <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full premium-gradient" />
                                <div className="flex flex-col items-center justify-center min-w-[140px] space-y-2">
                                  <div className="text-2xl font-black text-foreground tracking-tighter">{item.start}</div>
                                  <div className="h-8 w-[2px] premium-gradient opacity-30" />
                                  <div className="text-lg font-bold text-muted-foreground">{item.end}</div>
                                </div>
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center gap-4">
                                    <h4 className="text-2xl font-black tracking-tight">{item.title}</h4>
                                    <Badge className={`${getPriorityColor(item.priority)} px-3 py-1 rounded-lg text-sm font-bold border`}>
                                      {item.priority} Level
                                    </Badge>
                                  </div>
                                  <p className="text-lg text-foreground/80 font-medium leading-relaxed">{item.description}</p>
                                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 items-start">
                                    <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                    <p className="text-base text-primary/80 italic font-semibold">{item.reasoning}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2 bg-white/40 p-4 rounded-2xl border border-white/60 min-w-[140px]">
                                  <Clock className="w-5 h-5 text-primary" />
                                  <span className="text-xl font-black text-primary">{item.duration}m</span>
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Alloction</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-24 text-center glass-card border-dashed border-2 rounded-[3rem]">
                          <Brain className="w-24 h-24 text-primary/10 mx-auto mb-6" />
                          <h3 className="text-2xl font-black mb-2">Neural Engine Idle</h3>
                          <p className="text-muted-foreground text-lg font-medium">Activate roadmap generation to see your optimized trajectory.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={fetchTasks}
      />
    </Layout>
  );
}
