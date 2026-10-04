// Çevrim içi lig ayarları (Supabase). İkisi de herkese açık değerlerdir; gizli anahtar DEĞİLDİR.
// Boş bırakılırsa uygulama çevrim içi lig olmadan çalışır.
const DEFAULT_URL = '';
const DEFAULT_ANON_KEY = '';

// Değerler: Supabase paneli → Project Settings → API → "Project URL" ve "anon public" anahtarı.
export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || DEFAULT_URL;
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
