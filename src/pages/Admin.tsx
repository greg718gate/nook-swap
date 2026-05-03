import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  buyer_id: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: session.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      toast.error("Brak uprawnień administratora");
      navigate("/");
      return;
    }
    setAuthorized(true);
    await load();
    setLoading(false);
  };

  const load = async () => {
    const [{ data: r }, { data: o }] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id, status, total_amount, buyer_id, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setReports((r as Report[]) || []);
    setOrders((o as OrderRow[]) || []);
  };

  const updateReport = async (id: string, status: string) => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) toast.error("Nie udało się zaktualizować");
    else {
      toast.success("Zaktualizowano");
      load();
    }
  };

  if (loading || !authorized) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="container py-10">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Panel Administratora</h1>
          </div>

          <Tabs defaultValue="reports">
            <TabsList>
              <TabsTrigger value="reports">Zgłoszenia ({reports.filter(r => r.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="orders">Zamówienia</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-3 mt-4">
              {reports.length === 0 && <p className="text-muted-foreground">Brak zgłoszeń.</p>}
              {reports.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{r.target_type.toUpperCase()} — {r.reason}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {r.target_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString("pl-PL")}
                      </p>
                    </div>
                    <Badge variant={r.status === "pending" ? "destructive" : "secondary"}>{r.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.description && <p className="text-sm">{r.description}</p>}
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateReport(r.id, "resolved")}>Rozwiąż</Button>
                        <Button size="sm" variant="outline" onClick={() => updateReport(r.id, "dismissed")}>Odrzuć</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="orders" className="space-y-2 mt-4">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="font-mono text-sm">#{o.id.slice(0, 8)}</div>
                    <div className="text-sm">£{Number(o.total_amount).toFixed(2)}</div>
                    <Badge>{o.status}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("pl-PL")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
