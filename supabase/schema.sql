-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists settings (
  id int primary key default 1 check (id = 1),
  fill_max numeric not null default 750
);

create table if not exists teams (
  id text primary key,
  name text not null,
  color text not null,
  emoji text not null,
  total numeric not null default 0
);

insert into settings (id, fill_max)
values (1, 750)
on conflict (id) do nothing;

insert into teams (id, name, color, emoji, total) values
  ('red', 'Red Team', '#ff5a5a', '🍓', 0),
  ('blue', 'Blue Team', '#4dabff', '🐬', 0),
  ('green', 'Green Team', '#45d66a', '🌴', 0),
  ('yellow', 'Yellow Team', '#facc15', '🍋', 0),
  ('orange', 'Orange Team', '#ff8c32', '🍊', 0),
  ('silver', 'Silver Team', '#c0c0c0', '💎', 0)
on conflict (id) do nothing;

create or replace function add_donation(p_team_id text, p_amount numeric)
returns teams
language plpgsql
as $$
declare
  result teams;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  update teams
  set total = round(total + p_amount, 2)
  where id = p_team_id
  returning * into result;

  if not found then
    raise exception 'Team not found';
  end if;

  return result;
end;
$$;

create or replace function reset_all_teams()
returns void
language plpgsql
as $$
begin
  update teams set total = 0;
end;
$$;
