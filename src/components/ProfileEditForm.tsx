import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import {
  DispatchAddressFields,
  validateDispatchAddress,
  type DispatchAddressValues,
} from "@/components/DispatchAddressFields";

interface ProfileEditFormProps {
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    dispatch_name?: string | null;
    dispatch_line1?: string | null;
    dispatch_line2?: string | null;
    dispatch_city?: string | null;
    dispatch_postcode?: string | null;
    dispatch_country?: string | null;
  };
  onSaved: () => void;
}

export const ProfileEditForm = ({ profile, onSaved }: ProfileEditFormProps) => {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [dispatch, setDispatch] = useState<DispatchAddressValues>({
    dispatch_name: profile.dispatch_name ?? profile.full_name ?? "",
    dispatch_line1: profile.dispatch_line1 ?? "",
    dispatch_line2: profile.dispatch_line2 ?? "",
    dispatch_city: profile.dispatch_city ?? "",
    dispatch_postcode: profile.dispatch_postcode ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDispatchChange = (field: keyof DispatchAddressValues, value: string) => {
    setDispatch((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Proszę wybrać plik graficzny");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maksymalny rozmiar pliku to 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setAvatarUrl(`${urlData.publicUrl}?t=${Date.now()}`);
      toast.success("Zdjęcie zostało przesłane");
    } catch (err: unknown) {
      toast.error("Nie udało się przesłać zdjęcia");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (bio.length > 500) {
      toast.error("Bio może mieć maksymalnie 500 znaków");
      return;
    }
    if (location.length > 100) {
      toast.error("Lokalizacja może mieć maksymalnie 100 znaków");
      return;
    }

    const dispatchError = validateDispatchAddress(dispatch);
    if (dispatchError) {
      toast.error(dispatchError);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        bio: bio.trim() || null,
        location: location.trim() || null,
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl || null,
        dispatch_name: dispatch.dispatch_name.trim() || null,
        dispatch_line1: dispatch.dispatch_line1.trim(),
        dispatch_line2: dispatch.dispatch_line2.trim() || null,
        dispatch_city: dispatch.dispatch_city.trim(),
        dispatch_postcode: dispatch.dispatch_postcode.trim().toUpperCase(),
        dispatch_country: "GB",
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast.error("Nie udało się zapisać zmian");
      console.error(error);
    } else {
      toast.success("Profil został zaktualizowany");
      onSaved();
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Edytuj Profil</h2>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
            <AvatarFallback className="bg-gradient-hero">
              <User className="h-12 w-12 text-white" />
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow hover:opacity-90 transition-opacity"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Kliknij ikonę aparatu, aby zmienić zdjęcie profilowe.
          <br />
          Maks. 5MB, formaty: JPG, PNG, WebP.
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Imię i nazwisko</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jan Kowalski"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokalizacja</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. London, UK"
          maxLength={100}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border/60 p-4">
        <div>
          <h3 className="font-semibold">Dispatch address (UK) *</h3>
          <p className="text-sm text-muted-foreground">
            Required for buying and selling. Used for shipping labels.
          </p>
        </div>
        <DispatchAddressFields
          values={dispatch}
          onChange={handleDispatchChange}
          idPrefix="profile-dispatch"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">O mnie</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Napisz kilka słów o sobie..."
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zapisywanie...
          </>
        ) : (
          "Zapisz zmiany"
        )}
      </Button>
    </Card>
  );
};
