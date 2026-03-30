import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the full URL for an image from the backend
 * @param path The relative path of the image (e.g. /uploads/blogs/image.jpg)
 * @returns The full URL or a placeholder if path is empty
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7777/api";
  const BACKEND_URL = API_BASE_URL.replace("/api", "");
  
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
}
