import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon } from "lucide-react";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (!profiles) return;

      // Get roles for each
      const { data: roles } = await supabase.from("user_roles").select("*");
      const roleMap: Record<string, string> = {};
      roles?.forEach((r: any) => { roleMap[r.user_id] = r.role; });

      setUsers(profiles.map((p: any) => ({ ...p, role: roleMap[p.id] || "student" })));
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Manage platform users and roles</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : u.role === "trainer" ? "secondary" : "outline"} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
