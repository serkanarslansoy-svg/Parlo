-- PARLO çevrim içi lig — Supabase kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak güvenlidir (var olanı bozmaz).
--
-- Model: her oyuncu telefonunda rastgele bir kimlik (id) ve gizli anahtar (secret) üretir.
-- Puanlar yalnızca bu iki değeri bilen telefon tarafından güncellenebilir.
-- Tabloya doğrudan erişim kapalıdır; uygulama sadece aşağıdaki üç fonksiyonu çağırır.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.players (
  id uuid primary key,
  secret_hash text not null,
  league text not null check (league ~ '^[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 24),
  avatar text not null check (char_length(avatar) between 1 and 8),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  week_start date not null,
  week_points integer not null default 0 check (week_points between 0 and 100000),
  total_points integer not null default 0 check (total_points between 0 and 10000000),
  updated_at timestamptz not null default now()
);

create index if not exists players_league_idx on public.players (league);

alter table public.players enable row level security;
revoke all on public.players from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on public.players from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on public.players from authenticated'; end if;
end $$;

-- Puan gönder / profili güncelle. İlk çağrıda oyuncuyu oluşturur.
create or replace function public.submit_score(
  p_id uuid, p_secret text, p_league text, p_name text, p_avatar text, p_color text,
  p_week_start date, p_week_points integer, p_total_points integer
) returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  existing text;
begin
  if char_length(coalesce(p_secret, '')) < 16 then
    raise exception 'invalid secret';
  end if;
  select secret_hash into existing from public.players where id = p_id;
  if existing is null then
    insert into public.players (id, secret_hash, league, name, avatar, color, week_start, week_points, total_points)
    values (p_id, crypt(p_secret, gen_salt('bf')), upper(p_league), p_name, p_avatar, p_color, p_week_start, p_week_points, p_total_points);
  elsif existing = crypt(p_secret, existing) then
    update public.players
       set league = upper(p_league), name = p_name, avatar = p_avatar, color = p_color,
           week_start = p_week_start, week_points = p_week_points, total_points = p_total_points, updated_at = now()
     where id = p_id;
  else
    raise exception 'forbidden';
  end if;
end;
$$;

-- Bir ligin oyuncuları (gizli alanlar dönmez).
create or replace function public.get_league(p_league text)
returns table (id uuid, name text, avatar text, color text, week_start date, week_points integer, total_points integer, updated_at timestamptz)
language sql stable security definer
set search_path = public
as $$
  select id, name, avatar, color, week_start, week_points, total_points, updated_at
    from public.players
   where league = upper(p_league)
   order by total_points desc
   limit 100;
$$;

-- Ligden ayrıl (oyuncu kaydını siler).
create or replace function public.leave_league(p_id uuid, p_secret text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  delete from public.players where id = p_id and secret_hash = crypt(p_secret, secret_hash);
end;
$$;

revoke all on function public.submit_score(uuid, text, text, text, text, text, date, integer, integer) from public;
revoke all on function public.get_league(text) from public;
revoke all on function public.leave_league(uuid, text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.submit_score(uuid, text, text, text, text, text, date, integer, integer) to anon, authenticated';
    execute 'grant execute on function public.get_league(text) to anon, authenticated';
    execute 'grant execute on function public.leave_league(uuid, text) to anon, authenticated';
  end if;
end $$;
