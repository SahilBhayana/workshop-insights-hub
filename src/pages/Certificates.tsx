import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

const Certificates = () => {
  const { role, user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from("certificates").select("*, workshops(title), profiles!certificates_student_id_fkey(name)");
      if (role === "student" && user) query = query.eq("student_id", user.id);
      const { data } = await query;
      setCertificates(data || []);
    };
    fetch();
  }, [role, user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-sm text-muted-foreground">
          {role === "student" ? "Your earned certificates" : "All issued certificates"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certificates.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="h-2 bg-warning" />
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Award className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">{c.workshops?.title}</p>
                {c.profiles?.name && <p className="text-sm text-muted-foreground">{c.profiles.name}</p>}
                <p className="text-xs text-muted-foreground">
                  Issued: {new Date(c.issue_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {certificates.length === 0 && (
          <div className="col-span-full flex h-40 items-center justify-center text-sm text-muted-foreground">
            No certificates yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
