import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { BookOpen, Users, TrendingUp, Award } from "lucide-react";

const COLORS = ["hsl(168, 80%, 36%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)", "hsl(0, 72%, 51%)"];

const Analytics = () => {
  const { role, user } = useAuth();
  const [workshopStats, setWorkshopStats] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({ workshops: 0, students: 0, avgAttendance: 0, certificates: 0 });

  useEffect(() => {
    const fetchAnalytics = async () => {
      let workshopQuery = supabase.from("workshops").select("*");
      if (role === "trainer" && user) workshopQuery = workshopQuery.eq("trainer_id", user.id);

      const [wsRes, attRes, certRes, enrollRes] = await Promise.all([
        workshopQuery,
        supabase.from("attendance").select("*"),
        supabase.from("certificates").select("*"),
        supabase.from("enrollments").select("*"),
      ]);

      const ws = wsRes.data || [];
      const att = attRes.data || [];
      const certs = certRes.data || [];
      const enrolls = enrollRes.data || [];

      // Stats
      const present = att.filter((a: any) => a.status === "present").length;
      const avgAtt = att.length > 0 ? Math.round((present / att.length) * 100) : 0;

      setTotalStats({
        workshops: ws.length,
        students: new Set(enrolls.map((e: any) => e.student_id)).size,
        avgAttendance: avgAtt,
        certificates: certs.length,
      });

      // Category distribution
      const cats: Record<string, number> = {};
      ws.forEach((w: any) => { cats[w.category] = (cats[w.category] || 0) + 1; });
      setCategoryData(Object.entries(cats).map(([name, value]) => ({ name, value })));

      // Per-workshop enrollment counts
      const wsStats = ws.map((w: any) => ({
        name: w.title?.substring(0, 15) || "Untitled",
        enrolled: enrolls.filter((e: any) => e.workshop_id === w.id).length,
      }));
      setWorkshopStats(wsStats);
    };

    fetchAnalytics();
  }, [role, user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights into workshop performance and engagement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Workshops" value={totalStats.workshops} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Unique Students" value={totalStats.students} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Avg Attendance" value={`${totalStats.avgAttendance}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Certificates" value={totalStats.certificates} icon={<Award className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Workshop Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            {workshopStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workshopStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="enrolled" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
