import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Package, Truck, CheckCircle2, XCircle, Star } from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  seller_id: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_method: string | null;
  shipping_address: string | null;
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  refund_amount: number | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusColor: Record<string, string> = {
  paid: "bg-blue-500",
  shipped: "bg-amber-500",
  delivered: "bg-green-500",
  completed: "bg-emerald-600",
  cancelled: "bg-gray-500",
  refunded: "bg-red-500",
  pending: "bg-yellow-500",
};

const statusLabel: Record<string, string> = {
  paid: "Opłacone",
  shipped: "Wysłane",
  delivered: "Dostarczone",
  completed: "Zakończone",
  cancelled: "Anulowane",
  refunded: "Zwrócone",
  pending: "Oczekuje",
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await fetchOrders(session.user.id);
  };

  const fetchOrders = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("buyer_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Nie udało się pobrać zamówień");
    } else {
      setOrders((data as Order[]) || []);
    }
    setLoading(false);
  };

  const handleConfirm = async (orderId: string) => {
    setActioning(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed", confirmed_at: new Date().toISOString() })
      .eq("id", orderId);
    setActioning(null);
    if (error) {
      toast.error("Nie udało się potwierdzić odbioru");
    } else {
      toast.success("Dziękujemy za potwierdzenie odbioru!");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchOrders(session.user.id);
    }
  };

  const handleRequestRefund = async (orderId: string) => {
    const reason = prompt("Powód zwrotu:");
    if (!reason) return;
    setActioning(orderId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.functions.invoke("refund-order", {
      body: { order_id: orderId, reason },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setActioning(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || "Nie udało się wykonać zwrotu");
    } else {
      toast.success("Zwrot wykonany pomyślnie");
      await fetchOrders(session.user.id);
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Moje zakupy</h1>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-3 opacity-40" />
                Brak zamówień. <Button variant="link" onClick={() => navigate("/products")}>Przeglądaj produkty</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base font-mono">#{o.id.slice(0, 8)}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(o.created_at).toLocaleString("pl-PL")}
                      </p>
                    </div>
                    <Badge className={`${statusColor[o.status] || "bg-gray-400"} text-white`}>
                      {statusLabel[o.status] || o.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pozycji:</span>
                      <span>{o.order_items?.length ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kwota:</span>
                      <span className="font-semibold">£{Number(o.total_amount).toFixed(2)}</span>
                    </div>
                    {o.shipping_method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Wysyłka:</span>
                        <span>{o.shipping_method}</span>
                      </div>
                    )}
                    {o.tracking_number && (
                      <div className="rounded-md bg-muted p-3 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <Truck className="h-4 w-4" /> Nr przesyłki: {o.tracking_number}
                          {o.carrier && <span className="text-muted-foreground">({o.carrier})</span>}
                        </div>
                        {o.shipped_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Wysłane {new Date(o.shipped_at).toLocaleDateString("pl-PL")}
                          </p>
                        )}
                      </div>
                    )}
                    {o.refund_amount && Number(o.refund_amount) > 0 && (
                      <div className="text-sm text-red-600">
                        Zwrócono: £{Number(o.refund_amount).toFixed(2)}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(o.status === "shipped" || o.status === "delivered") && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(o.id)}
                          disabled={actioning === o.id}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Potwierdź odbiór
                        </Button>
                      )}
                      {(o.status === "paid" || o.status === "shipped") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestRefund(o.id)}
                          disabled={actioning === o.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Zażądaj zwrotu
                        </Button>
                      )}
                      {(o.status === "delivered" || o.status === "completed") &&
                        o.order_items?.map((it) => (
                          <Button
                            key={it.id}
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/product/${it.product_id}#reviews`)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Wystaw opinię
                          </Button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;
