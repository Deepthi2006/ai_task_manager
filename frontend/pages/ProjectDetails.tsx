import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Circle, Plus, Calendar, FolderOpen } from 'lucide-react';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'Todo' | 'In Progress' | 'Done';
    priority?: 'Low' | 'Medium' | 'High';
    deadline?: string;
    parentId?: string;
}

interface Project {
    _id: string;
    name: string;
    description?: string;
    status: "Active" | "Completed" | "On Hold" | "Planning";
    deadline?: string;
}

export default function ProjectDetails() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        fetchProjectDetails();
        fetchProjectTasks();
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProject(data);
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
        }
    };

    const fetchProjectTasks = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${projectId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching project tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const rootTasks = tasks.filter(t => !t.parentId);
    const filteredTasks = filterStatus === 'all'
        ? rootTasks
        : rootTasks.filter(t => t.status === filterStatus);

    const todoCount = rootTasks.filter(t => t.status === 'Todo').length;
    const inProgressCount = rootTasks.filter(t => t.status === 'In Progress').length;
    const doneCount = rootTasks.filter(t => t.status === 'Done').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-green-100 text-green-800 border-green-200";
            case "Planning": return "bg-blue-100 text-blue-800 border-blue-200";
            case "On Hold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Completed": return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "bg-muted";
        }
    };

    if (!project) {
        return (
            <Layout>
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/projects')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display">{project.name}</h1>
                                <Badge className={getStatusColor(project.status)} variant="outline">
                                    {project.status}
                                </Badge>
                            </div>
                            {project.description && (
                                <p className="text-muted-foreground mt-2">{project.description}</p>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg transition-all transform hover:scale-105"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task to Project
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Project Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-primary" />
                                Project Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {project.deadline && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground text-left">Deadline:</span>
                                    <span className="font-medium text-left">{new Date(project.deadline).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <Circle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground text-left">Organization:</span>
                                <span className="font-medium text-left">Personal Project</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Task Stats */}
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="space-y-4 text-left">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">{rootTasks.length}</p>
                                    <p className="text-muted-foreground text-sm">Main Tasks</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-left">
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-foreground">{todoCount}</p>
                                        <p className="text-xs text-muted-foreground">To Do</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-foreground">{inProgressCount}</p>
                                        <p className="text-xs text-muted-foreground">Doing</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-foreground">{doneCount}</p>
                                        <p className="text-xs text-muted-foreground">Done</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress */}
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="space-y-4 text-left">
                                <div>
                                    <p className="text-3xl font-bold text-foreground">
                                        {rootTasks.length > 0 ? Math.round((doneCount / rootTasks.length) * 100) : 0}%
                                    </p>
                                    <p className="text-muted-foreground text-sm">Completion Rate</p>
                                </div>
                                <div className="w-full bg-primary/20 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${rootTasks.length > 0 ? (doneCount / rootTasks.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tasks Section */}
                <Card className="border-primary/20 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between text-left bg-muted/30 border-b">
                        <div>
                            <CardTitle className="text-xl">Project Roadmap</CardTitle>
                            <CardDescription>Plan and execute your project milestones</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-32 bg-white">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Goals</SelectItem>
                                    <SelectItem value="Todo">To Do</SelectItem>
                                    <SelectItem value="In Progress">Doing</SelectItem>
                                    <SelectItem value="Done">Success</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Quick Add Bar */}
                        <div className="p-4 bg-primary/5 border-b flex gap-2">
                            <div className="relative flex-1">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                <input
                                    type="text"
                                    placeholder="Quickly add a new project task... (Press Enter)"
                                    className="w-full bg-white border-primary/20 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            const title = e.currentTarget.value;
                                            e.currentTarget.value = '';
                                            try {
                                                const response = await fetch("/api/tasks", {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({
                                                        title,
                                                        projectId,
                                                        priority: "Medium"
                                                    }),
                                                });
                                                if (response.ok) fetchProjectTasks();
                                            } catch (error) {
                                                console.error("Quick add failed:", error);
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/20 hover:bg-primary/10 text-primary"
                                onClick={() => setCreateDialogOpen(true)}
                            >
                                Detailed Add
                            </Button>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : rootTasks.length === 0 ? (
                                <div className="text-center py-12">
                                    <Plus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground">This project is a blank canvas. Start adding tasks!</p>
                                </div>
                            ) : (
                                <TaskList tasks={tasks} initialTasks={filteredTasks} onTaskUpdate={fetchProjectTasks} />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <CreateTaskDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onTaskCreated={fetchProjectTasks}
                projectId={projectId}
            />
        </Layout>
    );
}
