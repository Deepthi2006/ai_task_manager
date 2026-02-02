import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Video,
  MapPin,
  Monitor,
  Clock,
  Edit2
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: 'virtual' | 'in-person' | 'hybrid';
  participants: string[];
  teamId?: string;
  createdBy: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface Team {
  _id: string;
  name: string;
}

export default function ScheduleMeeting() {
  const { token, user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    meetingType: 'virtual',
    teamId: '',
  });

  useEffect(() => {
    fetchTeams();
    const storedMeetings = localStorage.getItem('meetings');
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('meetings', JSON.stringify(meetings));
  }, [meetings]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setMeetings(meetings.map(m => m._id === editingId ? {
        ...m,
        ...formData,
        _id: editingId
      } as Meeting : m));
      setEditingId(null);
    } else {
      const newMeeting: Meeting = {
        ...formData,
        _id: Math.random().toString(36).substr(2, 9),
        createdBy: user?._id || '',
        status: 'scheduled',
        participants: []
      } as Meeting;
      setMeetings([...meetings, newMeeting]);
    }
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      meetingType: 'virtual',
      teamId: '',
    });
  };

  const handleDelete = (id: string) => {
    setMeetings(meetings.filter(m => m._id !== id));
  };

  const handleEdit = (meeting: Meeting) => {
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location || '',
      meetingType: meeting.meetingType,
      teamId: meeting.teamId || '',
    });
    setEditingId(meeting._id);
    setShowForm(true);
  };

  const upcomingMeetings = meetings
    .filter(m => {
      const meetingDate = startOfDay(new Date(m.date));
      const today = startOfDay(new Date());
      return isAfter(meetingDate, today) || meetingDate.getTime() === today.getTime();
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastMeetings = meetings
    .filter(m => isBefore(startOfDay(new Date(m.date)), startOfDay(new Date())))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'virtual': return <Video className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      case 'hybrid': return <Monitor className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
            <p className="text-muted-foreground mt-1">Schedule and manage your team meetings</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary-600">
            {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Schedule Meeting</>}
          </Button>
        </div>

        {showForm && (
          <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Meeting' : 'Schedule New Meeting'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Meeting Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <Select
                      value={formData.meetingType}
                      onValueChange={v => setFormData({ ...formData, meetingType: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="in-person">In-person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location / Meeting Link</Label>
                    <Input
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Zoom link or Room name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invite Team</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={v => setFormData({ ...formData, teamId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team._id} value={team._id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Agenda, goals, etc."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary">
                    {editingId ? 'Update Meeting' : 'Schedule Meeting'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Meetings */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Upcoming Meetings
            </h2>
            <div className="space-y-4">
              {upcomingMeetings.length === 0 ? (
                <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No upcoming meetings scheduled</p>
                </div>
              ) : (
                upcomingMeetings.map(meeting => (
                  <Card key={meeting._id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                              {getMeetingIcon(meeting.meetingType)}
                              <span className="ml-1 capitalize">{meeting.meetingType}</span>
                            </Badge>
                            <h3 className="font-bold text-lg">{meeting.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {format(new Date(meeting.date), 'PPP')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {meeting.startTime} - {meeting.endTime}
                            </div>
                          </div>
                          {meeting.location && (
                            <p className="text-sm text-primary underline truncate max-w-xs">{meeting.location}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(meeting)}>
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(meeting._id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Past Meetings */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">Past Meetings</h2>
            <div className="space-y-4 opacity-70">
              {pastMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-4">No past meetings recorded</p>
              ) : (
                pastMeetings.map(meeting => (
                  <Card key={meeting._id} className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{meeting.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(meeting.date), 'PP')} • {meeting.startTime}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">Completed</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
