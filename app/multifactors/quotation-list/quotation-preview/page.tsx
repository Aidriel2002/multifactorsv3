'use client';
import React, { useState, useRef, useEffect } from 'react';
import PrintableQuotation from '@/app/multifactors/saved-projects/printable-quotation/page';
import { db } from '@/app/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

type QuotationItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Quotation = {
  refNo: string;
  projectId?: string;          // 🔑 link to project doc
  projectRef?: string;      // 🔑 fetched from project
  date: string;
  name: string;
  position?: string;
  address?: string;
  through?: string;
  subject?: string;
  description?: string;
  items?: QuotationItem[];
  totalPrice: number;
  vat: number;
  grandTotal: number;
};

type Props = {
  quotation: Partial<Quotation>;
  onBack?: () => void;
};

export default function QuotationPreview({ quotation, onBack }: Props) {
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // 🔎 Fetch projectRefNo if quotation has projectId
 useEffect(() => {
  const loadQuotation = async () => {
    if (!quotation) return;

    let projectRef = '';
    if (quotation.projectId) {
      try {
        const projectSnap = await getDoc(doc(db, 'projects', quotation.projectId));
        if (projectSnap.exists()) {
          projectRef = projectSnap.data().refNo || '';
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      }
    }

      setSelectedQuotation({
        ...quotation,
        projectRef, // ✅ merged project ref no
      } as Quotation);
    };

    loadQuotation();
  }, [quotation]);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Quotation ${selectedQuotation?.refNo || ''}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @page { size: A4; margin: 10mm; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              .signature { margin-top: 60px; display: flex; justify-content: space-between; }
              .signature-line { border-top: 1px solid #000; width: 200px; text-align: center; }
              .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
              .logo-section { width: 100px; }
              .logo-img { width: 200px; height: auto; }
              .ref-section { text-align: right; }
              @media print {
                .header-container { display: flex !important; justify-content: space-between !important; }
                .ref-section { text-align: right !important; }
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 200);
    } else {
      window.print();
    }
  };

  if (!selectedQuotation) return <p>No quotation selected</p>;

  return (
    <>
      <div>
        <div className="mb-4 flex justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            🖨 Print
          </button>
        </div>

        <div ref={printRef}>
           <PrintableQuotation
    quotation={{
      refNo: selectedQuotation.refNo,
      projectRefNo: selectedQuotation.projectRef || '',
      date: selectedQuotation.date,
      name: selectedQuotation.name,
      position: selectedQuotation.position || '',
      address: selectedQuotation.address || '',
      through: selectedQuotation.through || '',
      subject: selectedQuotation.subject || '',
      description: selectedQuotation.description || '',
      items: selectedQuotation.items || [],
      totalPrice: selectedQuotation.totalPrice,
      vat: selectedQuotation.vat,
      grandTotal: selectedQuotation.grandTotal,
    }}
  />
        </div>
      </div>
    </>
  );
}