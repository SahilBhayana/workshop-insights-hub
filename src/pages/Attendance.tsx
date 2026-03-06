import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarCheck, Check, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Attendance = () => {
  const { role, user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [newSessionDate, setNewSessionDate] = useState("");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Student-specific state
  const [myAttendance, setMyAttendance] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkshops = async () => {
      let query = supabase.from("workshops").select("*");
      if (role === "trainer" && user) {
        query = query.eq("trainer_id", user.id);
      }
      const { data } = await query;
      setWorkshops(data || []);
    };
    fetchWorkshops();
  }, [role, user]);

  useEffect(() => {
    if (role === "student" && user) {
      const fetchMyAttendance = async () => {
        const { data } = await supabase
          .from("attendance")
          .select("*, sessions(*, workshops(title))")
          .eq("student_id", user.id);
        setMyAttendance(data || []);
      };
      fetchMyAttendance();
    }
  }, [role, user]);

  useEffect(() => {
    if (!selectedWorkshop) return;
    const fetchSessions = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("workshop_id", selectedWorkshop)
        .order("session_date");
      setSessions(data || []);
    };
    fetchSessions();
  }, [selectedWorkshop]);

  useEffect(() => {
    if (!selectedSession) return;
    const fetchAttendance = async () => {
      // Get enrolled students
      const { data: enrolled } = await supabase
        .from("enrollments")
        .select("student_id, profiles!enrollments_student_id_fkey(name, email)")
        .eq("workshop_id", selectedWorkshop);
      setEnrolledStudents(enrolled || []);

      // Get attendance records
      const { data: att } = await supabase
        .from("attendance")
        .select("*")
        .eq("session_id", selectedSession);
      setAttendanceRecords(att || []);
    };
    fetchAttendance();
  }, [selectedSession, selectedWorkshop]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionNum = sessions.length + 1;
    const { error } = await supabase.from("sessions").insert({
      workshop_id: selectedWorkshop,
      session_date: newSessionDate,
      session_number: sessionNum,
      qr_code: crypto.randomUUID(),
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Session created!");
      setSessionDialogOpen(false);
      setNewSessionDate("");
      // Refetch
      const { data } = await supabase.from("sessions").select("*").eq("workshop_id", selectedWorkshop).order("session_date");
      setSessions(data || []);
    }
  };

  const markAttendance = async (studentId: string, status: "present" | "absent") => {
    const existing = attendanceRecords.find((a) => a.student_id === studentId);
    if (existing) {
      const { error } = await supabase.from("attendance").update({ status }).eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("attendance").insert({
        session_id: selectedSession,
        student_id: studentId,
        status,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Marked ${status}`);
    // Refetch
    const { data } = await supabase.from("attendance").select("*").eq("session_id", selectedSession);
    setAttendanceRecords(data || []);
  };

  if (role === "student") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Attendance</h1>
          <p className="text-sm text-muted-foreground">Track your attendance history</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {myAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workshop</TableHead>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAttendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.sessions?.workshops?.title}</TableCell>
                      <TableCell>{a.sessions?.session_date}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "present" ? "default" : "destructive"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No attendance records yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Attendance Management</h1>
        <p className="text-sm text-muted-foreground">Mark and manage student attendance</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={selectedWorkshop} onValueChange={(v) => { setSelectedWorkshop(v); setSelectedSession(""); }}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select Workshop" /></SelectTrigger>
          <SelectContent>
            {workshops.map((w) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
          </SelectContent>
        </Select>

        {selectedWorkshop && (
          <>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select Session" /></SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>Session {s.session_number} - {s.session_date}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Session</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">Create Session</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Date</Label>
                    <Input type="date" value={newSessionDate} onChange={(e) => setNewSessionDate(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full">Create Session</Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {selectedSession && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" /> Mark Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((s) => {
                    const record = attendanceRecords.find((a) => a.student_id === s.student_id);
                    return (
                      <TableRow key={s.student_id}>
                        <TableCell className="font-medium">{s.profiles?.name}</TableCell>
                        <TableCell>{s.profiles?.email}</TableCell>
                        <TableCell>
                          {record ? (
                            <Badge variant={record.status === "present" ? "default" : "destructive"}>
                              {record.status}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not marked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => markAttendance(s.student_id, "present")}>
                              <Check className="mr-1 h-3 w-3" /> Present
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => markAttendance(s.student_id, "absent")}>
                              <X className="mr-1 h-3 w-3" /> Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No students enrolled in this workshop.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
