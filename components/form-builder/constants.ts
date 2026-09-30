export const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav"],
} as const;

export const ACCEPT = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4",
  audio: "audio/mpeg,audio/wav",
} as const;
