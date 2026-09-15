import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
}

function normalizeProtocolSlashes(value) {
  return value.replace(/^(https?):\/(?!\/)/i, "$1://");
}

function getBackendOrigin(apiBaseUrl) {
  const normalizedApiBaseUrl = normalizeProtocolSlashes(apiBaseUrl.trim());

  try {
    const url = new URL(normalizedApiBaseUrl);
    return url.origin;
  } catch {
    return normalizedApiBaseUrl.replace(/\/api\/?$/i, "").replace(/\/+$/g, "");
  }
}

/**
 * Get the full URL for an image from the backend
 * @param {string | null | undefined} path The relative path of the image (e.g. /uploads/blogs/image.jpg)
 * @returns {string} The full URL or empty string if path is empty
 */
export function getImageUrl(path) {
  if (!path) return "";

  const normalizedPath = normalizeProtocolSlashes(String(path).trim());
  if (
    /^https?:\/\//i.test(normalizedPath) ||
    normalizedPath.startsWith("data:") ||
    normalizedPath.startsWith("blob:")
  ) {
    return normalizedPath;
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:7777/api";
  const backendOrigin = getBackendOrigin(apiBaseUrl);
  const cleanPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${backendOrigin}${cleanPath}`;
}
