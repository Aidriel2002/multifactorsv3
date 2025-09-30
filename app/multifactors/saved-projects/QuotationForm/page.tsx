'use client';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { db } from '@/app/lib/firebase/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface QuotationItem {
  qty: string;
  description: string;
  unitPrice: string;
  total: string;
}

interface Project {
  id: string;
  projectName: string;
  clientName: string;
  clientPosition: string;
  clientAddress: string;
  clientContactNumber: string;
  description: string;
  refNo: string;
  adminStatus?: 'approved' | 'on-review' | 'cancelled' | 'onhold' | '';
}

interface FormDataType {
  name: string;
  position: string;
  address: string;
  through: string;
  subject: string;
  description: string;
  items: QuotationItem[];
  totalPrice: string;
  vat: string;
  grandTotal: string;
  date: string;
  projectId?: string;
 projectRef?: string;
}

export default function QuotationForm() {
  const [useItems, setUseItems] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false);
  const router = useRouter();
  const [refNo, setRefNo] = useState('');
  
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    position: '',
    address: '',
    through: '',
    subject: '',
    description: '',
    items: [{ qty: '', description: '', unitPrice: '', total: '' }],
    totalPrice: '',
    vat: '',
    grandTotal: '',
    date: '',
    projectRef: '',
  });

  // Load projects from Firebase
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const projectsData: Project[] = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({
            id: doc.id,
            ...doc.data()
          } as Project);
        });
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  // Generate reference number
  useEffect(() => {
    const generateRefNo = async () => {
      const now = new Date();
      const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      const q = query(
        collection(db, 'quotations'),
        where('refNo', '>=', `Q-${yyyymm}-000`),
        where('refNo', '<=', `Q-${yyyymm}-999`),
        orderBy('refNo', 'desc'),
        limit(1)
      );

      const querySnap = await getDocs(q);
      let nextNumber = 1;
      if (!querySnap.empty) {
        const lastRef = querySnap.docs[0].data().refNo as string;
        const lastNum = parseInt(lastRef.split('-')[2], 10);
        nextNumber = lastNum + 1;
      }

      setRefNo(`Q-${yyyymm}-${String(nextNumber).padStart(3, '0')}`);
      
      setFormData((prev) => ({
        ...prev,
        date: now.toLocaleDateString('en-CA'),
      }));
    };

    generateRefNo();
  }, []);

  // Handle project selection
