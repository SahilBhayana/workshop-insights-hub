import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, BookOpen, Calendar, Users as UsersIcon } from "lucide-react";

const CATEGORIES = ["coding", "digital marketing", "AI", "data science", "design", "general"];

const Workshops = () => {
  const { role, user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentView, setStudentView] = useState<"mine" | "browse">("mine");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "general",
    start_date: "", end_date: "", total_sessions: 1, max_participants: 30,
  });

  const fetchWorkshops = async () => {
    let query = supabase.from("workshops").select("*, profiles!workshops_trainer_id_fkey(name)");
    if (role === "trainer" && user) {
      query = query.eq("trainer_id", user.id);
    }
    const { data } = await query.order("start_date", { ascending: false });
    setWorkshops(data || []);

    if (role === "student" && user) {
      const { data: enr } = await supabase
        .from("enrollments")
        .select("workshop_id")
        .eq("student_id", user.id);
      setEnrolledIds((enr || []).map((e: any) => e.workshop_id));
    }
  };

  useEffect(() => { fetchWorkshops(); }, [role, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("workshops").insert({
      ...form,
      trainer_id: role === "trainer" ? user?.id : undefined,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Workshop created!");
      setDialogOpen(false);
      setForm({ title: "", description: "", category: "general", start_date: "", end_date: "", total_sessions: 1, max_participants: 30 });
      fetchWorkshops();
    }
  };

  const handleEnroll = async (workshopId: string) => {
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({
      student_id: user.id,
      workshop_id: workshopId,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already enrolled!" : error.message);
    } else {
      toast.success("Enrolled successfully!");
      setEnrolledIds((prev) => [...prev, workshopId]);
    }
  };

  const filtered = workshops.filter((w) => {
    const matchSearch = w.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || w.category === categoryFilter;
    const today = new Date().toISOString().split("T")[0];
    const endRef = w.end_date || w.start_date;
    let matchStatus = true;
    if (statusFilter === "upcoming") matchStatus = w.start_date >= today;
    else if (statusFilter === "ongoing") matchStatus = w.start_date <= today && endRef >= today;
    else if (statusFilter === "ended") matchStatus = endRef < today;
    let matchStudent = true;
    if (role === "student" && studentView === "mine") {
      matchStudent = enrolledIds.includes(w.id);
    }
    return matchSearch && matchCat && matchStatus && matchStudent;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {role === "trainer" ? "My Workshops" : "Workshops"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "student" ? "Browse and enroll in workshops" : "Manage workshop catalog"}
          </p>
        </div>
        {(role === "admin" || role === "trainer") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Workshop</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Workshop</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Sessions</Label>
                    <Input type="number" min={1} value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: +e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Input type="number" min={1} value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: +e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Create Workshop</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search workshops..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {role === "student" && (
          <Select value={studentView} onValueChange={(v: "mine" | "browse") => setStudentView(v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My Workshops</SelectItem>
              <SelectItem value="browse">Browse All</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workshops</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
          <Card key={w.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="font-heading text-base">{w.title}</CardTitle>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">{w.category}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {w.description && <p className="text-sm text-muted-foreground line-clamp-2">{w.description}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {w.start_date}</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {w.total_sessions} sessions</span>
                <span className="flex items-center gap-1"><UsersIcon className="h-3 w-3" /> max {w.max_participants}</span>
              </div>
              {w.profiles?.name && <p className="text-xs text-muted-foreground">Trainer: {w.profiles.name}</p>}
              {role === "student" && (
                <Button size="sm" className="w-full" onClick={() => handleEnroll(w.id)}>Enroll</Button>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex h-40 items-center justify-center text-sm text-muted-foreground">
            No workshops found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Workshops;
