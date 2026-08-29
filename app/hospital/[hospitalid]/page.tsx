"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SPECIALTIES } from "@/lib/ai/specialties";
import { Trash2, MapPin, Phone, Ambulance } from "lucide-react";

type SpecialistForm = {
  id?: string;
  specialty: string;
  name: string;
  yoe: number;
  available: boolean;
};

export default function HospitalPage() {
  const params = useParams();
  const hospitalId = params.hospitalid as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States
  const [hospital, setHospital] = useState<any>(null);
  
  const [inventory, setInventory] = useState({
    icu_capacity: 0,
    icu_available: 0,
    general_capacity: 0,
    general_available: 0
  });

  const [bloodStock, setBloodStock] = useState<Record<string, boolean>>({
    'O-': false, 'O+': false, 'A-': false, 'A+': false,
    'B-': false, 'B+': false, 'AB-': false, 'AB+': false
  });

  const [specialists, setSpecialists] = useState<SpecialistForm[]>([]);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [hRes, iRes, bRes, sRes] = await Promise.all([
        supabase.from('hospitals').select('*').eq('id', hospitalId).single(),
        supabase.from('inventory').select('*').eq('hospital_id', hospitalId).single(),
        supabase.from('blood_stock').select('*').eq('hospital_id', hospitalId),
        supabase.from('specialists').select('*').eq('hospital_id', hospitalId)
      ]);

      if (hRes.data) setHospital(hRes.data);
      
      if (iRes.data) {
        setInventory({
          icu_capacity: iRes.data.icu_capacity || 0,
          icu_available: iRes.data.icu_available || 0,
          general_capacity: iRes.data.general_capacity || 0,
          general_available: iRes.data.general_available || 0
        });
      }

      if (bRes.data) {
        const bs: Record<string, boolean> = { ...bloodStock };
        bRes.data.forEach((b: any) => {
          bs[b.blood_type] = b.available;
        });
        setBloodStock(bs);
      }

      if (sRes.data) {
        setSpecialists(sRes.data.map((s: any) => ({
          id: s.id,
          specialty: s.specialty,
          name: s.name || '',
          yoe: s.yoe || 0,
          available: s.available,
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [hospitalId]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // 1. Upsert Inventory
      await supabase.from('inventory').upsert({
        hospital_id: hospitalId,
        icu_capacity: inventory.icu_capacity,
        icu_available: inventory.icu_available,
        general_capacity: inventory.general_capacity,
        general_available: inventory.general_available
      }, { onConflict: 'hospital_id' });

      // 2. Upsert Blood Stock
      const bloodStockRows = Object.entries(bloodStock).map(([type, available]) => ({
        hospital_id: hospitalId,
        blood_type: type,
        available: available
      }));
      await supabase.from('blood_stock').upsert(bloodStockRows, { onConflict: 'hospital_id, blood_type' });

      // 3. Upsert Specialists
      const specialistRows = specialists.map((specialist) => ({
        ...(specialist.id ? { id: specialist.id } : {}),
        hospital_id: hospitalId,
        specialty: specialist.specialty,
        name: specialist.name.trim(),
        yoe: specialist.yoe,
        available: specialist.available,
      }));
      const { error: specialistError } = await supabase.from('specialists').upsert(specialistRows);
      if (specialistError) throw specialistError;

      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-10 sm:px-8">Loading...</main>;
  }

  if (!hospital) {
    return <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-10 sm:px-8">Hospital not found</main>;
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 pt-4 pb-10 sm:px-8 sm:pt-6 sm:pb-16 relative">
      <div className="mb-8">
        <Link href="/admin" className="text-brand-600 hover:underline mb-4 inline-block">&larr; Back to Admin Dashboard</Link>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl mb-4">{hospital.name}</h1>
        
        <div className="flex flex-col gap-3">
          {hospital.address && (
            <a 
              href={hospital.address_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg w-fit transition-colors"
            >
              <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
              <span>{hospital.address}</span>
            </a>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm">
            {hospital.phone && (
              <a 
                href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`} 
                className="inline-flex items-center gap-2 text-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg w-fit transition-colors"
              >
                <Phone className="h-4 w-4 text-brand-600 shrink-0" />
                <span>{hospital.phone}</span>
              </a>
            )}
            
            {hospital.ambulance_phone && (
              <a 
                href={`tel:${hospital.ambulance_phone.replace(/[^0-9+]/g, '')}`} 
                className="inline-flex items-center gap-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg w-fit transition-colors"
              >
                <Ambulance className="h-4 w-4 text-red-600 shrink-0" />
                <span className="font-medium">Ambulance: {hospital.ambulance_phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-20">
        
        {/* Inventory Section */}
        <section className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Bed Inventory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">ICU Capacity</label>
              <input type="number" value={inventory.icu_capacity} onChange={(e) => setInventory({...inventory, icu_capacity: parseInt(e.target.value) || 0})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">ICU Available</label>
              <input type="number" value={inventory.icu_available} onChange={(e) => setInventory({...inventory, icu_available: parseInt(e.target.value) || 0})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">General Capacity</label>
              <input type="number" value={inventory.general_capacity} onChange={(e) => setInventory({...inventory, general_capacity: parseInt(e.target.value) || 0})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">General Available</label>
              <input type="number" value={inventory.general_available} onChange={(e) => setInventory({...inventory, general_available: parseInt(e.target.value) || 0})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
          </div>
        </section>

        {/* Blood Stock Section */}
        <section className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Blood Stock Availability</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(bloodStock).map(([type, available]) => (
              <label key={type} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={available} 
                  onChange={(e) => setBloodStock({...bloodStock, [type]: e.target.checked})}
                  className="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-neutral-900">{type}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Specialists Section */}
        <section className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h2 className="text-xl font-semibold">Specialists on Duty</h2>
            <button
              type="button"
              onClick={() => setSpecialists([...specialists, { specialty: 'cardiology', name: '', yoe: 0, available: false }])}
              className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              + Add doctor
            </button>
          </div>
          <div className="space-y-4">
            {specialists.length > 0 && (
              <div className="hidden sm:flex flex-row items-center justify-between px-4 pb-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div className="w-full sm:w-64 pl-8">
                  Specialty
                </div>
                <div className="flex-1 sm:ml-6 flex space-x-4">
                  <div className="flex-1">
                    Doctor Name
                  </div>
                  <div className="w-24">
                    Years Exp.
                  </div>
                  <div className="w-[36px]"></div>
                </div>
              </div>
            )}
            {specialists.map((data, index) => (
              <div key={data.id || `new-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center space-x-3 mb-3 sm:mb-0 w-full sm:w-64 shrink-0">
                  <input
                    type="checkbox" 
                    checked={data.available} 
                    onChange={(e) => setSpecialists(specialists.map((item, itemIndex) => itemIndex === index ? { ...item, available: e.target.checked } : item))}
                    className="h-5 w-5 shrink-0 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                  />
                  <select
                    value={data.specialty}
                    onChange={(e) => setSpecialists(specialists.map((item, itemIndex) => itemIndex === index ? { ...item, specialty: e.target.value } : item))}
                    className="w-full rounded-md border border-neutral-300 p-2 text-sm font-medium text-neutral-900"
                  >
                    {SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 sm:ml-6 flex space-x-4 items-end sm:items-center">
                  <div className="flex-1">
                    <label className="block sm:hidden text-xs font-medium text-neutral-500 mb-1">Doctor Name</label>
                    <input 
                      type="text" 
                      value={data.name || ''} 
                      onChange={(e) => setSpecialists(specialists.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))}
                      placeholder="e.g. Dr. Smith"
                      className="w-full border border-neutral-300 rounded-md p-2 text-sm" 
                    />
                  </div>
                  <div className="w-24">
                    <label className="block sm:hidden text-xs font-medium text-neutral-500 mb-1">Years Exp.</label>
                    <input 
                      type="number" 
                      value={data.yoe || 0} 
                      onChange={(e) => setSpecialists(specialists.map((item, itemIndex) => itemIndex === index ? { ...item, yoe: parseInt(e.target.value) || 0 } : item))}
                      className="w-full border border-neutral-300 rounded-md p-2 text-sm" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpecialists(specialists.filter((_, itemIndex) => itemIndex !== index))}
                    className="shrink-0 rounded-md p-2 bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    aria-label={`Remove ${data.name || 'doctor'}`}
                    title="Remove doctor"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            {specialists.length === 0 && <p className="text-sm text-neutral-500">No doctors added yet.</p>}
          </div>
        </section>
      </div>

      {/* Save Actions - Fixed to Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-200 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-brand-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-brand-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </main>
  );
}
