import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";

interface SaleItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  orders: {
    id: string;
    status: string;
    total_amount: number;
    shipping_method: string | null;
    shipping_address: string | null;
    tracking_number: string | null;
    carrier: string | null;
    buyer_id: string;
  };
}

const statusLabel: Record<string, string> = {
  paid: "Opłacone",
  shipped: "Wysłane",
  delivered: "Dostarczone",
  completed: "Zakończone",
  cancelled: "Anulowane",
  refunded: "Zwrócone",
};

const SellerOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [tracking, setTracking] = useState<Record<string, { num: string; carrier: string }>>({});
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await fetchSales(session.user.id);
  };

  const fetchSales = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select("*, orders(*)")
      .eq("seller_id", uid)
      .order("created_at", { ascending: false });
    if (error) toast.error("Nie udało się pobrać sprzedaży");
    else setSales((data as SaleItem[]) || []);
    setLoading(false);
  };

  const markShipped = async (orderId: string) => {
    const t = tracking[orderId];
    if (!t?.num || !t?.carrier) {
      toast.error("Podaj nr przesyłki i kuriera");
      return;
    }
    setActing(orderId);
    const { error } = await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: t.num,
        carrier: t.carrier,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    setActing(null);
    if (error) toast.error("Nie udało się zaktualizować zamówienia");
    else {
      toast.success("Oznaczono jako wysłane");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchSales(session.user.id);
    }
  };

  if (loading) {
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

  // Group by order
  const byOrder = sales.reduce<Record<string, SaleItem[]>>((acc, s) => {
    (acc[s.order_id] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Sprzedaż</h1>
          {Object.keys(byOrder).length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Brak sprzedanych przedmiotów.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(byOrder).map(([orderId, items]) => {
                const order = items[0].orders;
                const sellerTotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
                const showShipBox = order.status === "paid";
                return (
                  <Card key={orderId}>
                    <CardHeader className="flex flex-row items-start justify-between pb-3">
                      <div>
                        <CardTitle className="text-base font-mono">#{orderId.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {items.length} pozycji · £{sellerTotal.toFixed(2)}
                        </p>
                      </div>
                      <Badge>{statusLabel[order.status] || order.status}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {order.shipping_address && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <div className="font-medium mb-1">Adres dostawy</div>
                          <div className="text-muted-foreground whitespace-pre-line">{order.shipping_address}</div>
                          {order.shipping_method && (
                            <div className="text-xs text-muted-foreground mt-1">Metoda: {order.shipping_method}</div>
                          )}
                        </div>
                      )}
                      {order.tracking_number && (
                        <div className="text-sm flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {order.carrier} — {order.tracking_number}
                        </div>
                      )}
                      {showShipBox && (
                        <div className="grid gap-2 sm:grid-cols-3 items-end">
                          <div>
                            <label className="text-xs text-muted-foreground">Kurier</label>
                            <Select
                              value={tracking[orderId]?.carrier || ""}
                              onValueChange={(v) =>
                                setTracking((p) => ({ ...p, [orderId]: { ...(p[orderId] || { num: "" }), carrier: v } }))
                              }
                            >
                              <SelectTrigger><SelectValue placeholder="Wybierz" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Royal Mail">Royal Mail</SelectItem>
                                <SelectItem value="Evri">Evri</SelectItem>
                                <SelectItem value="DPD">DPD</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Nr przesyłki</label>
                            <Input
                              value={tracking[orderId]?.num || ""}
                              onChange={(e) =>
                                setTracking((p) => ({ ...p, [orderId]: { ...(p[orderId] || { carrier: "" }), num: e.target.value } }))
                              }
                              placeholder="Tracking..."
                            />
                          </div>
                          <Button onClick={() => markShipped(orderId)} disabled={acting === orderId}>
                            Oznacz jako wysłane
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerOrders;
