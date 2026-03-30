import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testimonialsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useTestimonials(params?: Record<string, any>) {
  return useQuery({
    queryKey: ["testimonials", params],
    queryFn: () => testimonialsApi.list(params).then((r) => r.data),
  });
}

export function useTestimonial(id: string | null) {
  return useQuery({
    queryKey: ["testimonials", id],
    queryFn: () => testimonialsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTestimonial() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => testimonialsApi.create(data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      toast({ title: "Testimonial Created", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create testimonial",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTestimonial() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      testimonialsApi.update(id, data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      toast({ title: "Testimonial Updated", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update testimonial",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTestimonial() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => testimonialsApi.delete(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["testimonials"] });
      toast({ title: "Testimonial Deleted", description: res.message });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete testimonial",
        variant: "destructive",
      });
    },
  });
}
