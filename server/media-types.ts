/**
 * Supported media types for maps
 */
export type MediaType = "image" | "gif" | "video" | "video-url";

/**
 * Valid file extensions for each media type
 */
export const MEDIA_TYPE_EXTENSIONS: Record<MediaType, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "bmp"],
  gif: ["gif"],
  video: ["mp4", "webm", "ogg", "mov"],
  "video-url": [], // No extension needed for URLs
};

/**
 * Determine media type from file extension
 */
export const getMediaTypeFromExtension = (
  extension: string
): MediaType | null => {
  const ext = extension.toLowerCase();

  for (const [mediaType, extensions] of Object.entries(MEDIA_TYPE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return mediaType as MediaType;
    }
  }

  return null;
};

/**
 * Check if extension is valid for video URL type
 */
export const isValidVideoUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Validate extension for media type
 */
export const validateMediaTypeExtension = (
  mediaType: MediaType,
  extension: string
): boolean => {
  if (mediaType === "video-url") {
    return true; // No extension validation needed for URLs
  }

  const validExtensions = MEDIA_TYPE_EXTENSIONS[mediaType];
  return validExtensions.includes(extension.toLowerCase());
};
