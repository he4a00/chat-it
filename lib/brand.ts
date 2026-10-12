/**
 * Shawky's animated brand avatar, served + optimized by Cloudinary.
 *
 * `fl_animated` is essential: without it, Cloudinary's format conversion (webp)
 * returns a single static frame. `f_webp` (rather than `f_auto`) picks the smaller
 * animated WebP — `f_auto` serves the much larger animated GIF here. `q_auto`
 * applies Cloudinary's smart quality, and `w_<n>` bounds each usage so a 32px
 * mark never pulls a full-resolution file.
 */
const SHAWKY_AVATAR_BASE =
  "https://res.cloudinary.com/hzymwgwb/image/upload/f_webp,q_auto,fl_animated"

export function shawkyAvatar(width: number): string {
  return `${SHAWKY_AVATAR_BASE}/w_${Math.round(width)}/shawky-teacher-smooth`
}
