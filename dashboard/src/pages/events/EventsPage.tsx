import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isAfter, isSameDay, startOfDay } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  ImagePlus,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from "@/hooks/useEvents";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getImageUrl } from "@/lib/utils";
import { EventImageCropDialog } from "@/components/events/EventImageCropDialog";

const schema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  order: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type EventForm = z.infer<typeof schema>;

const getStatus = (eventDate: string) => {
  const date = startOfDay(new Date(eventDate));
  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return "today";
  if (isAfter(date, today)) return "upcoming";
  return "past";
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [timingFilter, setTimingFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropFileName, setCropFileName] = useState("");
  const [cropMimeType, setCropMimeType] = useState("image/jpeg");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 9 };
    if (search) params.search = search;
    if (timingFilter === "upcoming") params.upcoming = true;
    return params;
  }, [page, search, timingFilter]);

  const { data, isLoading } = useEvents(queryParams);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const allEvents = data?.data?.data || [];
  const events =
    timingFilter === "past"
      ? allEvents.filter((event: any) => getStatus(event.eventDate) === "past")
      : allEvents;
  const pagination = data?.data?.meta;

  const form = useForm<EventForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      eventDate: "",
      eventTime: "",
      venue: "",
      buttonText: "Get Ticket",
      buttonLink: "",
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    return () => {
      if (thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      if (cropImageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [thumbnailPreview, cropImageSrc]);

  const resetForm = () => {
    if (thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    form.reset({
      title: "",
      description: "",
      thumbnail: "",
      eventDate: "",
      eventTime: "",
      venue: "",
      buttonText: "Get Ticket",
      buttonLink: "",
      order: 0,
      isActive: true,
    });
    setSelected(null);
    setThumbnailFile(null);
    setThumbnailPreview("");
    setCropDialogOpen(false);
    setCropImageSrc("");
    setCropFileName("");
    setCropMimeType("image/jpeg");
  };

  const buildFormData = (values: EventForm) => {
    const fd = new FormData();
    Object.entries({
      title: values.title,
      description: values.description || "",
      eventDate: values.eventDate,
      eventTime: values.eventTime || "",
      venue: values.venue || "",
      buttonText: values.buttonText || "Get Ticket",
      buttonLink: values.buttonLink || "",
      order: String(values.order),
      isActive: String(values.isActive),
    }).forEach(([key, value]) => fd.append(key, value));
    if (thumbnailFile) fd.append("thumbnailFile", thumbnailFile);
    else if (values.thumbnail) fd.append("thumbnail", values.thumbnail);
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
      description: item.description || "",
      thumbnail: item.thumbnail || "",
      eventDate: format(new Date(item.eventDate), "yyyy-MM-dd"),
      eventTime: item.eventTime || "",
      venue: item.venue || "",
      buttonText: item.buttonText || "Get Ticket",
      buttonLink: item.buttonLink || "",
      order: item.order ?? 0,
      isActive: item.isActive,
    });
    setThumbnailFile(null);
    setThumbnailPreview(getImageUrl(item.thumbnail));
    setEditOpen(true);
  };

  const submitCreate = async (values: EventForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const submitEdit = async (values: EventForm) => {
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

  const onThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setCropFileName(file.name);
    setCropMimeType(file.type || "image/jpeg");
    setCropDialogOpen(true);
    event.target.value = "";
  };

  const handleCropConfirm = (file: File, previewUrl: string) => {
    if (thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    if (cropImageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(cropImageSrc);
    }

    setThumbnailFile(file);
    setThumbnailPreview(previewUrl);
    form.setValue("thumbnail", "");
    setCropImageSrc("");
    setCropFileName("");
  };

  const renderError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{message}</p> : null;

  const formFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Event Title</Label>
        <Input placeholder="e.g. Annual Scholarship Seminar" {...form.register("title")} />
        {renderError(form.formState.errors.title?.message)}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Add a short event overview"
          {...form.register("description")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Event Date</Label>
          <Input type="date" {...form.register("eventDate")} />
          {renderError(form.formState.errors.eventDate?.message)}
        </div>
        <div className="space-y-2">
          <Label>Event Time</Label>
          <Input placeholder="e.g. 10:30 AM" {...form.register("eventTime")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Venue</Label>
          <Input placeholder="e.g. Main Auditorium" {...form.register("venue")} />
        </div>
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input placeholder="Get Ticket" {...form.register("buttonText")} />
        </div>
        <div className="space-y-2">
          <Label>Button Link</Label>
          <Input placeholder="https://example.com/register" {...form.register("buttonLink")} />
          {renderError(form.formState.errors.buttonLink?.message)}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Thumbnail</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted shrink-0">
            {thumbnailPreview ? (
              <img src={thumbnailPreview} alt="Event thumbnail preview" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {thumbnailFile ? thumbnailFile.name : "Upload and crop thumbnail"}
              </span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
          </label>
        </div>
        <p className="text-[10px] text-muted-foreground">
          The final uploaded image will be cropped to 325 x 200 pixels.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label className="cursor-pointer">Event is active</Label>
      </div>
    </div>
  );

  return (
    <MainLayout title="Events">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <CalendarDays className="h-6 w-6 text-primary" />
              Events
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage website events, schedules, venues, and CTA links
            </p>
          </div>
          <PermissionGate module="events" action="create">
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </PermissionGate>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, venue, or description..."
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={timingFilter}
              onValueChange={(value) => {
                setTimingFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming & Today</SelectItem>
                <SelectItem value="past">Past Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[320px]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <CalendarClock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No events found.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((item: any) => {
              const status = getStatus(item.eventDate);
              const statusClass =
                status === "upcoming"
                  ? "bg-blue-500/90 text-white"
                  : status === "today"
                    ? "bg-amber-500/90 text-white"
                    : "bg-slate-500/90 text-white";

              return (
                <Card
                  key={item.id}
                  className={`group overflow-hidden transition-all hover:shadow-md ${
                    !item.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="relative h-44 overflow-hidden bg-muted">
                    {item.thumbnail ? (
                      <img
                        src={getImageUrl(item.thumbnail)}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        #{item.order ?? 0}
                      </Badge>
                      <Badge className={`text-[10px] capitalize ${statusClass}`}>{status}</Badge>
                      <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px]">
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate module="events" action="update">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate module="events" action="delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelected(item);
                                setDeleteOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <h3 className="line-clamp-2 text-base font-semibold">{item.title}</h3>
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-primary" />
                        <span>{format(new Date(item.eventDate), "dd MMM yyyy")}</span>
                      </div>
                      {item.eventTime ? (
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5 text-primary" />
                          <span>{item.eventTime}</span>
                        </div>
                      ) : null}
                      {item.venue ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="line-clamp-1">{item.venue}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {item.buttonText || "No CTA text"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Created {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      {item.buttonLink ? (
                        <a
                          href={item.buttonLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && timingFilter !== "past" && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
              events
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>Create a new event entry for the website.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(submitCreate)}>
              {formFields}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>Update {selected?.title || "event"} details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(submitEdit)}>
              {formFields}
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selected?.title || "this event"}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={submitDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EventImageCropDialog
          open={cropDialogOpen}
          imageSrc={cropImageSrc}
          fileName={cropFileName}
          mimeType={cropMimeType}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            if (!open && cropImageSrc.startsWith("blob:")) {
              URL.revokeObjectURL(cropImageSrc);
              setCropImageSrc("");
            }
          }}
          onConfirm={handleCropConfirm}
        />
      </div>
    </MainLayout>
  );
}
