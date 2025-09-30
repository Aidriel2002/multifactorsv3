'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLinkedData, LinkedData } from '@/app/multifactors/saved-projects/utils/fetchLinkedData';
import { handlePrint } from '@/app/multifactors/saved-projects/utils/printUtils';
export default function ProjectLinkedDataPage() {
  const [linkedData, setLinkedData] = useState<LinkedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleNavigation = (path: string) => router.push(path);

  if (loading) {
    return (
      
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 text-center">Loading data...</span>
        </div>
      </div>
    );
  }

  // Mobile Card View Component
  const MobileProjectCard = ({ project, quotations, purchaseOrders }: { 
    project: any, 
    quotations: any[], 
    purchaseOrders: any[] 
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Project Header */}
      <div className="mb-4">
        <div className="flex flex-wrap items-start justify-between mb-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
            {project.projectRefNo}
          </span>
          <button
            onClick={() => handlePrint(project, 'project', project.id)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-150"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
        <h3 className="font-semibold text-gray-900 text-base mb-1">
          {project.projectName}
        </h3>
        <p className="text-sm text-gray-600">
          Client: {project.clientName || 'Not specified'}
        </p>
      </div>

      {/* Quotations Section */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Quotations ({quotations.length})
        </h4>
        {quotations.length > 0 ? (
          <div className="space-y-2">
            {quotations.map((q) => (
              <div key={q.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-900 flex-1 pr-2">
                    {q.refNo}
                  </p>
                  <button
                    onClick={() => handlePrint(q, 'quotation', q.id)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 transition-colors duration-150 flex-shrink-0"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-sm text-gray-500">
            No quotations available
          </div>
        )}
      </div>

      {/* Purchase Orders Section */}
      <div>
        <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Purchase Orders ({purchaseOrders.length})
        </h4>
        {purchaseOrders.length > 0 ? (
          <div className="space-y-2">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-900 flex-1 pr-2">
                    {po.poNumber}
                  </p>
                  <button
                    onClick={() => handlePrint(po, 'purchaseOrder', po.id)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-150 flex-shrink-0"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-sm text-gray-500">
            No purchase orders available
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Projects Management Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Overview of projects with linked quotations and purchase orders
              </p>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
              <button
                onClick={() => handleNavigation('/multifactors/saved-projects/manage-projects')}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Projects
              </button>
              
              <button
                onClick={() => handleNavigation('/multifactors/saved-projects/QuotationForm')}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Quotations
              </button>
              
              <button
                onClick={() => handleNavigation('/multifactors/purchased-order')}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-150 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Purchase Orders
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isMobile ? (
          /* Mobile Card Layout */
          <div className="space-y-4">
            {linkedData.map(({ project, quotations, purchaseOrders }) => (
              <MobileProjectCard
                key={project.id}
                project={project}
                quotations={quotations}
                purchaseOrders={purchaseOrders}
              />
            ))}
            
            {linkedData.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500 text-sm">There are no projects to display at the moment.</p>
              </div>
            )}
          </div>
        ) : (
          /* Desktop/Tablet Table Layout */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-4 md:px-6 font-semibold text-gray-900 text-sm md:text-base">
                      Project Details
                    </th>
                    <th className="text-left py-4 px-4 md:px-6 font-semibold text-gray-900 text-sm md:text-base min-w-[200px]">
                      Quotations
                    </th>
                    <th className="text-left py-4 px-4 md:px-6 font-semibold text-gray-900 text-sm md:text-base min-w-[200px]">
                      Purchase Orders
                    </th>
                    <th className="text-center py-4 px-4 md:px-6 font-semibold text-gray-900 text-sm md:text-base">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {linkedData.map(({ project, quotations, purchaseOrders }) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {/* Project Details Column */}
                      <td className="py-4 md:py-6 px-4 md:px-6">
                        <div className="space-y-2 max-w-xs">
                          <div>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mb-1">
                              {project.projectRefNo}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm break-words">
                            {project.projectName}
                          </h3>
                          <p className="text-sm text-gray-600 break-words">
                            Client: {project.clientName || 'Not specified'}
                          </p>
                        </div>
                      </td>

                      {/* Quotations Column */}
                      <td className="py-4 md:py-6 px-4 md:px-6">
                        <div className="space-y-2 max-w-sm">
                          {quotations.length > 0 ? (
                            quotations.map((q) => (
                              <div key={q.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-900 truncate">
                                      {q.refNo}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePrint(q, 'quotation', q.id)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 transition-colors duration-150 flex-shrink-0"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs md:text-sm text-gray-500">No quotations</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Purchase Orders Column */}
                      <td className="py-4 md:py-6 px-4 md:px-6">
                        <div className="space-y-2 max-w-sm">
                          {purchaseOrders.length > 0 ? (
                            purchaseOrders.map((po) => (
                              <div key={po.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-red-900 truncate">
                                      {po.poNumber}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePrint(po, 'purchaseOrder', po.id)}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-150 flex-shrink-0"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs md:text-sm text-gray-500">No purchase orders</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 md:py-6 px-4 md:px-6">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handlePrint(project, 'project', project.id)}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-150"
                          >
                            <svg className="w-4 h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span className="hidden sm:inline">Print Project</span>
                            <span className="sm:hidden">Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {linkedData.length === 0 && (
              <div className="text-center py-12 px-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500">There are no projects to display at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
   </>
  );
}