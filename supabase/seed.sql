-- Demo seed data for the Delhi / Noida region.

insert into public.hospitals (id, name, latitude, longitude, phone, address, address_link)
values
  ('11111111-1111-1111-1111-111111111111', 'Apollo Hospitals Noida', 28.567200, 77.326000, '+91-120-4011066', 'Sector 26, Noida, Uttar Pradesh', 'https://maps.google.com/?q=Apollo+Hospitals+Noida'),
  ('22222222-2222-2222-2222-222222222222', 'Max Super Speciality Hospital Saket', 28.528800, 77.206000, '+91-11-26515050', 'Press Enclave Road, Saket, New Delhi', 'https://maps.google.com/?q=Max+Hospital+Saket'),
  ('33333333-3333-3333-3333-333333333333', 'Fortis Hospital Shalimar Bagh', 28.703300, 77.165000, '+91-11-42776222', 'Shalimar Bagh, New Delhi', 'https://maps.google.com/?q=Fortis+Hospital+Shalimar+Bagh')
on conflict (id) do update set
  name = excluded.name, latitude = excluded.latitude, longitude = excluded.longitude,
  phone = excluded.phone, address = excluded.address, address_link = excluded.address_link;

insert into public.specialists (hospital_id, specialty, available, schedule)
values
  ('11111111-1111-1111-1111-111111111111', 'cardiology', true,  '{"monday":"09:00-17:00","tuesday":"09:00-17:00","wednesday":"09:00-17:00"}'),
  ('11111111-1111-1111-1111-111111111111', 'emergency_medicine', true,  '{"daily":"24 hours"}'),
  ('22222222-2222-2222-2222-222222222222', 'cardiology', true,  '{"daily":"24 hours"}'),
  ('22222222-2222-2222-2222-222222222222', 'neurology', false, '{"monday":"10:00-14:00","friday":"10:00-14:00"}'),
  ('33333333-3333-3333-3333-333333333333', 'orthopedics', true, '{"monday":"08:00-16:00","friday":"08:00-16:00"}')
on conflict (hospital_id, specialty) do update set
  available = excluded.available, schedule = excluded.schedule;

insert into public.inventory (hospital_id, icu_capacity, icu_available, general_capacity, general_available)
values
  ('11111111-1111-1111-1111-111111111111', 30, 8, 150, 42),
  ('22222222-2222-2222-2222-222222222222', 45, 3, 220, 67),
  ('33333333-3333-3333-3333-333333333333', 20, 0, 120, 18)
on conflict (hospital_id) do update set
  icu_capacity = excluded.icu_capacity, icu_available = excluded.icu_available,
  general_capacity = excluded.general_capacity, general_available = excluded.general_available;

insert into public.blood_stock (hospital_id, blood_type, available)
values
  ('11111111-1111-1111-1111-111111111111', 'O-', true),
  ('11111111-1111-1111-1111-111111111111', 'A+', true),
  ('11111111-1111-1111-1111-111111111111', 'B+', false),
  ('22222222-2222-2222-2222-222222222222', 'O-', false),
  ('22222222-2222-2222-2222-222222222222', 'A+', true),
  ('33333333-3333-3333-3333-333333333333', 'O-', true),
  ('33333333-3333-3333-3333-333333333333', 'AB+', false)
on conflict (hospital_id, blood_type) do update set available = excluded.available;
