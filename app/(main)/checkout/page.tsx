'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Upload, AlertCircle, MessageCircle } from 'lucide-react';

type PaymentMethod = 'bkash' | 'nagad' | 'binance';

export default function CheckoutPage() {
  const [method, setMethod] = useState<PaymentMethod>('bkash');
  const [trxId, setTrxId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'binance') return;
    if (!trxId.trim()) {
      setError('Transaction ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let screenshotUrl = '';

      // Upload file if selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('payment_screenshots')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // If bucket doesn't exist or fails, we'll just proceed without the screenshot for this prototype
          // In production, you'd want to handle this strictly.
        } else if (data) {
          const { data: publicUrlData } = supabase.storage
            .from('payment_screenshots')
            .getPublicUrl(fileName);
          screenshotUrl = publicUrlData.publicUrl;
        }
      }

      // Submit payment record
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          trxId,
          screenshotUrl
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-3">Payment Submitted!</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-[280px] mx-auto leading-relaxed">
          We have received your payment details. Our admin will verify the transaction and upgrade your account to PRO within 24 hours.
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="px-8 py-4 bg-card-dark border border-border-dark text-white font-extrabold rounded-2xl hover:bg-border-dark transition-colors"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">Checkout</h1>
        <p className="text-slate-400 text-sm">Upgrade to PRO for ৳150/month</p>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {(['bkash', 'nagad', 'binance'] as PaymentMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`py-3 rounded-xl border font-bold text-sm capitalize transition-all ${
              method === m 
                ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(98,100,244,0.15)]' 
                : 'bg-card-dark border-border-dark text-slate-400 hover:bg-border-dark'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {method === 'binance' ? (
        <div className="bg-card-dark border border-border-dark rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Binance Pay</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Binance Pay এখন available নেই। Contact us on WhatsApp.
          </p>
          <a 
            href="https://wa.me/1234567890" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp Us
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card-dark border border-border-dark rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">1</span>
              Send Money
            </h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Please Send Money exactly <strong className="text-white">৳150</strong> to the following {method === 'bkash' ? 'bKash' : 'Nagad'} personal number:
            </p>
            <div className="bg-bg-dark border border-border-dark rounded-xl p-4 text-center">
              <span className="text-xl font-mono font-black text-primary tracking-wider">017XXXXXXXX</span>
            </div>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">2</span>
              Verify Payment
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transaction ID (TrxID) *</label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. 9A7B6C5D4E"
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Screenshot (Optional)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-bg-dark border border-border-dark border-dashed rounded-xl px-4 py-4 flex items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary transition-colors">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {file ? file.name : 'Upload Screenshot'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !trxId.trim()}
            className="w-full py-4 bg-gradient-to-r from-primary to-violet-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(98,100,244,0.25)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center"
          >
            {loading ? 'Submitting...' : 'Submit Payment'}
          </button>
        </form>
      )}
    </div>
  );
}
