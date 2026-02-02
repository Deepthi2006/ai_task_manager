import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";

interface TeamMember {
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    role: string;
    jobTitle: string;
}

interface CreateTeamTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskCreated: () => void;
    teamId: string;
    members: TeamMember[];
}

export function CreateTeamTaskDialog({
    open,
    onOpenChange,
    onTaskCreated,
    teamId,
    members,
}: CreateTeamTaskDialogProps) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.title.trim()) {
            setError("Task title is required");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    teamId,
                    assignedTo: (formData.assignedTo === "none" || !formData.assignedTo) ? null : formData.assignedTo,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create task");
            }

            setFormData({ title: "", description: "", priority: "Medium", assignedTo: "" });
            onOpenChange(false);
            onTaskCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Task to Team</DialogTitle>
                    <DialogDescription>
                        Assign a new task to a team member.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Task Title *
                        </Label>
                        <Input
                            id="title"
                            placeholder="e.g., Fix login bug"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            disabled={loading}
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Add more details about this task..."
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            disabled={loading}
                            className="bg-white min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-medium">
                                Priority
                            </Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, priority: value })
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignedTo" className="text-sm font-medium">
                                Assign To
                            </Label>
                            <Select
                                value={formData.assignedTo}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, assignedTo: value })
                                }
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {members.map((member) => (
                                        <SelectItem key={member.userId._id} value={member.userId._id}>
                                            {member.userId.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-600 shadow-md"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add to Team"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
