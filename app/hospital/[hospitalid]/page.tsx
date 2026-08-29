"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

  const [specialists, setSpecialists] = useState<Record<string, any>>({
    'cardiology': { name: '', yoe: 0, available: false },
    'neurology': { name: '', yoe: 0, available: false },
    'orthopedics': { name: '', yoe: 0, available: false },
    'emergency_medicine': { name: '', yoe: 0, available: false }
  });

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
        const spec: Record<string, any> = { ...specialists };
        sRes.data.forEach((s: any) => {
          spec[s.specialty] = { name: s.name, yoe: s.yoe, available: s.available };
        });
        setSpecialists(spec);
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
      const specialistRows = Object.entries(specialists).map(([spec, data]) => ({
        hospital_id: hospitalId,
        specialty: spec,
        name: data.name,
        yoe: data.yoe,
        available: data.available
      }));
      await supabase.from('specialists').upsert(specialistRows, { onConflict: 'hospital_id, specialty' });

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
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-10 sm:px-8 relative">
      <div className="mb-6">
        <Link href="/admin" className="text-brand-600 hover:underline mb-4 inline-block">&larr; Back to Admin Dashboard</Link>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">{hospital.name}</h1>
        <p className="mt-2 text-neutral-500">{hospital.address} • {hospital.phone}</p>
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
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Specialists on Duty</h2>
          <div className="space-y-4">
            {Object.entries(specialists).map(([spec, data]) => (
              <div key={spec} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center space-x-3 mb-3 sm:mb-0 w-full sm:w-56 flex-shrink-0">
                  <input 
                    type="checkbox" 
                    checked={data.available} 
                    onChange={(e) => setSpecialists({...specialists, [spec]: { ...data, available: e.target.checked }})}
                    className="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
                  />
                  <span className="font-medium text-neutral-900 capitalize truncate" title={spec.replace('_', ' ')}>{spec.replace('_', ' ')}</span>
                </div>
                <div className="flex-1 sm:ml-6 flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Doctor Name</label>
                    <input 
                      type="text" 
                      value={data.name || ''} 
                      onChange={(e) => setSpecialists({...specialists, [spec]: { ...data, name: e.target.value }})}
                      placeholder="e.g. Dr. Smith"
                      className="w-full border border-neutral-300 rounded-md p-2 text-sm" 
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Years Exp.</label>
                    <input 
                      type="number" 
                      value={data.yoe || 0} 
                      onChange={(e) => setSpecialists({...specialists, [spec]: { ...data, yoe: parseInt(e.target.value) || 0 }})}
                      className="w-full border border-neutral-300 rounded-md p-2 text-sm" 
                    />
                  </div>
                </div>
              </div>
            ))}
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
