-- PARLO çevrim içi ligler — Supabase kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak güvenlidir (var olanı bozmaz).
--
-- İki tür lig var:
--  1) Kademeli haftalık lig (Duolingo gibi): bir hafta içinde ilk XP'sini kazanan oyuncu, kendi
--     kademesindeki (Bronz … Elmas) en fazla 30 kişilik bir gruba otomatik yerleşir. Hafta bitince
--     grubunda ilk 7'ye girenler bir üst kademeye çıkar, son 5'e düşenler bir alt kademeye iner.
--  2) Arkadaş ligi: 6 karakterlik kodla kurulan özel lig.
--
-- Her oyuncu telefonunda rastgele bir kimlik (id) ve gizli anahtar (secret) üretir. Puanlar yalnızca
-- bu ikisini bilen telefon tarafından güncellenebilir. Tablolara doğrudan erişim kapalıdır; uygulama
-- sadece aşağıdaki fonksiyonları çağırır.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.players (
  id uuid primary key,
  secret_hash text not null,
  league text check (league is null or league ~ '^[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 24),
  avatar text not null check (char_length(avatar) between 1 and 8),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  tier smallint not null default 0 check (tier between 0 and 9),
  week_start date not null,
  week_points integer not null default 0 check (week_points between 0 and 100000),
  total_points integer not null default 0 check (total_points between 0 and 10000000),
  updated_at timestamptz not null default now()
);
-- Önceki sürümden yükseltme (tablo zaten varsa)
alter table public.players add column if not exists tier smallint not null default 0;
alter table public.players alter column league drop not null;
create index if not exists players_league_idx on public.players (league);

create table if not exists public.divisions (
  id bigint generated always as identity primary key,
  week_start date not null,
  tier smallint not null check (tier between 0 and 9),
  created_at timestamptz not null default now()
);
create index if not exists divisions_week_tier_idx on public.divisions (week_start, tier);

create table if not exists public.memberships (
  division_id bigint not null references public.divisions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  week_points integer not null default 0 check (week_points between 0 and 100000),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (division_id, player_id)
);
create index if not exists memberships_player_idx on public.memberships (player_id);

alter table public.players enable row level security;
alter table public.divisions enable row level security;
alter table public.memberships enable row level security;
revoke all on public.players, public.divisions, public.memberships from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.players, public.divisions, public.memberships from anon, authenticated';
  end if;
end $$;

-- Ayarlar: grup büyüklüğü, yükselen ve düşen sayısı.
create or replace function public.league_rules(out group_size int, out promote int, out demote int, out min_for_demote int)
language sql immutable as $$ select 30, 7, 5, 10 $$;

-- Bir grubun bitmiş haftasında oyuncunun sırasına göre yeni kademesi.
create or replace function public.next_tier(p_division bigint, p_player uuid)
returns smallint
language plpgsql stable security definer
set search_path = public
as $$
declare
  r record;
  rules record;
  pos int;
  size int;
begin
  select * into rules from public.league_rules();
  select d.tier, m.week_points into r
    from public.memberships m join public.divisions d on d.id = m.division_id
   where m.division_id = p_division and m.player_id = p_player;
  select count(*) into size from public.memberships where division_id = p_division;
  select x.pos into pos from (
    select player_id, row_number() over (order by week_points desc, joined_at asc) as pos
      from public.memberships where division_id = p_division
  ) x where x.player_id = p_player;
  if pos <= rules.promote and r.week_points > 0 and size > 1 then
    return least(r.tier + 1, 9);
  elsif size >= rules.min_for_demote and pos > size - rules.demote then
    return greatest(r.tier - 1, 0);
  end if;
  return r.tier;
end;
$$;

-- Puan gönder / profili güncelle. İlk çağrıda oyuncuyu oluşturur. Bu hafta XP'si varsa bir gruba yerleştirir.
-- Önceki sürümdeki (kademesiz) fonksiyon imzasıyla çakışmasın diye eskisi silinir.
drop function if exists public.submit_score(uuid, text, text, text, text, text, date, integer, integer);
create or replace function public.submit_score(
  p_id uuid, p_secret text, p_league text, p_name text, p_avatar text, p_color text,
  p_week_start date, p_week_points integer, p_total_points integer
) returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  existing text;
  member record;
  prev record;
  new_tier smallint;
  div_id bigint;
  rules record;
begin
  if char_length(coalesce(p_secret, '')) < 16 then
    raise exception 'invalid secret';
  end if;
  if extract(isodow from p_week_start) <> 1 then
    raise exception 'week must start on monday';
  end if;
  select secret_hash into existing from public.players where id = p_id;
  if existing is null then
    insert into public.players (id, secret_hash, league, name, avatar, color, week_start, week_points, total_points)
    values (p_id, crypt(p_secret, gen_salt('bf')), nullif(upper(p_league), ''), p_name, p_avatar, p_color, p_week_start, p_week_points, p_total_points);
  elsif existing = crypt(p_secret, existing) then
    update public.players
       set league = nullif(upper(p_league), ''), name = p_name, avatar = p_avatar, color = p_color,
           week_start = p_week_start, week_points = p_week_points, total_points = p_total_points, updated_at = now()
     where id = p_id;
  else
    raise exception 'forbidden';
  end if;

  -- Kademeli lig: bu haftanın grubu
  select m.* into member
    from public.memberships m join public.divisions d on d.id = m.division_id
   where m.player_id = p_id and d.week_start = p_week_start;

  if member.division_id is not null then
    update public.memberships set week_points = p_week_points, updated_at = now()
     where division_id = member.division_id and player_id = p_id;
    return;
  end if;
  if p_week_points <= 0 then
    return; -- bu hafta henüz XP yok: lige katılmaz
  end if;

  -- Geçen haftanın sonucuna göre kademe
  select m.division_id into prev
    from public.memberships m join public.divisions d on d.id = m.division_id
   where m.player_id = p_id and d.week_start = p_week_start - 7;
  if prev.division_id is not null then
    new_tier := public.next_tier(prev.division_id, p_id);
    update public.players set tier = new_tier where id = p_id;
  else
    select tier into new_tier from public.players where id = p_id;
  end if;

  -- Bu kademede yeri olan bir grup bul, yoksa yeni grup aç
  select * into rules from public.league_rules();
  perform pg_advisory_xact_lock(hashtext(p_week_start::text || ':' || new_tier::text));
  select d.id into div_id
    from public.divisions d
   where d.week_start = p_week_start and d.tier = new_tier
     and (select count(*) from public.memberships m where m.division_id = d.id) < rules.group_size
   order by d.id
   limit 1;
  if div_id is null then
    insert into public.divisions (week_start, tier) values (p_week_start, new_tier) returning id into div_id;
  end if;
  insert into public.memberships (division_id, player_id, week_points) values (div_id, p_id, p_week_points);
end;
$$;

-- Oyuncunun bu haftaki grubu. Satır yoksa oyuncu bu hafta henüz lige katılmamıştır.
create or replace function public.get_division(p_id uuid, p_week_start date)
returns table (tier smallint, division_id bigint, id uuid, name text, avatar text, color text, week_points integer)
language sql stable security definer
set search_path = public
as $$
  select d.tier, d.id, p.id, p.name, p.avatar, p.color, m.week_points
    from public.memberships mine
    join public.divisions d on d.id = mine.division_id and d.week_start = p_week_start
    join public.memberships m on m.division_id = d.id
    join public.players p on p.id = m.player_id
   where mine.player_id = p_id
   order by m.week_points desc, m.joined_at asc;
$$;

-- Oyuncunun kademesi (henüz bu haftanın grubuna girmemişse de gösterilebilsin diye).
create or replace function public.get_tier(p_id uuid)
returns smallint
language sql stable security definer
set search_path = public
as $$ select tier from public.players where id = p_id $$;

-- Arkadaş ligi: bir lig kodunun oyuncuları (gizli alanlar dönmez).
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

-- Hesabı sil (tüm liglerden çıkar).
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
revoke all on function public.get_division(uuid, date) from public;
revoke all on function public.get_tier(uuid) from public;
revoke all on function public.get_league(text) from public;
revoke all on function public.leave_league(uuid, text) from public;
revoke all on function public.next_tier(bigint, uuid) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function public.submit_score(uuid, text, text, text, text, text, date, integer, integer) to anon, authenticated';
    execute 'grant execute on function public.get_division(uuid, date) to anon, authenticated';
    execute 'grant execute on function public.get_tier(uuid) to anon, authenticated';
    execute 'grant execute on function public.get_league(text) to anon, authenticated';
    execute 'grant execute on function public.leave_league(uuid, text) to anon, authenticated';
  end if;
end $$;
