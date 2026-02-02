import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Users, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Team {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  members: Array<{
    userId: { _id: string; name: string; email: string };
    role: string;
    jobTitle: string;
  }>;
}

export default function Teams() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinForm, setJoinForm] = useState({ inviteCode: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreateLoading(true);
    try {
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setCreateForm({ name: '', description: '' });
        setCreateDialogOpen(false);
        await fetchTeams();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.inviteCode.trim()) return;

    setJoinLoading(true);
    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(joinForm),
      });

      if (response.ok) {
        setJoinForm({ inviteCode: '' });
        setJoinDialogOpen(false);
        await fetchTeams();
      }
    } catch (error) {
      console.error('Error joining team:', error);
    } finally {
      setJoinLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your teams for better collaboration
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Join Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Team</DialogTitle>
                  <DialogDescription>
                    Enter the invite code provided by the team owner
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      placeholder="e.g., ABC123"
                      value={joinForm.inviteCode}
                      onChange={(e) => setJoinForm({ inviteCode: e.target.value.toUpperCase() })}
                      disabled={joinLoading}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button disabled={joinLoading}>
                      {joinLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Team'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Create a new team and invite members to collaborate
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      placeholder="e.g., Product Team"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      disabled={createLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamDesc">Description</Label>
                    <Textarea
                      id="teamDesc"
                      placeholder="Describe your team's purpose"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      disabled={createLoading}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button disabled={createLoading}>
                      {createLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Team'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-6">
                Create a new team or join an existing one to collaborate with others
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => (
              <Card key={team._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      {team.description && (
                        <CardDescription className="mt-2">{team.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Members */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Members ({team.members.length})</h4>
                    <div className="space-y-2">
                      {team.members.slice(0, 3).map((member) => (
                        <div key={member.userId._id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{member.userId.name}</p>
                            <p className="text-xs text-muted-foreground">{member.jobTitle}</p>
                          </div>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{team.members.length - 3} more</p>
                      )}
                    </div>
                  </div>

                  {/* Invite Code */}
                  <div className="bg-primary-50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono font-semibold text-foreground">{team.inviteCode}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyInviteCode(team.inviteCode)}
                      >
                        {copiedCode === team.inviteCode ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => navigate(`/teams/${team._id}`)}
                    >
                      View Details
                    </Button>
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
