import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { toast } from "sonner";

interface ReportButtonProps {
  targetType: "product" | "user" | "review" | "message";
  targetId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

const REASONS = [
  "Spam lub oszustwo",
  "Treści niedozwolone / nielegalne",
  "Wprowadzające w błąd informacje",
  "Naruszenie praw autorskich",
  "Obraźliwe zachowanie",
  "Inne",
];

export const ReportButton = ({ targetType, targetId, variant = "ghost", size = "sm" }: ReportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Musisz być zalogowany, aby zgłosić");
      return;
    }
    if (!reason) {
      toast.error("Wybierz powód");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: session.user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Nie udało się wysłać zgłoszenia");
    } else {
      toast.success("Zgłoszenie wysłane. Dziękujemy!");
      setOpen(false);
      setReason("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Flag className="h-4 w-4" /> Zgłoś
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zgłoś treść</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Wybierz powód" /></SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Opisz problem (opcjonalnie)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting}>Wyślij zgłoszenie</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
