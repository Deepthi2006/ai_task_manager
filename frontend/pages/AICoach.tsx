import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Calendar, Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface ScheduleItem {
  title: string;
  priority: string;
  description: string;
  start: string;
  end: string;
  duration: number;
  reasoning: string;
}

interface ProductivityMetrics {
  score: number;
  metrics: {
    tasksCompleted: number;
    completionRate: number;
    averageTimePerTask: number;
    highPriorityCompleted: number;
    trend: string;
  };
  suggestions: string[];
}

interface BurnoutMetrics {
  score: number;
  level: string;
  metrics: {
    unfinishedTasks: number;
    highPriorityUnfinished: number;
    inProgressCount: number;
    taskLoadRatio: string;
    averageTimePerTask: number;
    recommendation: string;
  };
  reasons: string[];
  recoveryTips: string[];
}

export default function AICoach() {
  const { token } = useAuth();
  const [coaching, setCoaching] = useState('');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [productivity, setProductivity] = useState<ProductivityMetrics | null>(null);
  const [burnout, setBurnout] = useState<BurnoutMetrics | null>(null);

  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingProductivity, setLoadingProductivity] = useState(false);
  const [loadingBurnout, setLoadingBurnout] = useState(false);

  useEffect(() => {
    fetchProductivityScore();
    fetchBurnoutScore();
  }, []);

  const fetchCoachingAdvice = async () => {
    setLoadingCoach(true);
    try {
      const response = await fetch('/api/agent/coach', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setCoaching(data.advice || '');
    } catch (error) {
      console.error('Error fetching coaching advice:', error);
    } finally {
      setLoadingCoach(false);
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

  const fetchProductivityScore = async () => {
    setLoadingProductivity(true);
    try {
      const response = await fetch('/api/agent/productivity-score', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setProductivity(data);
    } catch (error) {
      console.error('Error fetching productivity score:', error);
    } finally {
      setLoadingProductivity(false);
    }
  };

  const fetchBurnoutScore = async () => {
    setLoadingBurnout(true);
    try {
      const response = await fetch('/api/agent/burnout-score', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setBurnout(data);
    } catch (error) {
      console.error('Error fetching burnout score:', error);
    } finally {
      setLoadingBurnout(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium':
        return 'bg-yellow-100/50 text-yellow-800 border-yellow-200/50';
      case 'Low':
        return 'bg-green-100/50 text-green-800 border-green-200/50';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">AI Coach</h1>
          <p className="text-muted-foreground mt-2">
            Get AI-powered insights, smart scheduling, and burnout prevention
          </p>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Smart Schedule
            </TabsTrigger>
            <TabsTrigger value="productivity">
              <TrendingUp className="w-4 h-4 mr-2" />
              Productivity
            </TabsTrigger>
            <TabsTrigger value="burnout">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Burnout Score
            </TabsTrigger>
          </TabsList>

          {/* Smart Scheduling Tab */}
          <TabsContent value="schedule" className="space-y-6 mt-6">
            {/* Smart Scheduling Card */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle>Smart Schedule</CardTitle>
                </div>
                <CardDescription>
                  AI-optimized schedule based on task analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={fetchSmartSchedule}
                  disabled={loadingSchedule}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loadingSchedule ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Generate Schedule
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Schedule Results */}
            {schedule.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Optimized Daily Schedule</CardTitle>
                  <CardDescription>
                    Based on your task priorities and historical time estimates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schedule.map((item, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{item.title}</h3>
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground italic">{item.reasoning}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {item.start} - {item.end}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.duration} mins
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Productivity Score Tab */}
          <TabsContent value="productivity" className="space-y-6 mt-6">
            {loadingProductivity ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : productivity ? (
              <div className="space-y-6">
                {/* Coaching Card moved here */}
                <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <CardTitle>Productivity Coach</CardTitle>
                    </div>
                    <CardDescription>
                      Get personalized coaching based on your patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {coaching ? (
                      <div className="bg-white/50 rounded-lg p-4 text-base text-foreground whitespace-pre-wrap">
                        {coaching}
                      </div>
                    ) : (
                      <div className="bg-white/50 rounded-lg p-4 text-sm text-muted-foreground text-center py-8">
                        Click below to get personalized advice
                      </div>
                    )}
                    <Button
                      onClick={fetchCoachingAdvice}
                      disabled={loadingCoach}
                      className="w-full bg-primary hover:bg-primary-600"
                    >
                      {loadingCoach ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting advice...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Get Coaching
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                  <CardHeader>
                    <CardTitle>Productivity Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Circle */}
                    <div className="flex justify-center">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="absolute inset-0" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="8"
                            strokeDasharray={`${(productivity.score / 100) * 339.3} 339.3`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary">{productivity.score}</div>
                          <div className="text-sm text-muted-foreground">/ 100</div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {productivity.metrics.tasksCompleted}
                        </p>
                        <p className="text-sm text-muted-foreground">Tasks Completed</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {productivity.metrics.completionRate}%
                        </p>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {productivity.metrics.averageTimePerTask}
                        </p>
                        <p className="text-sm text-muted-foreground">Avg Time (mins)</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {productivity.metrics.highPriorityCompleted}
                        </p>
                        <p className="text-sm text-muted-foreground">High Priority</p>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className="bg-white/50 rounded-lg p-4 text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {productivity.metrics.trend}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {productivity.suggestions && (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Improvement Roadmap
                      </CardTitle>
                      <CardDescription>
                        Actionable steps to reach your full potential
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 text-left">
                        {productivity.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-primary/10 px-3 py-1 rounded-full text-primary font-bold text-sm">
                              {idx + 1}
                            </div>
                            <p className="text-foreground font-medium text-base pt-0.5">
                              {suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </TabsContent>

          {/* Burnout Score Tab */}
          <TabsContent value="burnout" className="space-y-6 mt-6">
            {loadingBurnout ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : burnout ? (
              <>
                <Card className={
                  burnout.score > 70 ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200" :
                    burnout.score > 50 ? "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200" :
                      burnout.score > 30 ? "bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200" :
                        "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200"
                }>
                  <CardHeader>
                    <CardTitle>Burnout Risk Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status */}
                    <div className="text-center">
                      <p className="text-3xl font-bold mb-2">{burnout.level}</p>
                      <p className="text-base text-muted-foreground">
                        {burnout.metrics.recommendation}
                      </p>
                    </div>

                    {/* Burnout Score Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold">Burnout Score</p>
                        <p className="text-lg font-bold text-primary">{burnout.score}/100</p>
                      </div>
                      <Progress value={burnout.score} className="h-3" />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-2xl font-bold text-foreground">
                          {burnout.metrics.unfinishedTasks}
                        </p>
                        <p className="text-sm text-muted-foreground">Unfinished Tasks</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-2xl font-bold text-foreground">
                          {burnout.metrics.highPriorityUnfinished}
                        </p>
                        <p className="text-sm text-muted-foreground">High Priority</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-2xl font-bold text-foreground">
                          {burnout.metrics.inProgressCount}
                        </p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4">
                        <p className="text-2xl font-bold text-foreground">
                          {burnout.metrics.taskLoadRatio}
                        </p>
                        <p className="text-sm text-muted-foreground">Load Ratio</p>
                      </div>
                    </div>

                    {/* Detail Card */}
                    <div className="bg-white/50 rounded-lg p-4 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Task Time</span>
                        <span className="font-semibold">{burnout.metrics.averageTimePerTask} mins</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-3">
                        💡 Tip: A healthy task load ratio is 1:2 (unfinished to completed). Focus on completing more tasks to reduce stress.
                      </div>
                    </div>

                    {/* AI Burnout Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {/* Reasons */}
                      <Card className="border-red-200 bg-white/60">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-4 h-4" />
                            Burnout Drivers
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {burnout.reasons.map((reason, idx) => (
                              <li key={idx} className="text-base font-medium text-foreground flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Tips */}
                      <Card className="border-green-200 bg-white/60">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-700">
                            <Sparkles className="w-4 h-4" />
                            Recovery & Balance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {burnout.recoveryTips.map((tip, idx) => (
                              <li key={idx} className="text-base font-medium text-foreground flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
