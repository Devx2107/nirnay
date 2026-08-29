"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    phone: "",
    ambulance_phone: "",
    address: "",
    address_link: ""
  });

  const fetchHospitals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hospitals').select('*').order('name');
    if (error) {
      console.error("Error fetching hospitals:", error);
    } else if (data) {
      setHospitals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = crypto.randomUUID();
    
    const { data, error } = await supabase.from('hospitals').insert({
      id: newId,
      name: formData.name,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      phone: formData.phone,
      ambulance_phone: formData.ambulance_phone,
      address: formData.address,
      address_link: formData.address_link
    });

    if (error) {
      console.error("Error adding hospital:", error);
      alert("Failed to add hospital.");
    } else {
      setShowAddForm(false);
      router.push(`/hospital/${newId}`);
    }
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-2 text-neutral-500">Manage all registered hospitals and their resources.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          {showAddForm ? "Cancel" : "+ Add Hospital"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Add New Hospital</h2>
          <form onSubmit={handleAddHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
              <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Ambulance Phone</label>
              <input required type="text" value={formData.ambulance_phone} onChange={(e) => setFormData({...formData, ambulance_phone: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Latitude</label>
              <input required type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Longitude</label>
              <input required type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
              <input required type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Google Maps Link</label>
              <input type="url" value={formData.address_link} onChange={(e) => setFormData({...formData, address_link: e.target.value})} className="w-full border border-neutral-300 rounded-md p-2" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                Save & Continue
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-neutral-500">Loading hospitals...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Hospital Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Address</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {hospitals.map((hospital) => (
                <tr key={hospital.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{hospital.name}</div>
                    <div className="text-sm text-neutral-500">{hospital.id.substring(0,8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {hospital.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500 max-w-xs truncate">
                    {hospital.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/hospital/${hospital.id}`} className="text-brand-600 hover:text-brand-900 bg-brand-50 px-3 py-1.5 rounded-md">
                      Edit Resources
                    </Link>
                  </td>
                </tr>
              ))}
              {hospitals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-neutral-500">
                    No hospitals found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
