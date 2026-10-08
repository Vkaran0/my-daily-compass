alter table public.recurring_tasks add column generated_until date;
update public.recurring_tasks set generated_until = current_date + 3 where is_demo;
create or replace function public.reset_my_data() returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from public.notifications where user_id = auth.uid();
  delete from public.task_completions where user_id = auth.uid();
  delete from public.notes where user_id = auth.uid();
  delete from public.tasks where user_id = auth.uid();
  delete from public.recurring_tasks where user_id = auth.uid();
  delete from public.templates where user_id = auth.uid();
  delete from public.daily_statistics where user_id = auth.uid();
end $$;
revoke execute on function public.reset_my_data() from public, anon;
grant execute on function public.reset_my_data() to authenticated;