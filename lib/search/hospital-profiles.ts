import { assertSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { HospitalProfile } from "@/lib/scoring/types";

export async function fetchHospitalProfiles(): Promise<HospitalProfile[]> {
  assertSupabaseConfigured();
  const [hospitalsResult, specialistsResult, inventoryResult, bloodResult] = await Promise.all([
    supabase.from("hospitals").select("id,name,latitude,longitude,phone,ambulance_phone,address,updated_at"),
    supabase.from("specialists").select("hospital_id,specialty,available"),
    supabase.from("inventory").select("hospital_id,icu_available,general_available"),
    supabase.from("blood_stock").select("hospital_id,blood_type,available"),
  ]);

  const firstError = [hospitalsResult, specialistsResult, inventoryResult, bloodResult]
    .find((result) => result.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const specialistsByHospital = new Map<string, HospitalProfile["specialists"]>();
  for (const item of specialistsResult.data ?? []) {
    const list = specialistsByHospital.get(item.hospital_id) ?? [];
    list.push({ specialty: item.specialty, available: item.available });
    specialistsByHospital.set(item.hospital_id, list);
  }
  const inventoryByHospital = new Map((inventoryResult.data ?? []).map((item) => [item.hospital_id, {
    icu_available: item.icu_available,
    general_available: item.general_available,
  }]));
  const bloodByHospital = new Map<string, string[]>();
  for (const item of bloodResult.data ?? []) {
    if (!item.available) continue;
    const list = bloodByHospital.get(item.hospital_id) ?? [];
    list.push(item.blood_type);
    bloodByHospital.set(item.hospital_id, list);
  }

  return (hospitalsResult.data ?? []).map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    latitude: Number(hospital.latitude),
    longitude: Number(hospital.longitude),
    phone: hospital.phone,
    ambulance_phone: hospital.ambulance_phone,
    address: hospital.address,
    specialists: specialistsByHospital.get(hospital.id) ?? [],
    inventory: inventoryByHospital.get(hospital.id) ?? null,
    bloodTypesAvailable: bloodByHospital.get(hospital.id) ?? [],
    updatedAt: hospital.updated_at,
  }));
}
