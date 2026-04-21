-- Fix RLS recursion: helpers that query workspace_members must run as definer,
-- otherwise the caller's RLS policy on workspace_members triggers itself.
alter function public.is_workspace_member(uuid) security definer;
alter function public.workspace_role(uuid) security definer;
alter function public.user_facility_id(uuid) security definer;
alter function public.txg_can_read(uuid) security definer;
alter function public.txg_can_write(uuid) security definer;
alter function public.txg_can_delete(uuid) security definer;

revoke execute on function public.is_workspace_member(uuid) from public;
revoke execute on function public.workspace_role(uuid) from public;
revoke execute on function public.user_facility_id(uuid) from public;
revoke execute on function public.txg_can_read(uuid) from public;
revoke execute on function public.txg_can_write(uuid) from public;
revoke execute on function public.txg_can_delete(uuid) from public;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.workspace_role(uuid) to authenticated;
grant execute on function public.user_facility_id(uuid) to authenticated;
grant execute on function public.txg_can_read(uuid) to authenticated;
grant execute on function public.txg_can_write(uuid) to authenticated;
grant execute on function public.txg_can_delete(uuid) to authenticated;
