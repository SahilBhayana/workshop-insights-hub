import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

const QRAttendance = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("workshops").select("*").eq("trainer_id", user.id).then(({ data }) => {
      setWorkshops(data || []);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedWorkshop) return;
    supabase.from("sessions").select("*").eq("workshop_id", selectedWorkshop).order("session_date").then(({ data }) => {
      setSessions(data || []);
    });
  }, [selectedWorkshop]);

  useEffect(() => {
    if (!selectedSession) return;
    const session = sessions.find((s) => s.id === selectedSession);
    if (session?.qr_code) {
      setQrValue(`${window.location.origin}/scan/${session.qr_code}`);
    }
  }, [selectedSession, sessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">QR Code Attendance</h1>
        <p className="text-sm text-muted-foreground">Generate QR codes for students to scan</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={selectedWorkshop} onValueChange={(v) => { setSelectedWorkshop(v); setSelectedSession(""); }}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select Workshop" /></SelectTrigger>
          <SelectContent>
            {workshops.map((w) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedWorkshop && (
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select Session" /></SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>Session {s.session_number} - {s.session_date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {qrValue && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" /> Scan to Mark Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <QRCodeSVG value={qrValue} size={240} level="H" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Students can scan this QR code to mark their attendance for this session.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRAttendance;
