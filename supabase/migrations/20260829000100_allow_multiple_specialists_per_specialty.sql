-- A hospital can have multiple doctors in the same specialty.
alter table public.specialists
  drop constraint if exists specialists_hospital_id_specialty_key;
