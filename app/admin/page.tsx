'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, CheckCircle, XCircle, Clock, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface Payment {
  id: string;
  user_id: string;
  method: string;
  trx_id: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch pending payments with user details
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData as any[]);
      }
      
      setLoading(false);
    };

    checkAdminAndFetch();
  }, [router, supabase]);

  const handleAction = async (paymentId: string, userId: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return;
    
    setProcessingId(paymentId);
    try {
      const res = await fetch('/api/admin/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, userId, action })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process payment');
      }

      // Remove from list
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <ShieldAlert className="w-20 h-20 text-rose-500 mb-6" />
        <h2 className="text-2xl font-extrabold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm max-w-[250px]">
          You do not have administrator privileges to view this page.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-3 bg-card-dark border border-border-dark text-white font-bold rounded-xl hover:bg-border-dark transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-white mb-2">Pending Payments</h2>
        <p className="text-slate-400 text-sm">Review and approve manual PRO upgrades.</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-card-dark border border-border-dark border-dashed rounded-3xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-1">All Caught Up!</h3>
          <p className="text-slate-400 text-sm">There are no pending payments to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map(payment => (
            <div key={payment.id} className="bg-card-dark border border-border-dark rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold">{payment.profiles?.full_name || 'Unknown User'}</span>
                  <span className="text-xs font-medium text-slate-500 bg-bg-dark px-2 py-0.5 rounded-md">
                    {payment.profiles?.email}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Method:</span>
                    <span className="capitalize font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {payment.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TrxID:</span>
                    <span className="font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md">
                      {payment.trx_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(payment.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Screenshot & Actions */}
              <div className="flex items-center gap-4 shrink-0 border-t border-border-dark md:border-t-0 pt-4 md:pt-0">
                {payment.screenshot_url ? (
                  <a 
                    href={payment.screenshot_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 bg-blue-400/10 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" /> View Proof <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs font-medium text-slate-500 italic px-4 py-2.5">No screenshot</span>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(payment.id, payment.user_id, 'reject')}
                    disabled={processingId === payment.id}
                    className="w-10 h-10 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
                    title="Reject Payment"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleAction(payment.id, payment.user_id, 'approve')}
                    disabled={processingId === payment.id}
                    className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_4px_12px_rgba(16,185,129,0.25)] disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> 
                    {processingId === payment.id ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
