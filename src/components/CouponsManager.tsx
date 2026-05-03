import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Tag, Plus } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  active: boolean;
}

export const CouponsManager = ({ sellerId }: { sellerId: string }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minAmount, setMinAmount] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    setCoupons((data ?? []) as Coupon[]);
  };

  useEffect(() => {
    load();
  }, [sellerId]);

  const create = async () => {
    if (!code.trim() || !value) return toast.error("Wypełnij kod i wartość");
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      seller_id: sellerId,
      code: code.trim().toUpperCase(),
      discount_type: type,
      discount_value: Number(value),
      min_order_amount: Number(minAmount) || 0,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expires || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Ten kod już istnieje" : "Błąd zapisu");
      return;
    }
    toast.success("Kupon utworzony");
    setCode("");
    setValue("10");
    setMinAmount("0");
    setMaxUses("");
    setExpires("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Usunięto");
    load();
  };

  const toggleActive = async (c: Coupon) => {
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" /> Kupony rabatowe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label>Kod</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="LATO20" />
          </div>
          <div>
            <Label>Typ rabatu</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Procentowy (%)</SelectItem>
                <SelectItem value="fixed">Kwotowy (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Wartość</Label>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div>
            <Label>Min. zamówienie (£)</Label>
            <Input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          </div>
          <div>
            <Label>Max. użyć (opcjonalne)</Label>
            <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </div>
          <div>
            <Label>Wygasa (opcjonalne)</Label>
            <Input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button onClick={create} disabled={saving} className="w-full md:w-auto gap-2">
              <Plus className="h-4 w-4" /> Utwórz kupon
            </Button>
          </div>
        </div>

        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Brak kuponów</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="font-mono font-bold text-primary">{c.code}</code>
                  <Badge variant="outline">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : `£${c.discount_value}`}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Użyć: {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}
                  </span>
                  {c.expires_at && (
                    <span className="text-xs text-muted-foreground">
                      Do: {new Date(c.expires_at).toLocaleDateString("pl-PL")}
                    </span>
                  )}
                  <Badge variant={c.active ? "default" : "secondary"}>
                    {c.active ? "Aktywny" : "Wyłączony"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(c)}>
                    {c.active ? "Wyłącz" : "Włącz"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
