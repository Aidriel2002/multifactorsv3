'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, DocumentData, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/firebase';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import { createActivityLog } from '@/app/lib/supabase/activityLogs';
import EditProjectModal from '@/app/components/EditProjectModal';
interface Project {
  id: string;
  refNo?: string;
  projectName?: string;
  clientName?: string;
  clientPosition?: string;
  clientAddress?: string;
  clientContactNumber?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  adminStatus?: 'approved' | 'on-review' | 'cancelled' | 'onhold' | '';
  adminRemarks?: string;
  adminUpdatedAt?: any;
  adminUpdatedBy?: string;
  createdAt?: any;
  [key: string]: unknown;
}

// Admin check via Supabase profiles.role
const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setIsAdmin(false)
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (!cancelled) setIsAdmin((profile as any)?.role === 'admin')
      } catch (e) {
        if (!cancelled) setIsAdmin(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  return { isAdmin, loading }
}

export default function SaveProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectForRemarks, setProjectForRemarks] = useState<Project | null>(null);
  const [adminStatus, setAdminStatus] = useState<Project['adminStatus']>('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  
  const ITEMS_PER_PAGE = 5;

  const adminStatusOptions = [
    { value: 'approved', label: 'Approved', color: 'w-48 bg-green-100 text-green-800 px-5 py-2 text-lg',  icon: '✓' },
    { value: 'on-review', label: 'On Review', color: 'w-48 bg-yellow-100 text-yellow-800 px-5 py-2 text-lg', icon: '👁' },
    { value: 'cancelled', label: 'Cancelled', color: 'w-48 bg-red-100 text-red-800 px-5 py-2 text-lg', icon: '✕' },
    { value: 'onhold', label: 'On Hold', color: 'w-48 bg-gray-100 text-gray-800 px-5 py-2 text-lg', icon: '⏸' },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      const snapshot = await getDocs(collection(db, 'projects'));
      const projectList: Project[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as DocumentData)
      }));
      setProjects(projectList);
    };
    fetchProjects();
  }, []);

  const handleAddQuotation = (projectId: string, refNo: string) => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createActivityLog({
            userId: user.id,
            action: 'Opened quotation form',
            details: `Preparing quotation for project ${refNo || projectId}`,
            metadata: { projectId, refNo }
          })
        }
      } catch (e) {
      }
    })()
    router.push(`/multifactors/saved-projects/QuotationForm?projectId=${projectId}&refNo=${refNo}`);
  };

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setShowEditModal(true);
  };

  const handleEditSave = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setShowEditModal(false);
    setProjectToEdit(null);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setProjectToEdit(null);
  };

  const handleRemarksClick = (project: Project) => {
    if (!isAdmin) return; // Additional safety check
    setProjectForRemarks(project);
    setAdminStatus(project.adminStatus || '');
    setAdminRemarks(project.adminRemarks || '');
    setShowRemarksModal(true);
  };

  const handleRemarksSubmit = async () => {
    if (!projectForRemarks || !isAdmin) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('You must be logged in.'); return }

      const projectRef = doc(db, 'projects', projectForRemarks.id);
      const updateData = {
        adminStatus,
        adminRemarks,
        adminUpdatedAt: new Date(),
        adminUpdatedBy: user.id,
      };
      
      await updateDoc(projectRef, updateData);
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createActivityLog({
            userId: user.id,
            action: 'Updated project admin remarks',
            details: `Project ${projectForRemarks.refNo || projectForRemarks.id} admin remarks updated`,
            metadata: { collection: 'projects', projectId: projectForRemarks.id }
          })
        }
      } catch (e) {
      }
      
      setProjects(prev => prev.map(p => 
        p.id === projectForRemarks.id 
          ? { ...p, ...updateData }
          : p
      ));
      
      setShowRemarksModal(false);
      setProjectForRemarks(null);
      setAdminStatus('');
      setAdminRemarks('');
    } catch (error) {
      alert('Failed to update remarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeRemarksModal = () => {
    setShowRemarksModal(false);
    setProjectForRemarks(null);
    setAdminStatus('');
    setAdminRemarks('');
  };

  const handleRowClick = (project: Project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.adminStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (adminStatus?: Project['adminStatus']) => {
    if (!adminStatus) return null;
    
    const statusConfig = adminStatusOptions.find(option => option.value === adminStatus);
    if (!statusConfig) return null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        <span className="mr-1">{statusConfig.icon}</span>
        {statusConfig.label}
      </span>
    );
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 mx-auto">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
     <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 mx-auto">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Saved Projects
                </h1>
              </div>
              <p className="text-slate-600 text-lg">Manage and view your project portfolio</p>
            </div>
            
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 font-medium">Admin</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-2 text-lg border-0 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="w-full md:w-64">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-4 text-lg border-0 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                >
                  <option value="all">All Status</option>
                  <option value="">No Status</option>
                  {adminStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-white/50">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 font-semibold text-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span>Reference No.</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Project Name</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Customer</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{isAdmin ? 'Status' : 'Status'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span>Actions</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {currentProjects.length > 0 ? (
              currentProjects.map(project => (
                <div key={project.id} className="group">
                  <div 
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 cursor-pointer"
                    onClick={() => handleRowClick(project)}
                  >
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500 md:hidden">Reference No.</span>
                      <span className="font-mono text-slate-800 bg-slate-100 px-3 py-1 rounded-lg text-sm font-semibold inline-block w-fit">
                        {project.refNo}
                      </span>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500 md:hidden">Project Name</span>
                      <span className="text-slate-800 font-semibold text-lg group-hover:text-blue-700 transition-colors">
                        {project.projectName}
                      </span>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500 md:hidden">Customer</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {project.clientName?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-slate-700 font-medium">
                          {project.clientName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500 md:hidden">{isAdmin ? 'Status' : 'Status'}</span>
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(project.adminStatus) || (
                          <span className="inline-flex items-center rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {isAdmin ? 'No Status' : 'Pending Review'}
                          </span>
                        )}
                      
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-slate-500 md:hidden">Actions</span>
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(project)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center space-x-1 text-sm"
                          title="Manage Project"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="hidden sm:inline">Manage</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No matching projects found</h3>
                <p className="text-slate-500 text-lg">
                  {searchTerm ? 'Try adjusting your search terms' : 'No projects available yet'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white/80 text-slate-700 font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white/80 text-slate-700 font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        )}

        

        {/* Project Details Modal */}
        {showModal && selectedProject && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
  <div className="flex justify-between items-center">
    <div>
      <h2 className="text-2xl font-bold">{selectedProject.projectName}</h2>
      <div className="flex items-center space-x-3 mt-2">
        <p className="text-blue-100 font-mono">{selectedProject.refNo}</p>
        {getStatusBadge(selectedProject.adminStatus)}
      </div>
    </div>
    <button
      onClick={closeModal}
      className="text-white hover:text-gray-200 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Admin Remarks Section - Show to all users but with different styling */}
                {selectedProject.adminStatus && (
                  <div className={`${isAdmin 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200' 
                    : 'bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200'} p-6 rounded-xl`}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className={`w-5 h-5 mr-2 ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {isAdmin ? 'Admin Review' : 'Project Status'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Updated</label>
                        <p className="text-gray-800">
                          {selectedProject.adminUpdatedAt 
                            ? formatDate(selectedProject.adminUpdatedAt.toDate?.() || selectedProject.adminUpdatedAt)
                            : 'Not set'
                          }
                        </p>
                      </div>
                      {selectedProject.adminRemarks && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-600">{isAdmin ? 'Remarks' : 'Comments'}</label>
                          <p className="text-gray-800 border border-gray-200 bg-white/70 p-3 rounded-lg mt-1">
                            {selectedProject.adminRemarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Client Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-800 font-medium">{selectedProject.clientName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Position</label>
                      <p className="text-gray-800">{selectedProject.clientPosition || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Contact Number</label>
                      <p className="text-gray-800">{selectedProject.clientContactNumber || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-800">{selectedProject.clientAddress || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Project Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-800">{selectedProject.description || 'No description provided'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        <p className="text-gray-800">{formatDate(selectedProject.startDate as string)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p className="text-gray-800">{formatDate(selectedProject.endDate as string)}</p>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      closeModal();
                      handleEdit(selectedProject);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Manage Project</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Remarks Modal - Only accessible by admins */}
        {showRemarksModal && projectForRemarks && isAdmin && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full mx-4">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">Admin Review</h2>
                    <p className="text-purple-100">{projectForRemarks.projectName}</p>
                  </div>
                  <button
                    onClick={closeRemarksModal}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as Project['adminStatus'])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    {adminStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    rows={4}
                    placeholder="Add your remarks here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {adminRemarks.length}/500 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    onClick={closeRemarksModal}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemarksSubmit}
                    disabled={!adminStatus || loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        <EditProjectModal
          isOpen={showEditModal}
          project={projectToEdit}
          onClose={handleEditClose}
          onSave={handleEditSave}
          // Pass additional props for quote and admin functionality
          onAddQuotation={handleAddQuotation}
          onAdminRemarks={isAdmin ? handleRemarksClick : undefined}
          isAdmin={isAdmin}
        />
      </div>
    </div>
    </>
  );
}