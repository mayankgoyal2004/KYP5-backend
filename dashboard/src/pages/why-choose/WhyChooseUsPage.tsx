import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  HelpCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  ImagePlus,
} from "lucide-react";
import {
  useCreateWhyChooseCard,
  useDeleteWhyChooseCard,
  useWhyChooseCards,
  useUpdateWhyChooseCard,
} from "@/hooks/useWhyChoose";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsPage from "@/pages/settings/SettingsPage";
import { getImageUrl } from "@/lib/utils";

const cardSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  icon: z.string().optional(),
  order: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type CardForm = z.infer<typeof cardSchema>;

export default function WhyChooseUsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: viewMode === "grid" ? 9 : 10 };
    if (search) params.search = search;
    return params;
  }, [page, search, viewMode]);

  const { data, isLoading } = useWhyChooseCards(queryParams);
  const createMutation = useCreateWhyChooseCard();
  const updateMutation = useUpdateWhyChooseCard();
  const deleteMutation = useDeleteWhyChooseCard();

  const cards = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "",
      order: 0,
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      icon: "",
      order: 0,
      isActive: true,
    });
    setSelected(null);
    setIconFile(null);
    setIconPreview("");
  };

  const onIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const buildFormData = (values: CardForm) => {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("description", values.description);
    fd.append("order", String(values.order));
    fd.append("isActive", String(values.isActive));
    if (iconFile) {
      fd.append("iconFile", iconFile);
    } else if (values.icon) {
      fd.append("icon", values.icon);
    }
    return fd;
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      title: item.title,
      description: item.description,
      icon: item.icon || "",
      order: item.order ?? 0,
      isActive: item.isActive,
    });
    setIconFile(null);
    setIconPreview(item.icon && item.icon.startsWith("/uploads/") ? getImageUrl(item.icon) : "");
    setEditOpen(true);
  };

  const submitCreate = async (values: CardForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const submitEdit = async (values: CardForm) => {
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, data: buildFormData(values) });
    setEditOpen(false);
    resetForm();
  };

  const submitDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const formFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input placeholder="e.g. Trait-based Personality Theories" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Evaluate logical reasoning, problem solving..."
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
        <div className="flex items-center gap-3 pt-8">
          <Switch
            checked={form.watch("isActive")}
            onCheckedChange={(checked) => form.setValue("isActive", checked)}
          />
          <Label className="cursor-pointer">Card is active</Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Icon File (SVG recommended, or PNG/JPG)</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-muted shrink-0 p-2">
            {iconPreview ? (
              <img src={iconPreview} alt="Icon preview" className="h-full w-full object-contain filter" />
            ) : form.watch("icon") && !form.watch("icon").startsWith("/uploads/") ? (
              <div className="text-2xl text-primary"><i className={form.watch("icon")} /></div>
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50 justify-center">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-semibold">
                {iconFile ? iconFile.name : "Upload SVG/Image Icon"}
              </span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onIconChange} />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Or FontAwesome Icon Class (Fallback)</Label>
        <Input placeholder="fa-solid fa-brain" {...form.register("icon")} />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <Tabs defaultValue="cards" className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Why Choose Us Page</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the cards shown on the public Why Choose Us page, as well as general homepage settings.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="cards">Page Cards (Grid)</TabsTrigger>
            <TabsTrigger value="settings">Homepage Section Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cards" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-md border bg-muted/50 p-1 shrink-0">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-3"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 px-3"
                >
                  List
                </Button>
              </div>
              <PermissionGate module="why_choose" action="create">
                <Button onClick={openCreate} className="h-9">
                  <Plus className="h-4 w-4 mr-2" /> Add Card
                </Button>
              </PermissionGate>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-9 w-24 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cards.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg">No Cards Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                There are no cards created yet. Get started by adding a new card.
              </p>
              <PermissionGate module="why_choose" action="create">
                <Button onClick={openCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add Card
                </Button>
              </PermissionGate>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((item: any) => (
                <Card key={item.id} className={`overflow-hidden border-2 ${item.isActive ? "border-muted" : "border-destructive/30 opacity-75"}`}>
                  <CardContent className="p-6 relative flex flex-col justify-between h-full min-h-[160px]">
                    <div className="absolute right-4 top-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate module="why_choose" action="update">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit Card
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate module="why_choose" action="delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelected(item);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Card
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Order: {item.order}</Badge>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="bg-primary/10 text-primary p-2.5 rounded-lg text-lg shrink-0 mt-1 h-12 w-12 flex items-center justify-center">
                          {item.icon && item.icon.startsWith("/uploads/") ? (
                            <img src={getImageUrl(item.icon)} alt={item.title} className="h-8 w-8 object-contain" />
                          ) : (
                            <i className={item.icon || "fa-solid fa-lightbulb"} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg leading-snug line-clamp-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-20">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cards.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.order}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 text-primary rounded flex items-center justify-center flex-shrink-0 p-1.5">
                              {item.icon && item.icon.startsWith("/uploads/") ? (
                                <img src={getImageUrl(item.icon)} alt={item.title} className="h-full w-full object-contain" />
                              ) : (
                                <i className={item.icon || "fa-solid fa-lightbulb"} />
                              )}
                            </div>
                            <span className="font-medium truncate max-w-[200px]">
                              {item.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                          {item.description}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px]">
                            {item.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <PermissionGate module="why_choose" action="update">
                                <DropdownMenuItem onClick={() => openEdit(item)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                              </PermissionGate>
                              <PermissionGate module="why_choose" action="delete">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelected(item);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </PermissionGate>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Showing page {page} of {pagination.pages} ({pagination.total} total items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="outline-none">
          <SettingsPage
            initialGroup="website_why_choose_us"
            standalone
            title="Homepage Why Choose Us Settings"
            description="Manage the main general text and images shown on the landing page why-choose-us block."
          />
        </TabsContent>
      </Tabs>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={form.handleSubmit(submitCreate)}>
            <DialogHeader>
              <DialogTitle>Add Card</DialogTitle>
              <DialogDescription>
                Create a new detailed card for the Why Choose Us page. Upload an SVG or select an icon.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={form.handleSubmit(submitEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>
                Update the card details. Upload a new SVG/image icon to replace the old one.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={submitDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
