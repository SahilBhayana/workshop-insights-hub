import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Star } from "lucide-react";

const Feedback = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [myFeedback, setMyFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("enrollments").select("workshop_id, workshops(title)").eq("student_id", user.id),
      supabase.from("feedback").select("*, workshops(title)").eq("student_id", user.id),
    ]).then(([enRes, fbRes]) => {
      setEnrollments(enRes.data || []);
      setMyFeedback(fbRes.data || []);
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWorkshop) return;
    const { error } = await supabase.from("feedback").insert({
      student_id: user.id,
      workshop_id: selectedWorkshop,
      rating,
      comment,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already submitted feedback!" : error.message);
    } else {
      toast.success("Feedback submitted!");
      setComment("");
      setSelectedWorkshop("");
      const { data } = await supabase.from("feedback").select("*, workshops(title)").eq("student_id", user.id);
      setMyFeedback(data || []);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Feedback</h1>
        <p className="text-sm text-muted-foreground">Share your workshop experience</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Submit Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Workshop</Label>
              <Select value={selectedWorkshop} onValueChange={setSelectedWorkshop}>
                <SelectTrigger><SelectValue placeholder="Select a workshop" /></SelectTrigger>
                <SelectContent>
                  {enrollments.map((e) => (
                    <SelectItem key={e.workshop_id} value={e.workshop_id}>{e.workshops?.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" onClick={() => setRating(v)}>
                    <Star className={`h-6 w-6 ${v <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
            </div>
            <Button type="submit" className="w-full">Submit Feedback</Button>
          </form>
        </CardContent>
      </Card>

      {myFeedback.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Your Feedback</h2>
          {myFeedback.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-start gap-4 pt-6">
                <div>
                  <p className="font-medium text-foreground">{f.workshops?.title}</p>
                  <div className="flex gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star key={v} className={`h-4 w-4 ${v <= f.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  {f.comment && <p className="text-sm text-muted-foreground">{f.comment}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;
