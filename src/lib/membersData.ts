import { resolveMemberPhotoUrl, supabase } from './supabase';

type LoadMembersOptions = {
  orderBy?: string;
  ascending?: boolean;
};

type SupabaseLikeError = {
  code?: string;
  message?: string;
  hint?: string;
  details?: string;
};

type Row = object;

function getErrorMessage(error: SupabaseLikeError | null | undefined): string {
  const code = error?.code ? `code=${error.code}` : null;
  const msg = error?.message ? `message=${error.message}` : null;
  const hint = error?.hint ? `hint=${error.hint}` : null;
  const details = error?.details ? `details=${error.details}` : null;
  return [code, msg, hint, details].filter(Boolean).join(' | ') || 'Unknown Supabase error';
}

function sortRows<T extends Row>(rows: T[], orderBy: string, ascending: boolean): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)?.[orderBy];
    const bv = (b as Record<string, unknown>)?.[orderBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return ascending ? cmp : -cmp;
  });
}

function normalizeMemberRows<T extends Row>(rows: T[]): T[] {
  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    if (typeof record.profile_photo !== 'string' || !record.profile_photo) {
      return row;
    }

    return {
      ...row,
      profile_photo: resolveMemberPhotoUrl(record.profile_photo),
    };
  });
}

export async function loadMembersForClient<T extends Row = Row>(options: LoadMembersOptions = {}) {
  const orderBy = options.orderBy || 'name';
  const ascending = options.ascending ?? true;
  const allowMembersFallback = import.meta.env.VITE_ENABLE_MEMBERS_TABLE_FALLBACK === 'true';

  const attempts = [
    { table: 'members_public', label: 'public_view' },
    ...(allowMembersFallback ? [{ table: 'members', label: 'base_table' as const }] : []),
  ] as const;

  const errors: string[] = [];

  for (const attempt of attempts) {
    const { data, error } = await supabase.from(attempt.table).select('*');

    if (!error) {
      const normalized = normalizeMemberRows((data || []) as T[]);
      const sorted = sortRows(normalized, orderBy, ascending);
      return {
        data: sorted,
        source: attempt.label,
        error: null,
      };
    }

    errors.push(`${attempt.table}: ${getErrorMessage(error)}`);
  }

  return {
    data: [],
    source: null,
    error: new Error(errors.join(' | ')),
  };
}
