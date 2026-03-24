import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'missing-supabase-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live data.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function resolveMemberPhotoUrl(photoValue?: string | null): string | null {
  if (!photoValue) return null;

  const normalized = photoValue.trim();
  if (!normalized) return null;

  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  let cleanPath = normalized.replace(/^\/+/, '');

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    try {
      const url = new URL(normalized);
      const patterns = [
        '/storage/v1/object/public/member-photos/',
        '/storage/v1/object/sign/member-photos/',
        '/storage/v1/object/authenticated/member-photos/',
      ];

      const matchedPrefix = patterns.find((pattern) => url.pathname.includes(pattern));
      if (!matchedPrefix) {
        return normalized;
      }

      cleanPath = decodeURIComponent(url.pathname.split(matchedPrefix)[1] || '').replace(/^\/+/, '');
    } catch {
      return normalized;
    }
  }

  if (cleanPath.startsWith('member-photos/')) {
    cleanPath = cleanPath.slice('member-photos/'.length);
  }

  const { data } = supabase.storage.from('member-photos').getPublicUrl(cleanPath);
  return data.publicUrl;
}

export interface Member {
  id: string;
  name: string;
  dob: string;
  email?: string | null;
  phone?: string | null;
  qualification?: string | null;
  current_status?: string | null;
  gender?: string | null;
  anniversary?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  profile_photo?: string | null;
  fathers_name?: string | null;
  mothers_name?: string | null;
  spouse_name?: string | null;
  timezone?: string | null;
  message?: string | null;
  created_at?: string;
}
