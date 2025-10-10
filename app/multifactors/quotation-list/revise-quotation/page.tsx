'use client';
import { useState, useEffect, ChangeEvent, FormEvent, Suspense } from 'react';
import { db } from '@/app/lib/firebase/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

interface QuotationItem {
  qty: string;
  description: string;
  unitPrice: string;
  total: string;
}

interface QuotationData {
  name?: string;
  position?: string;
  address?: string;
  through?: string;
  subject?: string;
  description?: string;
  items: QuotationItem[];
  totalPrice?: string;
  vat?: string;
  grandTotal?: string;
  date?: string;
  refNo?: string;
}

function RevisionQuotationFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get('id');

  const [originalRefNo, setOriginalRefNo] = useState('');
  const [revisionRefNo, setRevisionRefNo] = useState('');
  const [formData, setFormData] = useState<QuotationData>({
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
  });

  // fetch original quotation
  useEffect(() => {
    const fetchOriginal = async () => {
      if (!quotationId) return;
      const docRef = doc(db, 'quotations', quotationId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as QuotationData;
        const refNo = data.refNo || '';
        setOriginalRefNo(refNo);

        if (refNo) {
          const baseRef = refNo.replace('Q-', 'RQ-');
          const qRev = query(
            collection(db, 'quotationRevisions'),
            where('refNumber', '>=', `${baseRef}`),
            where('refNumber', '<', `${baseRef}Z`)
          );
          const snapshot = await getDocs(qRev);
          const nextRevNum = snapshot.size + 1;
          setRevisionRefNo(`${baseRef}`);
        } else {
          setRevisionRefNo('');
        }

        setFormData({
          ...formData,
          name: data.name || '',
          position: data.position || '',
          address: data.address || '',
          through: data.through || '',
          subject: data.subject || '',
          description: data.description || '',
          items: data.items || [{ qty: '', description: '', unitPrice: '', total: '' }],
          totalPrice: data.totalPrice || '',
          vat: data.vat || '',
          grandTotal: data.grandTotal || '',
          date: new Date().toLocaleDateString('en-CA'),
        });
      } else {
        setOriginalRefNo('');
        setRevisionRefNo('');
      }
    };
    fetchOriginal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string) => {
    if (index < 0 || index >= formData.items!.length) return;
    const updatedItems = formData.items!.map((item, i) => {
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
    const vat = parseFloat((totalPrice * 0.12).toFixed(2));
    const grandTotal = parseFloat((totalPrice + vat).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalPrice: totalPrice.toFixed(2),
      vat: vat.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items!, { qty: '', description: '', unitPrice: '', total: '' }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items!];
    newItems.splice(index, 1);

    const totalPrice = newItems.reduce((sum, item) => sum + parseFloat(item.total || '0'), 0);
    const vat = totalPrice * 0.12;
    const grandTotal = totalPrice + vat;

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      totalPrice: totalPrice.toFixed(2),
      vat: vat.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addDoc(collection(db, 'quotationRevisions'), {
      ...formData,
      refNumber: revisionRefNo,
      originalRefNo,
      originalQuotationId: quotationId,
      createdAt: Timestamp.now(),
    });
    alert('Revision Quotation saved!');
    router.push('/multifactors/saved-projects/quotation-list');
  };

  if (!quotationId) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        No original quotation selected.
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 px-6 md:px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-xl font-bold">📝</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Revise Quotation</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Reference Numbers */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Original Reference No.</label>
                <input
                  type="text"
                  value={originalRefNo}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Revision Reference No.</label>
                <input
                  type="text"
                  value={revisionRefNo}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-purple-700 font-mono text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Date */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 focus:outline-none"
              />
            </div>

            {/* Customer Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Through</label>
                  <input
                    type="text"
                    name="through"
                    value={formData.through}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none resize-none"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Items Details</h2>
              <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
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
                          className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Enter description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none"
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
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Item #{index + 1}</span>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                            <input
                              type="text"
                              placeholder="0"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                            <input
                              type="text"
                              placeholder="0.00"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="Enter item description"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                          <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-700">
                            {item.total || '0.00'}
                          </div>
                        </div>
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

            {/* Totals Section */}
           <div className="mb-8">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing Summary</h2>
  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Total Price</label>
        <input
          type="text"
          name="totalPrice"
          value={formData.totalPrice}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg font-medium bg-gray-100 text-gray-600"
          placeholder="0.00"
          readOnly
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">VAT (12%)</label>
        <input
          type="text"
          name="vat"
          value={formData.vat}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg font-medium bg-gray-100 text-gray-600"
          placeholder="0.00"
          readOnly
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Grand Total</label>
        <input
          type="text"
          name="grandTotal"
          value={formData.grandTotal}
          className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg font-bold text-lg bg-indigo-50 text-indigo-700"
          placeholder="0.00"
          readOnly
        />
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
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>💾</span>
                <span>Submit Revision</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}

export default function RevisionQuotationForm() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading quotation...</div>}>
      <RevisionQuotationFormInner />
    </Suspense>
  );
}