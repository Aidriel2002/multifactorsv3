'use client';

import { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { supabase } from '@/app/lib/supabase/client'
import { createActivityLog } from '@/app/lib/supabase/activityLogs'

export default function AdminSupplierCustomerPage() {
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    address: '',
    contactNumber: '',
    type: 'customer'
  });

  const itemsPerPage = 10;

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

    // Create a map to track contacts by name for detecting duplicates
    const contactMap = new Map();

    // Process customers
    customerData.forEach(contact => {
      const key = contact.name?.toLowerCase().trim();
      if (key) {
        contactMap.set(key, {
          ...contact,
          ids: [contact.id],
          types: ['customer']
        });
      }
    });

    // Process suppliers and merge with customers if same name
    supplierData.forEach(contact => {
      const key = contact.name?.toLowerCase().trim();
      if (key) {
        if (contactMap.has(key)) {
          // Contact exists as customer, mark as both
          const existing = contactMap.get(key);
          existing.types.push('supplier');
          existing.ids.push(contact.id);
          existing.type = 'both';
        } else {
          // New supplier only
          contactMap.set(key, {
            ...contact,
            ids: [contact.id],
            types: ['supplier']
          });
        }
      }
    });

    // Convert map to array and sort by name
    const allContacts = Array.from(contactMap.values()).sort((a, b) => 
      a.name?.localeCompare(b.name) || 0
    );
    
    setContacts(allContacts);
  };

  // Add new contact
  const addContact = async () => {
    if (!formData.name.trim()) return;

    const contactData = {
      name: formData.name.trim(),
      position: formData.position.trim(),
      address: formData.address.trim(),
      contactNumber: formData.contactNumber.trim(),
      createdAt: serverTimestamp()
    };

    let docIds = [];

    // Handle 'both' type - add to both collections
    if (formData.type === 'both') {
      const customerRef = await addDoc(collection(db, 'customers'), contactData);
      const supplierRef = await addDoc(collection(db, 'suppliers'), contactData);
      docIds = [customerRef.id, supplierRef.id];
    } else {
      // Add to single collection
      const collectionName = formData.type === 'customer' ? 'customers' : 'suppliers';
      const docRef = await addDoc(collection(db, collectionName), contactData);
      docIds = [docRef.id];
    }

    // Log activity (best-effort)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const actionText = formData.type === 'customer' 
          ? 'Added customer' 
          : formData.type === 'supplier'
          ? 'Added supplier'
          : 'Added customer/supplier';
        
        await createActivityLog({
          userId: user.id,
          action: actionText,
          details: `${formData.type === 'both' ? 'Customer/Supplier' : formData.type} ${formData.name.trim()} created (ids: ${docIds.join(', ')})`,
          metadata: { type: formData.type, ids: docIds }
        })
      }
    } catch (e) {
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
    setCurrentPage(1); // Reset to first page
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

  // Filter and search logic
  const filteredContacts = contacts.filter(contact => {
    // Filter by type
    const matchesType = filterType === 'all' || contact.type === filterType;
    
    // Search by name, position, address, or contact number
    const matchesSearch = searchTerm === '' || 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

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

        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, position, address, or contact number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="customer">Customer Only</option>
                <option value="supplier">Supplier Only</option>
                <option value="both">Customer/Supplier</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          {(searchTerm || filterType !== 'all') && (
            <div className="mt-3 text-sm text-gray-600">
              Found {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
              {filterType !== 'all' && ` in ${filterType === 'both' ? 'Customer/Supplier' : filterType} category`}
            </div>
          )}
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
                {currentContacts.length > 0 ? (
                  currentContacts.map((contact) => (
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
                            : contact.type === 'supplier'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {contact.type === 'customer' ? 'Customer' : contact.type === 'supplier' ? 'Supplier' : 'Customer/Supplier'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {contacts.length === 0 
                        ? 'No contacts found. Click "Add New Contact" to get started.' 
                        : filteredContacts.length === 0
                        ? 'No contacts match your search or filter criteria.'
                        : 'No contacts on this page.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredContacts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} contacts
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 || 
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="px-2 text-gray-500">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    <option value="both">Customer/Supplier</option>
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