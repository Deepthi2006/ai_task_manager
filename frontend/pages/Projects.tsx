import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FolderOpen, Calendar, ChevronRight } from "lucide-react";

interface Project {
    _id: string;
    name: string;
    description?: string;
    status: "Active" | "Completed" | "On Hold" | "Planning";
    deadline?: string;
    teamId?: string;
}

export default function Projects() {
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "Planning",
        deadline: "",
    });

    useEffect(() => {
        fetchProjects();
    }, [token]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/projects", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsCreateOpen(false);
                setFormData({ name: "", description: "", status: "Planning", deadline: "" });
                fetchProjects();
            }
        } catch (error) {
            console.error("Error creating project:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-green-100 text-green-800 border-green-200";
            case "Planning": return "bg-blue-100 text-blue-800 border-blue-200";
            case "On Hold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Completed": return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "bg-muted";
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground font-display">Projects</h1>
                        <p className="text-muted-foreground mt-1">Organize your tasks into high-level projects</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <Plus className="w-4 h-4 mr-2" /> New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create Project</DialogTitle>
                                <DialogDescription>Add a new project to organize your work.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateProject} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Project Name</Label>
                                    <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Website Redesign" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What is this project about?" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Planning">Planning</SelectItem>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="On Hold">On Hold</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deadline">Deadline</Label>
                                        <Input id="deadline" type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create Project</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
                        <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">No projects found</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Create your first project to start organizing tasks effectively.</p>
                        <Button variant="outline" className="mt-6" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create First Project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <Card
                                key={project._id}
                                className="group hover:border-primary/40 transition-all hover:shadow-md cursor-pointer"
                                onClick={() => navigate(`/projects/${project._id}`)}
                            >
                                <CardHeader className="pb-3 text-left">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className={getStatusColor(project.status)}>
                                            {project.status}
                                        </Badge>
                                        {project.deadline && (
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(project.deadline).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors text-left">{project.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-left">{project.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center text-sm font-medium text-primary">
                                            View Tasks <ChevronRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