const handleProjectSelect = (projectId: string) => {
  const selectedProject = projects.find(p => p.id === projectId);
  if (selectedProject) {
    // ✅ Only allow approved projects
    if (selectedProject.adminStatus !== 'approved') {
      alert('This project is not approved. You cannot create a quotation for it.');
      setSelectedProjectId('');
      setShowProjectDropdown(false);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: selectedProject.clientName || '',
      position: selectedProject.clientPosition || '',
      address: selectedProject.clientAddress || '',
      subject: selectedProject.projectName || '',
      description: selectedProject.description || '',
      projectId: projectId,
      projectRef: selectedProject.refNo || '',
    }));
    setSelectedProjectId(projectId);
  }
  setShowProjectDropdown(false);
};
  // Clear project selection
  const handleClearProject = () => {
    setSelectedProjectId('');
    setFormData((prev) => ({
      ...prev,
      name: '',
      position: '',
      address: '',
      through: '',
      subject: '',
      description: '',
      projectId: undefined,
      projectRefNo: '',
    }));
  };
  
  // Handle field change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string) => {
    if (index < 0 || index >= formData.items.length) return;

    const updatedItems = formData.items.map((item, i) => {
      if (i !== index) return item;

      const updatedItem = { ...item, [field]: value };

      if (field === 'qty' || field === 'unitPrice') {
        const qty = parseFloat(updatedItem.qty) || 0;
        const unitPrice = parseFloat(updatedItem.unitPrice) || 0;
        updatedItem.total = (qty * unitPrice).toFixed(2);
      }

      return updatedItem;
    });

    const totalPrice = updatedItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const vat = totalPrice * 0.12;
    const grandTotal = totalPrice + vat;

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalPrice: totalPrice.toFixed(2),
      vat: vat.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    }));
  };

  const handleTotalChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    if (name === 'totalPrice') {
      const vat = numValue * 0.12;
      const grandTotal = numValue + vat;
      setFormData((prev) => ({
        ...prev,
        totalPrice: value,
        vat: vat.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
      }));
    } else if (name === 'vat') {
      const totalPrice = parseFloat(formData.totalPrice) || 0;
      const grandTotal = totalPrice + numValue;
      setFormData((prev) => ({
        ...prev,
        vat: value,
        grandTotal: grandTotal.toFixed(2),
      }));
    } else if (name === 'grandTotal') {
      const totalPrice = parseFloat(formData.totalPrice) || 0;
      const vat = numValue - totalPrice;
      setFormData((prev) => ({
        ...prev,
        vat: vat.toFixed(2),
        grandTotal: value,
      }));
    }
  };

  // Submit quotation
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (selectedProjectId) {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (selectedProject && selectedProject.adminStatus !== 'approved') {
      alert('You cannot create a quotation because the selected project is not approved.');
      return;
    }
  }

  const submissionData = {
    ...formData,
    refNo,
    createdAt: Timestamp.now(),
    items: useItems ? formData.items : [],
    projectRefNo: formData.projectRef || null,  
  };

  await addDoc(collection(db, 'quotations'), submissionData);
  alert('Quotation saved!');
  router.push('/multifactors/saved-projects/quotation-list');
};


  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { qty: '', description: '', unitPrice: '', total: '' }],
    }));
  };


  return (
    
    <>
    <div className="min-h-screen  p-4 md:p-8">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">

        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-violet-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
        
      <div className="relative max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 md:px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-xl font-bold">📋</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Create Quotation</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {/* Basic Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">1</span>
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Reference No.</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={refNo}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400">🔒</span>
                    </div>
                  </div>
                </div>
                  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      Project Reference No.
    </label>
    <input
      type="text"
       value={formData.projectRef || ""}
      readOnly
      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
    />
  </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="date"
                      value={formData.date}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400">📅</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Reference Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">📁</span>
                Project Reference
              </h2>
              
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Select Project (Optional)</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between"
                    >
                      <span className={selectedProjectId ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedProjectId 
                          ? projects.find(p => p.id === selectedProjectId)?.projectName || 'Select a project'
                          : 'Select a project'
                        }
                      </span>
                      <span className={`transform transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    
                    {showProjectDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowProjectDropdown(false);
                              setSelectedProjectId('');
                            }}
                            className="w-full px-3 py-2 text-left text-gray-500 hover:bg-gray-50 rounded-md text-sm"
                          >
                            No project selected
                          </button>
                        </div>
                        <div className="border-t border-gray-200">
                          {projects.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No projects available
                            </div>
                          ) : (
                            projects.map((project) => (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => handleProjectSelect(project.id)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:outline-none"
                              >
                                <div className="font-medium text-gray-900">{project.projectName}</div>
                                <div className="text-sm text-gray-500">{project.clientName}</div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedProjectId && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">✓</span>
                        <span className="text-sm text-blue-700 font-medium">Project selected - form auto-filled</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearProject}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">2</span>
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter position"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter address"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Through</label>
                  <input
                    type="text"
                    name="through"
                    value={formData.through}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter reference"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter subject"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={4}
                    placeholder="Enter detailed description..."
                  />
                </div>
              </div>
            </div>

            {/* Items Section Toggle */}
            <div className="mb-8">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">Items Configuration</h3>
                      <p className="text-sm text-gray-600">Choose how to handle items and pricing</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
  type="checkbox"
  id="useItems"
  checked={useItems}
  onChange={(e) => setUseItems(e.target.checked)}
  className="sr-only peer"
/>

                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Include Items Section</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Item Table - only shown if useItems is true */}
            {useItems && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">4</span>
                  Items Details
                </h2>
                
                <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
                  {/* Desktop Headers */}
                  <div className="hidden md:grid md:grid-cols-5 gap-4 mb-4 px-2">
                    <div className="text-sm font-medium text-gray-600">Quantity</div>
                    <div className="text-sm font-medium text-gray-600">Description</div>
                    <div className="text-sm font-medium text-gray-600">Unit Price</div>
                    <div className="text-sm font-medium text-gray-600">Total</div>
                    <div className="text-sm font-medium text-gray-600">Action</div>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                       
                          
                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-5 gap-4 items-center">
                          <input
                            type="text"
                            placeholder="0"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Enter description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md font-medium text-gray-700">
                            {item.total || '0.00'}
                          </div>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <span>➕</span>
                    <span>Add Item</span>
                  </button>
                </div>
              </div>
            )}

            {/* Totals Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">💰</span>
                Pricing Summary
              </h2>
              
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Price</label>
                    <input
                      type="text"
                      name="totalPrice"
                      value={formData.totalPrice}
                      onChange={handleTotalChange}
                      readOnly={useItems}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-lg font-medium transition-colors ${
                        useItems 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">VAT (12%)</label>
                    <input
                      type="text"
                      name="vat"
                      value={formData.vat}
                      onChange={handleTotalChange}
                      readOnly={useItems}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-lg font-medium transition-colors ${
                        useItems 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Grand Total</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="grandTotal"
                        value={formData.grandTotal}
                        onChange={handleTotalChange}
                        readOnly={useItems}
                        className={`w-full px-4 py-3 border-2 border-indigo-200 rounded-lg font-bold text-lg transition-colors ${
                          useItems 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'bg-white text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-indigo-500">💵</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/multifactors/saved-projects/quotation-list')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>💾</span>
                <span>Submit Quotation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}