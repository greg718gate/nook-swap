import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, X, ImagePlus, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { validateImageFile } from "@/lib/uploadValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_IMAGES = 5;
const MIN_IMAGES = 1;

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    condition: "good",
    status: "active",
    shipping_evri: "",
    shipping_royal_mail: "",
    shipping_inpost: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        navigate("/auth");
        return;
      }
      fetchProduct(currentUser.id);
      fetchCategories();
    });
  }, [navigate, id]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const fetchProduct = async (userId: string) => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.seller_id !== userId) {
        toast.error("You do not have permission to edit this product");
        navigate("/profile");
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        price: data.price.toString(),
        category_id: data.category_id || "",
        condition: data.condition || "good",
        status: data.status || "active",
        shipping_evri: data.shipping_evri?.toString() || "",
        shipping_royal_mail: data.shipping_royal_mail?.toString() || "",
        shipping_inpost: data.shipping_inpost?.toString() || "",
      });
      setExistingImages(data.images || []);
    } catch (error: any) {
      toast.error("Could not load product");
      navigate("/profile");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length;

    if (totalImages > MAX_IMAGES) {
      toast.error(`You can have at most ${MAX_IMAGES} photos`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const err = await validateImageFile(file);
      if (err) {
        toast.error(err);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setNewImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (url: string) => {
    setImagesToDelete(prev => [...prev, url]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (!user || newImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of newImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    const remainingExisting = existingImages.filter(img => !imagesToDelete.includes(img));
    const totalImages = remainingExisting.length + newImages.length;

    if (totalImages < MIN_IMAGES) {
      toast.error(`You must have at least ${MIN_IMAGES} product photo`);
      return;
    }

    setLoading(true);

    try {
      const newImageUrls = await uploadNewImages();
      const allImages = [...remainingExisting, ...newImageUrls];

      const { error } = await supabase
        .from("products")
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id || null,
          condition: formData.condition,
          status: formData.status,
          images: allImages,
          shipping_evri: parseFloat(formData.shipping_evri) || 0,
          shipping_royal_mail: parseFloat(formData.shipping_royal_mail) || 0,
          shipping_inpost: parseFloat(formData.shipping_inpost) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("seller_id", user.id);

      if (error) throw error;

      toast.success("Product updated!");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("seller_id", user.id);

      if (error) throw error;

      toast.success("Product deleted");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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

  const remainingExistingImages = existingImages.filter(img => !imagesToDelete.includes(img));
  const totalCurrentImages = remainingExistingImages.length + newImages.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">Edit Product</h1>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The product will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Product Photos *</Label>
                    <span className="text-sm text-muted-foreground">
                      {totalCurrentImages}/{MAX_IMAGES} (min. {MIN_IMAGES})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {remainingExistingImages.map((url, index) => (
                      <div key={url} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && newImages.length === 0 && (
                          <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {newImagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative group aspect-square">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border-2 border-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                          New
                        </span>
                      </div>
                    ))}
                    
                    {totalCurrentImages < MAX_IMAGES && (
                      <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Add photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={5}
                    required
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/2000
                  </p>
                </div>

                {/* Price and Condition */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (£) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) =>
                        setFormData({ ...formData, condition: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like-new">Like new</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipping */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">UK Shipping (£)</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_evri">Evri</Label>
                      <Input
                        id="shipping_evri"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_evri}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_evri: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_royal_mail">Royal Mail</Label>
                      <Input
                        id="shipping_royal_mail"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_royal_mail}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_royal_mail: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_inpost">InPost Lockers</Label>
                      <Input
                        id="shipping_inpost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_inpost}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_inpost: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading || uploadingImages}
                  >
                    {loading || uploadingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {uploadingImages ? "Uploading..." : "Saving..."}
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/profile")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProduct;