'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { db } from '@/app/lib/firebase/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { supabase } from '@/app/lib/supabase/client'
import { createActivityLog } from '@/app/lib/supabase/activityLogs'

function PurchaseOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get('projectId');
  const projectRefNo = searchParams.get('projectRefNo');

  const [poData, setPoData] = useState({
    projectRefNo: projectRefNo || '',
    projectName: '',
    poNumber: '',
    supplier: '',
    supplierAddress: '',
    supplierContactNumber: '',
    supplierPosition: '',
    total: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPoNumber, setIsLoadingPoNumber] = useState(true);
  const [suppliers, setSuppliers] = useState<
    { name: string; address: string; contactNumber: string; position?: string }[]
  >([]);
  const [projects, setProjects] = useState<
    { id: string; projectRefNo: string; projectName: string }[]
  >([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'suppliers'));
        const supplierList = querySnapshot.docs.map((doc) => ({
          name: doc.data().name || '',
          address: doc.data().address || '',
          contactNumber: doc.data().contactNumber || '',
          position: doc.data().position || ''
        }));
        setSuppliers(supplierList);
      } catch (error) {
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          projectRefNo: doc.data().refNo || '',
          projectName: doc.data().projectName || ''
        }));
        setProjects(projectList);

        const selectedProject = projectList.find(p => p.projectRefNo === poData.projectRefNo);
        if (selectedProject) {
          setPoData(prev => ({ ...prev, projectName: selectedProject.projectName }));
        }
      } catch (error) {
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const generatePoNumber = async () => {
      try {
        const today = new Date();
        const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1)
          .toString()
          .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

        const q = query(
          collection(db, 'purchaseOrders'),
          where('poNumber', '>=', `${datePrefix}-001`),
          where('poNumber', '<', `${datePrefix}-999`),
          orderBy('poNumber', 'desc')
        );

        const querySnapshot = await getDocs(q);
        let nextNumber = 1;

        if (!querySnapshot.empty) {
          const latestPo = querySnapshot.docs[0].data();
          const lastNumber = parseInt(latestPo.poNumber.split('-')[1]) || 0;
          nextNumber = lastNumber + 1;
        }

        const newPoNumber = `${datePrefix}-${nextNumber.toString().padStart(3, '0')}`;

        setPoData((prev) => ({
          ...prev,
          poNumber: newPoNumber
        }));
      } catch (error) {
        const timestamp = Date.now().toString().slice(-6);
        setPoData((prev) => ({
          ...prev,
          poNumber: `PO-${timestamp}`
        }));
      } finally {
        setIsLoadingPoNumber(false);
      }
    };

    generatePoNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'projectRefNo') {
      const selectedProject = projects.find((p) => p.projectRefNo === value);
      setPoData({
        ...poData,
        projectRefNo: value,
        projectName: selectedProject?.projectName || ''
      });
    } else if (name === 'supplier') {
      const selectedSupplier = suppliers.find((s) => s.name === value);
      setPoData({
        ...poData,
        supplier: value,
        supplierAddress: selectedSupplier?.address || '',
        supplierContactNumber: selectedSupplier?.contactNumber || '',
        supplierPosition: selectedSupplier?.position || ''
      });
    } else {
      setPoData({ ...poData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, 'purchaseOrders'), {
        ...poData,
        projectId,
        createdAt: serverTimestamp()
      });
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createActivityLog({
            userId: user.id,
            action: 'Created purchase order',
            details: `PO ${poData.poNumber} created for project ${poData.projectRefNo} (id: ${docRef.id})`,
            metadata: { collection: 'purchaseOrders' }
          })
        }
      } catch (e) {
      }
      
      alert('Purchase Order saved successfully!');
      router.push('/multifactors/projects');
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
  onClick={() => router.push('/multifactors/projects')}
  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
>
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
  Back to Projects
</button>

          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">New Purchase Order</h1>
                <p className="text-gray-600">Create a new purchase order for your project</p>
              </div>
              {projectRefNo && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md">
                  <div className="text-xs font-medium opacity-90 mb-1">Project Reference</div>
                  <div className="text-lg font-bold font-mono">{projectRefNo}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
              <p className="text-sm text-gray-600 mt-1">Fill in the details below to create your purchase order</p>
            </div>

            {/* Form Body */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Reference */}
                <div className="md:col-span-2">
                  <label htmlFor="projectRefNo" className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Reference <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="projectRefNo"
                      name="projectRefNo"
                      value={poData.projectRefNo}
                      onChange={handleChange}
                      required
                      className="block w-full border border-gray-300 rounded-xl p-3.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Select a project</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.projectRefNo}>
                          {proj.projectRefNo} – {proj.projectName}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* PO Number */}
                <div className="md:col-span-2">
                  <label htmlFor="poNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Order Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="poNumber"
                      name="poNumber"
                      placeholder={isLoadingPoNumber ? 'Generating PO Number...' : 'Enter PO Number'}
                      value={poData.poNumber}
                      onChange={handleChange}
                      disabled={isLoadingPoNumber}
                      required
                      className="block w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                    />
                    {isLoadingPoNumber && (
                      <div className="absolute inset-y-0 right-0 flex items-center px-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplier Dropdown */}
                <div className="md:col-span-2">
                  <label htmlFor="supplier" className="block text-sm font-semibold text-gray-700 mb-2">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="supplier"
                      name="supplier"
                      value={poData.supplier}
                      onChange={handleChange}
                      required
                      className="block w-full border border-gray-300 rounded-xl p-3.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((s, idx) => (
                        <option key={idx} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Supplier Address */}
                <div className="md:col-span-2">
                  <label htmlFor="supplierAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                    Supplier Address
                  </label>
                  <input
                    type="text"
                    id="supplierAddress"
                    name="supplierAddress"
                    value={poData.supplierAddress}
                    onChange={handleChange}
                    readOnly
                    className="block w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Supplier Contact Number */}
                <div>
                  <label htmlFor="supplierContactNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    id="supplierContactNumber"
                    name="supplierContactNumber"
                    value={poData.supplierContactNumber}
                    onChange={handleChange}
                    readOnly
                    className="block w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Supplier Position */}
                <div>
                  <label htmlFor="supplierPosition" className="block text-sm font-semibold text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    id="supplierPosition"
                    name="supplierPosition"
                    value={poData.supplierPosition}
                    onChange={handleChange}
                    placeholder="e.g. Sales Manager"
                    className="block w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Total Amount */}
                <div className="md:col-span-2">
                  <label htmlFor="total" className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-medium">₱</span>
                    <input
                      type="number"
                      id="total"
                      name="total"
                      placeholder="0.00"
                      value={poData.total}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      required
                      className="block w-full border border-gray-300 rounded-xl p-3.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Purchase Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <PurchaseOrderPage />
    </Suspense>
  );
}