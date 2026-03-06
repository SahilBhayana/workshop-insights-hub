import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { BookOpen, Users, CalendarCheck, Award, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = [
  "hsl(168, 80%, 36%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)", "hsl(0, 72%, 51%)",
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ workshops: 0, enrollments: 0, sessions: 0, certificates: 0 });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ name: string; present: number; absent: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [ws, en, se, ce] = await Promise.all([
        supabase.from("workshops").select("id, category", { count: "exact" }),
        supabase.from("enrollments").select("id", { count: "exact" }),
        supabase.from("sessions").select("id", { count: "exact" }),
        supabase.from("certificates").select("id", { count: "exact" }),
      ]);

      setStats({
        workshops: ws.count || 0,
        enrollments: en.count || 0,
        sessions: se.count || 0,
        certificates: ce.count || 0,
      });

      // Category distribution
      if (ws.data) {
        const cats: Record<string, number> = {};
        ws.data.forEach((w: any) => { cats[w.category] = (cats[w.category] || 0) + 1; });
        setCategoryData(Object.entries(cats).map(([name, value]) => ({ name, value })));
      }

      // Attendance stats per workshop
      const { data: attData } = await supabase
        .from("attendance")
        .select("status, session_id");
      
      if (attData && attData.length > 0) {
        const present = attData.filter((a: any) => a.status === "present").length;
        const absent = attData.filter((a: any) => a.status === "absent").length;
        setAttendanceData([
          { name: "Present", present, absent: 0 },
          { name: "Absent", present: 0, absent },
        ]);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your workshop management system</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Workshops" value={stats.workshops} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Enrollments" value={stats.enrollments} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Sessions" value={stats.sessions} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard title="Certificates" value={stats.certificates} icon={<Award className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <BarChart3 className="h-4 w-4 text-primary" /> Workshop Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No workshop data yet. Create workshops to see analytics.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="present" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                No attendance data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [stats, setStats] = useState({ workshops: 0, sessions: 0, avgAttendance: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: ws } = await supabase
        .from("workshops")
        .select("*")
        .eq("trainer_id", user.id);
      
      setWorkshops(ws || []);
      setStats((s) => ({ ...s, workshops: ws?.length || 0 }));
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Trainer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your workshops and track attendance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="My Workshops" value={stats.workshops} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Total Sessions" value={stats.sessions} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard title="Avg Attendance" value={`${stats.avgAttendance}%`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Assigned Workshops</CardTitle>
        </CardHeader>
        <CardContent>
          {workshops.length > 0 ? (
            <div className="space-y-3">
              {workshops.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">{w.title}</p>
                    <p className="text-sm text-muted-foreground">{w.category} • {w.total_sessions} sessions</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {w.start_date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No workshops assigned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [enRes, certRes, attRes] = await Promise.all([
        supabase.from("enrollments").select("*, workshops(*)").eq("student_id", user.id),
        supabase.from("certificates").select("*, workshops(title)").eq("student_id", user.id),
        supabase.from("attendance").select("status").eq("student_id", user.id),
      ]);
      setEnrollments(enRes.data || []);
      setCertificates(certRes.data || []);

      if (attRes.data && attRes.data.length > 0) {
        const present = attRes.data.filter((a: any) => a.status === "present").length;
        setAttendanceRate(Math.round((present / attRes.data.length) * 100));
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track your workshop progress and attendance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Enrolled Workshops" value={enrollments.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Attendance Rate" value={`${attendanceRate}%`} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard title="Certificates" value={certificates.length} icon={<Award className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Enrolled Workshops</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">{e.workshops?.title}</p>
                      <p className="text-sm text-muted-foreground">{e.workshops?.category}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Enrolled
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not enrolled in any workshops yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            {certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-4">
                    <Award className="h-8 w-8 text-warning" />
                    <div>
                      <p className="font-medium text-foreground">{c.workshops?.title}</p>
                      <p className="text-sm text-muted-foreground">Issued: {new Date(c.issue_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No certificates earned yet. Complete workshops to earn certificates!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { role } = useAuth();

  if (role === "admin") return <AdminDashboard />;
  if (role === "trainer") return <TrainerDashboard />;
  return <StudentDashboard />;
};

export default Dashboard;
