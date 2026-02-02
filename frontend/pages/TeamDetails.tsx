import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, CheckCircle2, Circle, AlertCircle, Trash2, Plus, User as UserIcon } from 'lucide-react';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTeamTaskDialog } from '@/components/tasks/CreateTeamTaskDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamMember {
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: string;
  jobTitle: string;
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  priority?: 'Low' | 'Medium' | 'High';
  deadline?: string;
  assignedTo?: string | { _id: string; name: string };
  teamId?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdBy?: string;
}

export default function TeamDetails() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Check if current user has permission to add tasks
  const canManageTasks = team?.members.some(m =>
    m.userId._id === user?._id && (m.role === 'Owner' || m.role === 'Admin')
  );

  useEffect(() => {
    fetchTeamDetails();
    fetchTeamTasks();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const fetchTeamTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/team/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching team tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const rootTasks = tasks.filter(t => !(t as any).parentId);
  const filteredTasks = filterStatus === 'all'
    ? rootTasks
    : rootTasks.filter(t => t.status === filterStatus);

  const todoCount = rootTasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = rootTasks.filter(t => t.status === 'In Progress').length;
  const doneCount = rootTasks.filter(t => t.status === 'Done').length;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Low':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted';
    }
  };

  const getAssigneeName = (assignedTo?: any) => {
    if (!assignedTo) return 'Unassigned';
    if (typeof assignedTo === 'string') {
      const member = team?.members.find(m => m.userId._id === assignedTo);
      return member ? member.userId.name : 'Unknown';
    }
    return assignedTo.name || 'Unknown';
  };

  if (!team) {
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
              onClick={() => navigate('/teams')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground mt-2">{team.description}</p>
              )}
            </div>
          </div>
          {/* Only show Add Task button for Owner or Admin */}
          {canManageTasks && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all transform hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task to Team
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
              <CardDescription>{team.members.length} members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div key={member.userId._id} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{member.userId.name}</p>
                      <p className="text-xs text-muted-foreground">{member.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{member.userId.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Stats */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">{rootTasks.length}</p>
                  <p className="text-muted-foreground text-sm">Total Tasks</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{todoCount}</p>
                    <p className="text-xs text-muted-foreground">Todo</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{inProgressCount}</p>
                    <p className="text-xs text-muted-foreground">Progress</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{doneCount}</p>
                    <p className="text-xs text-muted-foreground">Done</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Priority Tasks */}
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {rootTasks.filter(t => t.priority === 'High').length}
                  </p>
                  <p className="text-muted-foreground text-sm">High Priority</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Focus on completing these tasks first
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Team Tasks</CardTitle>
              <CardDescription>All tasks assigned to this team</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="Todo">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Circle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {filterStatus === 'all' ? 'No tasks yet' : `No ${filterStatus.toLowerCase()} tasks`}
                </p>
              </div>
            ) : (
              <TaskList tasks={tasks} initialTasks={filteredTasks} onTaskUpdate={fetchTeamTasks} />
            )}
          </CardContent>
        </Card>
      </div>

      <CreateTeamTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTaskCreated={fetchTeamTasks}
        teamId={teamId || ""}
        members={team.members}
      />
    </Layout>
  );
}
