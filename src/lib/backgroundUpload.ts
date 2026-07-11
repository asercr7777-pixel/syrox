import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET = 'backgrounds';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

function sanitizeError(message: string): string {
  if (/network|fetch|timeout/i.test(message)) return 'Network error. Please check your connection and try again.';
  if (/policy|rls|row.level/i.test(message)) return 'Permission denied. Please sign in and try again.';
  if (/bucket/i.test(message)) return 'Storage is not available. Please try again later.';
  return 'Upload failed. Please try again.';
}

export async function uploadBackground(
  userId: string,
  file: File,
  kind: 'image' | 'video',
): Promise<{ url: string; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { url: '', error: 'Cloud storage is not configured.' };
  }

  const allowed = kind === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  if (!allowed.includes(file.type)) {
    return { url: '', error: `Invalid file type. Allowed: ${allowed.join(', ')}` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? (kind === 'image' ? 'png' : 'mp4');
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });

  if (upErr) {
    console.error('[backgroundUpload] upload error:', upErr.message);
    return { url: '', error: sanitizeError(upErr.message) };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { url: '', error: 'Failed to get public URL.' };
  }
  return { url: data.publicUrl, error: null };
}
