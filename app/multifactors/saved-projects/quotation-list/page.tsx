'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/lib/firebase/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from 'firebase/firestore';
import QuotationPreview from '@/app/multifactors/saved-projects/quotation-preview/page';

type QuotationItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Quotation = {
  id: string;
  name?: string;
  refNo?: string;
  refNumber?: string;
  date?: string;
  grandTotal?: number;
  totalAmount?: number;
  totalPrice?: number;
  vat?: number;
  items?: QuotationItem[];
  isRevision: boolean;
  originalRefNo?: string;
  [key: string]: string | number | boolean | QuotationItem[] | undefined;
};

type GroupedQuotation = {
  original: Quotation | null;
  revisions: Quotation[];
};

type RevisionWithOriginal = Quotation & {
  originalName: string;
  originalRef: string;
};

export default function QuotationListPage() {
  const [groupedQuotations, setGroupedQuotations] = useState<GroupedQuotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [newRefNo, setNewRefNo] = useState<string>('');
  const [formData, setFormData] = useState<{ name: string; date: string; refNo: string }>({
    name: '',
    date: '',
    refNo: '',
  });

  const router = useRouter();

  // Generate new refNo + set date
  useEffect(() => {
    const generateRefNo = async () => {
      const now = new Date();
      const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      const qRef = query(
        collection(db, 'quotations'),
        where('refNo', '>=', `${yyyymm}-000`),
        where('refNo', '<', `${yyyymm}-999`)
      );
      const snapshot = await getDocs(qRef);
      const count = snapshot.size + 1;

      const refNo = `Q-${yyyymm}-${String(count).padStart(3, '0')}`;
      setNewRefNo(refNo);

      setFormData({
        name: '',
        refNo,
        date: now.toLocaleDateString('en-CA'),
      });
    };

    generateRefNo();
  }, []);

  // Fetch quotations + revisions
  useEffect(() => {
    const fetchAllQuotations = async () => {
      const originalsSnap = await getDocs(collection(db, 'quotations'));
      const originals: Quotation[] = originalsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Quotation, 'id' | 'isRevision'>),
        isRevision: false,
      }));

      const revisionsSnap = await getDocs(collection(db, 'quotationRevisions'));
      const revisions: Quotation[] = revisionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Quotation, 'id' | 'isRevision'>),
        isRevision: true,
      }));

      const groupMap: Record<string, GroupedQuotation> = {};

      originals.forEach((q) => {
        const ref = q.refNo || q.refNumber;
        if (!ref?.trim()) return;
        if (!groupMap[ref]) groupMap[ref] = { original: q, revisions: [] };
        else groupMap[ref].original = q;
      });

      revisions.forEach((r) => {
        const revRef = r.refNo || r.refNumber;
        if (!revRef?.trim()) return;
        const baseRef = revRef.startsWith('QR-') ? revRef.replace('QR-', 'Q-') : revRef;
        if (!baseRef.trim()) return;
        if (!groupMap[baseRef]) groupMap[baseRef] = { original: null, revisions: [r] };
        else groupMap[baseRef].revisions.push(r);
      });

      Object.values(groupMap).forEach((group) => {
        group.revisions.sort((a, b) => (a.date || '') > (b.date || '') ? 1 : -1);
      });

      setGroupedQuotations(Object.values(groupMap));
    };

    fetchAllQuotations();
  }, []);

  // Save new quotation
  const handleSaveQuotation = async () => {
    try {
      await addDoc(collection(db, 'quotations'), formData);
      alert('Quotation saved!');
      router.refresh(); // reloads list
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation');
    }
  };

  const filteredGroups = groupedQuotations.filter((group) => {
    const original = group.original;
    if (!original) return false;
    const nameMatch = original.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const ref = original.refNo || original.refNumber || '';
    const refMatch = ref.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || refMatch;
  });

  const allRevisions: RevisionWithOriginal[] = groupedQuotations.flatMap((group) =>
    group.revisions.map((rev) => ({
      ...rev,
      originalName: group.original?.name || '',
      originalRef: group.original?.refNo || group.original?.refNumber || '',
    }))
  );
  return (
    <>
   <div className="min-h-screen  p-4 md:p-8">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-violet-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      {/* Header Section */}
      <div className="mb-8">
  <div className="flex items-center gap-3 mb-2">
    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h1 className="text-3xl font-bold text-black">
      Quotation List
    </h1>
  </div>
  <p className="text-black ml-11">Manage and view all your quotations</p>
</div>
      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or reference number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Quotations Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden mb-12">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Reference No.
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-slate-600 font-medium">No quotations found</p>
                        <p className="text-slate-400 text-sm">Try adjusting your search terms</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <React.Fragment key={group.original?.id || group.revisions[0]?.id}>
                    {/* Original */}
                    
                    {group.original && (
                      <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {group.original.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{group.original.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {group.original.refNo || group.original.refNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{group.original.date}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-slate-800 text-lg">₱ {Number(group.original.grandTotal).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedQuotation(group.original)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={() => group.original?.id && router.push(`/multifactors/saved-projects/revise-quotation?id=${group.original.id}`)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Revise
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                   
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revisions Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden mt-8">
        <div className="hidden md:block overflow-x-auto">
          <h2 className="px-6 pt-6 pb-2 text-lg font-bold text-purple-700">Quotation Revisions</h2>
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Revision Ref No.
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Original Ref No.
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {allRevisions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-purple-500">
                    No revision quotations found.
                  </td>
                </tr>
              ) : (
                allRevisions.map((rev) => (
                  <tr key={rev.id} className="hover:bg-purple-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-300 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {rev.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">{rev.name || rev.originalName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {rev.refNumber || rev.refNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {rev.originalRefNo} 
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-700 font-medium">{rev.date}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-purple-900 text-lg">₱ {Number(rev.grandTotal).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedQuotation(rev)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQuotation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-auto rounded-2xl shadow-2xl border border-white/50 relative">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="font-semibold text-slate-800">Quotation Preview</h2>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-800 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          <div className="p-6">
  <QuotationPreview
                quotation={{
                  refNo: String(selectedQuotation?.refNo ?? selectedQuotation?.refNumber ?? ''),
                  date: String(selectedQuotation?.date ?? ''),
                  name: String(selectedQuotation?.name ?? 'Unnamed Customer'),
                  position: String(selectedQuotation?.position ?? ''),
                  address: String(selectedQuotation?.address ?? ''),
                  through: String(selectedQuotation?.through ?? ''),
                  subject: String(selectedQuotation?.subject ?? ''),
                  description: String(selectedQuotation?.description ?? ''),
                  items: Array.isArray(selectedQuotation?.items)
                    ? (selectedQuotation.items as QuotationItem[])
                    : [],
                  totalPrice: Number(selectedQuotation?.totalPrice ?? selectedQuotation?.totalAmount ?? 0),
                  vat: Number(selectedQuotation?.vat ?? 0),
                  grandTotal: Number(selectedQuotation?.grandTotal ?? selectedQuotation?.totalAmount ?? 0),
                }}
              />

</div>
          </div>
          </div>
      )}
      </div>
      </>
  );
}