'use client';

import { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { supabase } from '@/app/lib/supabase/client'
import { createActivityLog } from '@/app/lib/supabase/activityLogs'

export default function AdminSupplierCustomerPage() {
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    address: '',
    contactNumber: '',
    type: 'customer'
  });

  // Fetch data from Firestore
  const fetchData = async () => {
    const supplierSnap = await getDocs(collection(db, 'suppliers'));
    const customerSnap = await getDocs(collection(db, 'customers'));

    const supplierData = supplierSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(), 
      type: 'supplier' 
    }));
    
    const customerData = customerSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(), 
      type: 'customer' 
    }));

    // Merge both arrays and sort by name
    const allContacts = [...supplierData, ...customerData].sort((a, b) => 
      a.name?.localeCompare(b.name) || 0
    );
    
    setContacts(allContacts);
  };

  // Add new contact
  const addContact = async () => {
    if (!formData.name.trim()) return;

    const collectionName = formData.type === 'customer' ? 'customers' : 'suppliers';
    
    const docRef = await addDoc(collection(db, collectionName), {
      name: formData.name.trim(),
      position: formData.position.trim(),
      address: formData.address.trim(),
      contactNumber: formData.contactNumber.trim(),
      createdAt: serverTimestamp()
    });

    // Log activity (best-effort)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await createActivityLog({
          userId: user.id,
          action: formData.type === 'customer' ? 'Added customer' : 'Added supplier',
          details: `${formData.type} ${formData.name.trim()} created (id: ${docRef.id})`,
          metadata: { collection: collectionName }
        })
      }
    } catch (e) {
      console.warn('Activity log failed for contact creation', e)
    }

    // Reset form and close modal
    setFormData({
      name: '',
      position: '',
      address: '',
      contactNumber: '',
      type: 'customer'
    });
    setShowModal(false);
    fetchData();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
    <div className="p-8 min-h-screen bg-gray-50 mx-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Customer & Supplier Directory</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Contact
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {contact.position || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {contact.address || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {contact.contactNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          contact.type === 'customer' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {contact.type === 'customer' ? 'Customer' : 'Supplier'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No contacts found. Click "Add New Contact" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Contact Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          > 
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Job title or role"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Complete address"
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.name.trim()) {
                        addContact();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}