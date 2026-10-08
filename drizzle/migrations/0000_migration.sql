
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_settings (
  user_id uuid primary key,
  theme text not null default 'system',
  notifications_enabled boolean not null default false,
  default_reminder integer not null default 15,
  time_format text not null default '12',
  week_start integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  category text not null default 'Other',
  priority text not null default 'medium',
  start_time time not null,
  end_time time not null,
  reminder_minutes integer,
  repeat_type text not null,
  repeat_days integer[] not null default '{}',
  interval_days integer,
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  recurring_id uuid references public.recurring_tasks(id) on delete set null,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  category text not null default 'Other',
  priority text not null default 'medium',
  reminder_minutes integer,
  notes text,
  status text not null default 'pending',
  actual_start time,
  actual_end time,
  completed_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurring_id, date)
);
create index tasks_user_date on public.tasks(user_id, date);
create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  task_id uuid references public.tasks(id) on delete set null,
  date date not null,
  title text not null,
  category text not null,
  status text not null,
  planned_minutes integer not null default 0,
  actual_minutes integer not null default 0,
  is_demo boolean not null default false,
  recorded_at timestamptz not null default now()
);
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  content text not null default '',
  date date not null default current_date,
  category text,
  task_id uuid references public.tasks(id) on delete set null,
  pinned boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  items jsonb not null default '[]',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  task_id uuid references public.tasks(id) on delete cascade,
  kind text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (task_id, kind)
);
create table public.daily_statistics (
  user_id uuid not null,
  date date not null,
  planned integer not null default 0,
  completed integer not null default 0,
  missed integer not null default 0,
  skipped integer not null default 0,
  planned_minutes integer not null default 0,
  completed_minutes integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

do $$ declare t text; begin
  foreach t in array array['profiles','user_settings','categories','recurring_tasks','tasks','task_completions','notes','templates','notifications','daily_statistics'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "own profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
do $$ declare t text; begin
  foreach t in array array['user_settings','categories','recurring_tasks','tasks','task_completions','notes','templates','notifications','daily_statistics'] loop
    execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_tasks before update on public.tasks for each row execute function public.touch_updated_at();
create trigger t_notes before update on public.notes for each row execute function public.touch_updated_at();
create trigger t_rec before update on public.recurring_tasks for each row execute function public.touch_updated_at();
create trigger t_tpl before update on public.templates for each row execute function public.touch_updated_at();
create trigger t_set before update on public.user_settings for each row execute function public.touch_updated_at();

-- validation: end after start is allowed to wrap past midnight, but must differ
create or replace function public.validate_task() returns trigger language plpgsql set search_path = public as $$
begin
  if new.start_time = new.end_time then raise exception 'End time must differ from start time'; end if;
  if new.priority not in ('low','medium','high') then raise exception 'Invalid priority'; end if;
  if new.status not in ('pending','completed','skipped','missed','in_progress') then raise exception 'Invalid status'; end if;
  return new;
end $$;
create trigger v_tasks before insert or update on public.tasks for each row execute function public.validate_task();

create or replace function public.seed_demo_data(_uid uuid) returns void language plpgsql security definer set search_path = public as $$
declare
  d date; s record; r double precision; st text; a_start time; a_end time; rec_id uuid; tid uuid;
begin
  insert into public.recurring_tasks(user_id,title,category,priority,start_time,end_time,reminder_minutes,repeat_type,repeat_days,start_date,is_demo)
  values (_uid,'DSA Practice','DSA','high','17:15','20:15',15,'weekdays','{1,2,3,4,5}',current_date-45,true) returning id into rec_id;

  for d in select generate_series(current_date-45, current_date+3, interval '1 day')::date loop
    for s in select * from (values
      ('Morning Exercise','Exercise','medium','05:45'::time,'06:15'::time,false),
      ('Academic Subject Study','Academics','high','06:15'::time,'08:00'::time,true),
      ('DSA Practice','DSA','high','17:15'::time,'20:15'::time,true),
      ('Academic Revision','Academics','medium','21:30'::time,'22:45'::time,false),
      ('Web Development','Web Development','medium','23:00'::time,'23:55'::time,true),
      ('AI Agents Project','AI / AI Agents','medium','10:00'::time,'12:00'::time,false),
      ('Internship Work','Internship','high','14:00'::time,'16:00'::time,false)
    ) as v(title,cat,pri,st_t,en_t,weekday_only) loop
      if s.weekday_only and extract(isodow from d) > 5 then continue; end if;
      if not s.weekday_only and s.cat in ('AI / AI Agents','Internship') and extract(isodow from d) <= 5 then continue; end if;
      r := random();
      a_start := null; a_end := null;
      if d < current_date then
        st := case when r < 0.74 then 'completed' when r < 0.84 then 'skipped' else 'pending' end;
        if s.title = 'Web Development' and r > 0.55 then st := 'pending'; end if;
      else st := 'pending'; end if;
      if st = 'completed' then
        a_start := s.st_t + (floor(random()*15) || ' minutes')::interval;
        a_end := s.en_t - (floor(random()*30) || ' minutes')::interval;
      end if;
      insert into public.tasks(user_id,recurring_id,title,date,start_time,end_time,category,priority,reminder_minutes,status,actual_start,actual_end,completed_at,is_demo)
      values (_uid, case when s.title='DSA Practice' then rec_id else null end, s.title, d, s.st_t, s.en_t, s.cat, s.pri, 15, st, a_start, a_end,
        case when st='completed' then (d + s.en_t)::timestamptz else null end, true)
      on conflict do nothing returning id into tid;
      if st = 'completed' and tid is not null then
        insert into public.task_completions(user_id,task_id,date,title,category,status,planned_minutes,actual_minutes,is_demo)
        values (_uid, tid, d, s.title, s.cat, 'completed',
          (extract(epoch from (s.en_t - s.st_t))/60)::int, greatest(0,(extract(epoch from (a_end - a_start))/60)::int), true);
      end if;
    end loop;
  end loop;

  insert into public.notes(user_id,title,content,date,category,pinned,is_demo) values
    (_uid,'DSA Revision','Binary Search में lower_bound और upper_bound revise करना है.',current_date,'DSA',true,true),
    (_uid,'Project idea','Build a small AI agent that summarises lecture notes every evening.',current_date,'AI / AI Agents',false,true),
    (_uid,'Exam prep','Unit 3 of DBMS — normalisation & transactions. Make one-page summary.',current_date-1,'Academics',false,true);

  insert into public.templates(user_id,name,items,is_demo) values (_uid,'Weekday Template', '[
    {"title":"Wake Up","category":"Personal","start":"05:30","end":"05:45","priority":"low"},
    {"title":"Exercise","category":"Exercise","start":"05:45","end":"06:15","priority":"medium"},
    {"title":"Academic Subject","category":"Academics","start":"06:15","end":"08:00","priority":"high"},
    {"title":"College","category":"Academics","start":"08:45","end":"16:45","priority":"medium"},
    {"title":"DSA","category":"DSA","start":"17:15","end":"20:15","priority":"high"},
    {"title":"Dinner","category":"Personal","start":"20:15","end":"21:00","priority":"low"},
    {"title":"Academic Subject","category":"Academics","start":"21:30","end":"23:00","priority":"medium"},
    {"title":"Web Development / Internship","category":"Web Development","start":"23:00","end":"23:59","priority":"medium"}
  ]'::jsonb, true);
end $$;
revoke execute on function public.seed_demo_data(uuid) from public, anon, authenticated;

create or replace function public.load_demo_data() returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if exists (select 1 from public.tasks where user_id = auth.uid() and is_demo) then return; end if;
  perform public.seed_demo_data(auth.uid());
end $$;
revoke execute on function public.load_demo_data() from public, anon;
grant execute on function public.load_demo_data() to authenticated;

create or replace function public.clear_demo_data() returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from public.task_completions where user_id = auth.uid() and is_demo;
  delete from public.notes where user_id = auth.uid() and is_demo;
  delete from public.tasks where user_id = auth.uid() and is_demo;
  delete from public.recurring_tasks where user_id = auth.uid() and is_demo;
  delete from public.templates where user_id = auth.uid() and is_demo;
  delete from public.daily_statistics where user_id = auth.uid();
end $$;
revoke execute on function public.clear_demo_data() from public, anon;
grant execute on function public.clear_demo_data() to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_settings(user_id) values (new.id);
  insert into public.categories(user_id,name,color) values
    (new.id,'DSA','#f97316'),(new.id,'Academics','#3b82f6'),(new.id,'Web Development','#06b6d4'),
    (new.id,'Projects','#a855f7'),(new.id,'Internship','#eab308'),(new.id,'AI / AI Agents','#ec4899'),
    (new.id,'Exercise','#22c55e'),(new.id,'Personal','#14b8a6'),(new.id,'Other','#64748b');
  perform public.seed_demo_data(new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
