'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLinkedData, LinkedData } from '@/app/multifactors/saved-projects/utils/fetchLinkedData';
import { handlePrint } from '@/app/multifactors/saved-projects/utils/printUtils';

// Define proper types for quotations and purchase orders
interface Quotation {
  id: string;
  refNo: string;
  [key: string]: unknown;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  [key: string]: unknown;
}

type ModalItem = Quotation | PurchaseOrder;

export default function ProjectLinkedDataPage() {
  const [linkedData, setLinkedData] = useState<LinkedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'quotations' | 'purchaseOrders'>('quotations');
  const [modalItems, setModalItems] = useState<ModalItem[]>([]);
  const router = useRouter();

  const itemsPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        const results = await fetchLinkedData();
        setLinkedData(results);
      } catch (err) {
        console.error('Error fetching linked data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(linkedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = linkedData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show current page and adjacent pages
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleNavigation = (path: string) => router.push(path);

  const openModal = (items: ModalItem[], type: 'quotations' | 'purchaseOrders') => {
    console.log('Opening modal with:', items, type);
    setModalItems(items);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setShowModal(false);
    setModalItems([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            What to do?
          </h1>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleNavigation('/multifactors/saved-projects/manage-projects')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Projects
            </button>
            
            <button
              onClick={() => handleNavigation('/multifactors/saved-projects/QuotationForm')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Quotations
            </button>
            
            <button
              onClick={() => handleNavigation('/multifactors/saved-projects/purchased-order')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Purchase Orders
            </button>
          </div>
        </div>

        <h1 className='text-2xl mt-11 mb-4 font-semibold'>Recent Projects</h1>

        <div className="space-y-4">
          {currentData.map(({ project, quotations, purchaseOrders }) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4 pb-4 border-b">
                <div className="flex-1">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full mb-2">
                    {project.projectRefNo}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {project.projectName}
                  </h2>
                  <p className="text-gray-600">
                    Client: {project.clientName || 'Not specified'}
                  </p>
                </div>
                <button
                  onClick={() => handlePrint(project, 'project', project.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Quotations */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Quotations ({quotations.length})
                  </h3>
                  {quotations.length > 0 ? (
                    quotations.length === 1 ? (
                      <button
                        onClick={() => handlePrint(quotations[0], 'quotation', quotations[0].id)}
                        className="w-full text-left bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">
                            {quotations[0].refNo}
                          </span>
                          <svg className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Button clicked, quotations:', quotations);
                          openModal(quotations as ModalItem[], 'quotations');
                        }}
                        className="w-full bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900">
                            View all {quotations.length} quotations
                          </span>
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No quotations available</p>
                  )}
                </div>

                {/* Purchase Orders */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Purchase Orders ({purchaseOrders.length})
                  </h3>
                  {purchaseOrders.length > 0 ? (
                    purchaseOrders.length === 1 ? (
                      <button
                        onClick={() => handlePrint(purchaseOrders[0], 'purchaseOrder', purchaseOrders[0].id)}
                        className="w-full text-left bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-900">
                            {purchaseOrders[0].poNumber}
                          </span>
                          <svg className="w-4 h-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => openModal(purchaseOrders as ModalItem[], 'purchaseOrders')}
                        className="w-full bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-900">
                            View all {purchaseOrders.length} purchase orders
                          </span>
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No purchase orders available</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {linkedData.length === 0 && (
            <div className=" p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500">There are no projects to display at the moment.</p>
            </div>
          )}
        </div>

        {linkedData.length > 0 && (
          <div className=" p-4 mt-1">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, linkedData.length)} of {linkedData.length} projects
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col z-10">
            <div className="px-6 pt-5 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalType === 'quotations' ? 'Quotations' : 'Purchase Orders'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                  {modalItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handlePrint(
                          item, 
                          modalType === 'quotations' ? 'quotation' : 'purchaseOrder',
                          item.id
                        );
                        closeModal();
                      }}
                      className={`w-full text-left ${
                        modalType === 'quotations' 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                      } border rounded-lg p-4 transition-colors group`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          modalType === 'quotations' ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {modalType === 'quotations' 
                            ? (item as Quotation).refNo 
                            : (item as PurchaseOrder).poNumber
                          }
                        </span>
                        <svg 
                          className={`w-5 h-5 ${
                            modalType === 'quotations' ? 'text-green-600' : 'text-red-600'
                          } opacity-0 group-hover:opacity-100 transition-opacity`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}