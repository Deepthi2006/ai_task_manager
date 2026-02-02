import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle, AlertCircle, Trash2, Plus } from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  priority?: "Low" | "Medium" | "High";
  deadline?: string;
  parentId?: string;
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: () => void;
  initialTasks?: Task[]; // entry points
}

export function TaskList({ tasks, onTaskUpdate, initialTasks }: TaskListProps) {
  const { token } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<{ id: string; title: string } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Entry points for rendering
  const entryTasks = initialTasks || tasks.filter(t => !t.parentId);

  const renderTask = (task: Task, depth: number = 0) => {
    const children = tasks.filter(t => t.parentId === task._id);
    const isExpanded = expandedTasks.has(task._id);

    return (
      <div key={task._id} className="space-y-2">
        <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${depth > 0 ? 'ml-8 border-l-4 border-l-primary/30' : ''}`}
          onClick={() => toggleExpand(task._id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5">{getStatusIcon(task.status)}</div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {task.title}
                </h3>
                {task.description && (isExpanded || depth === 0) && (
                  <p className={`text-sm text-muted-foreground mt-1 ${isExpanded ? '' : 'line-clamp-1'}`}>
                    {task.description}
                  </p>
                )}
                {children.length > 0 && !isExpanded && (
                  <p className="text-xs text-primary mt-1 font-medium">
                    {children.length} subtask{children.length !== 1 ? 's' : ''}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {task.priority && (
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Select
                value={task.status}
                onValueChange={(value) => updateTaskStatus(task._id, value)}
                disabled={updatingId === task._id}
              >
                <SelectTrigger className="w-28 h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todo">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveParent({ id: task._id, title: task.title });
                  setCreateSubtaskOpen(true);
                }}
                className="h-8 w-8 text-primary hover:bg-primary/10"
                title="Add Subtask"
              >
                <Plus className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task._id);
                }}
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
        {children.length > 0 && isExpanded && (
          <div className="space-y-2">
            {children.map(child => renderTask(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "Medium":
        return "bg-yellow-100/50 text-yellow-800 border-yellow-200/50";
      case "Low":
        return "bg-green-100/50 text-green-800 border-green-200/50";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "In Progress":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {entryTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground italic">
          No tasks to show
        </div>
      ) : (
        entryTasks.map(task => renderTask(task))
      )}

      <CreateTaskDialog
        open={createSubtaskOpen}
        onOpenChange={setCreateSubtaskOpen}
        onTaskCreated={() => {
          onTaskUpdate();
          setCreateSubtaskOpen(false);
        }}
        parentId={activeParent?.id}
        parentTaskName={activeParent?.title}
      />
    </div>
  );
}
