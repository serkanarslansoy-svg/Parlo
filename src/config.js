// Çevrim içi lig ayarları (Supabase). İkisi de herkese açık değerlerdir; gizli anahtar DEĞİLDİR.
// Boş bırakılırsa uygulama çevrim içi lig olmadan çalışır.
const DEFAULT_URL = 'https://egvxdlldzagsssozsufb.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndnhkbGxkemFnc3Nzb3pzdWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzY4MDgsImV4cCI6MjEwNjcxMjgwOH0.sWBU9BkEjOxShaawR_qrPTOV6ArQ8WGu0vTkmPK3png';

// Değerler: Supabase paneli → Project Settings → API → "Project URL" ve "anon public" anahtarı.
export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || DEFAULT_URL;
export const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
