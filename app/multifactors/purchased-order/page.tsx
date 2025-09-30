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
  const projectRefNo = searchParams.get('projectRefNo'); // now using projectRefNo

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

  // Fetch suppliers
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
        console.error('Error fetching suppliers:', error);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch projects
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

        // Set project name if projectRefNo already exists
        const selectedProject = projectList.find(p => p.projectRefNo === poData.projectRefNo);
        if (selectedProject) {
          setPoData(prev => ({ ...prev, projectName: selectedProject.projectName }));
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Generate PO Number
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
        console.error('Error generating PO number:', error);
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

  // Handle changes
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

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, 'purchaseOrders'), {
        ...poData,
        projectId,
        createdAt: serverTimestamp()
      });
      // Log activity (best-effort)
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
        console.warn('Activity log failed for purchase order creation', e)
      }
      alert('Purchase Order saved successfully!');
      router.push('/multifactors/projects');
    } catch (error) {
      console.error('Error saving Purchase Order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto ">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8 shadow-sm">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Document Information</h3>
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
              {projectRefNo}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Purchase Order Details</h2>

            <div className="grid gap-6">
              {/* Project Reference */}
              <div>
                <label htmlFor="projectRefNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Reference
                </label>
                <select
                  id="projectRefNo"
                  name="projectRefNo"
                  value={poData.projectRefNo}
                  onChange={handleChange}
                  required
                  className="block w-full border border-gray-300 rounded-lg p-3"
                >
                  <option value="">Select a project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.projectRefNo}>
                      {proj.projectRefNo} – {proj.projectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Number */}
              <div>
                <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Order Number
                </label>
                <input
                  type="text"
                  id="poNumber"
                  name="poNumber"
                  placeholder={isLoadingPoNumber ? 'Generating PO Number...' : 'Enter PO Number'}
                  value={poData.poNumber}
                  onChange={handleChange}
                  disabled={isLoadingPoNumber}
                  required
                  className="block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              {/* Supplier Dropdown */}
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name
                </label>
                <select
                  id="supplier"
                  name="supplier"
                  value={poData.supplier}
                  onChange={handleChange}
                  required
                  className="block w-full border border-gray-300 rounded-lg p-3"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-filled Supplier Address */}
              <div>
                <label htmlFor="supplierAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Address
                </label>
                <input
                  type="text"
                  id="supplierAddress"
                  name="supplierAddress"
                  value={poData.supplierAddress}
                  onChange={handleChange}
                  readOnly
                  className="block w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                />
              </div>

              {/* Auto-filled Supplier Contact Number */}
              <div>
                <label htmlFor="supplierContactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Contact Number
                </label>
                <input
                  type="text"
                  id="supplierContactNumber"
                  name="supplierContactNumber"
                  value={poData.supplierContactNumber}
                  onChange={handleChange}
                  readOnly
                  className="block w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                />
              </div>

              {/* Optional Supplier Position */}
              <div>
                <label htmlFor="supplierPosition" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Position (optional)
                </label>
                <input
                  type="text"
                  id="supplierPosition"
                  name="supplierPosition"
                  value={poData.supplierPosition}
                  onChange={handleChange}
                  placeholder="e.g. Sales Manager"
                  className="block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>

              {/* Total Amount */}
              <div>
                <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
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
                  className="block w-full border border-gray-300 rounded-lg p-3"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {isSubmitting ? 'Processing...' : 'Save Purchase Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseOrderPage />
    </Suspense>
  );
}