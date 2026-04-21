-- Pin search_path on all helper functions (fixes function_search_path_mutable lint).
alter function public.set_updated_at() set search_path = public;
alter function public.is_workspace_member(uuid) set search_path = public;
alter function public.workspace_role(uuid) set search_path = public;
alter function public.user_facility_id(uuid) set search_path = public;
alter function public.txg_can_read(uuid) set search_path = public;
alter function public.txg_can_write(uuid) set search_path = public;
alter function public.txg_can_delete(uuid) set search_path = public;
