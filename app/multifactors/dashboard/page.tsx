'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { supabase } from '@/app/lib/supabase/client';

interface Quotation {
  id: string;
  refNo?: string;
  date?: string;
  name?: string;
  grandTotal?: number;
}

const IconPlaceholder = ({ size = 10 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundColor: '#09521bff',
      borderRadius: '2px',
    }}
  />
);

export default function AdminDashboard() {
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      try {
        const quotationsSnapshot = await getDocs(collection(db, 'quotations'));
        setTotalQuotations(quotationsSnapshot.size);

        const pendingQuery = query(
          collection(db, 'users'),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingApprovals(pendingSnapshot.size);

        const { data: usersData, count, error: usersError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' });
        
        if (usersError) {
          setUserCount(0);
        } else {
          setUserCount(count || 0);
        }

        const recentQuery = query(
          collection(db, 'quotations'),
          orderBy('date', 'desc'),
          limit(4)
        );
        const recentSnapshot = await getDocs(recentQuery);
        const recentList: Quotation[] = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Quotation[];
        setRecentQuotations(recentList);

      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    color,
    trend,
  }: {
    title: string;
    value: string | number;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-sm text-green-600">
              <IconPlaceholder size={16} />
              <span className="ml-1">{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-xl ${
            color === 'text-indigo-600'
              ? 'bg-indigo-100'
              : color === 'text-amber-600'
              ? 'bg-amber-100'
              : 'bg-emerald-100'
          }`}
        >
          <IconPlaceholder />
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 mx-auto overflow-hidden"> 
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-600 mt-1">
              Welcome back! Here&apos;s what&apos;s happening today.
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Quotations"
              value={totalQuotations.toLocaleString()}
              color="text-indigo-600"
              trend=""
            />
            <StatCard
              title="Pending Approvals"
              value={pendingApprovals}
              color="text-amber-600"
              trend=""
            />
            <StatCard
              title="Total Users"
              value={userCount}
              color="text-emerald-600"
              trend=""
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Recent Quotations</h2>
                <Link href="/multifactors/saved-projects/quotation-list" passHref>
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">View All</button>
                </Link>
              </div>
              <div className="space-y-4">
                {recentQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-sm font-mono text-slate-600 bg-white px-2 py-1 rounded">
                          {quotation.refNo || 'N/A'}
                        </span>
                        <span className="text-sm text-slate-500">{quotation.date || 'N/A'}</span>
                      </div>
                      <p className="font-medium text-slate-900">{quotation.name || 'Unknown Customer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                         ₱ {quotation.grandTotal ? quotation.grandTotal.toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/multifactors/saved-projects/QuotationForm" passHref>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 m-2">
                    Create New Quotation
                  </button>
                </Link>
                <Link href="/multifactors/account-approval" passHref>
                  <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 m-2">
                    Manage Users
                  </button>
                </Link>
                <Link href="/multifactors/saved-projects/quotation-list" passHref>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 m-2">
                    Quotation List
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}