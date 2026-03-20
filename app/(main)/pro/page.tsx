'use client';

import { useRouter } from 'next/navigation';
import { Crown, CheckCircle2, ArrowRight, Zap, Unlock, MessageSquare } from 'lucide-react';

export default function ProPage() {
  const router = useRouter();

  const features = [
    {
      icon: <Unlock className="w-6 h-6 text-yellow-400" />,
      title: "Unlock All Days Immediately",
      desc: "Don't wait. Access your entire roadmap from day one."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
      title: "Unlimited AI Chat",
      desc: "Ask as many questions as you want without restrictions."
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: "Priority Support",
      desc: "Get help faster when you need it most."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen p-6 pb-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[400px] bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="text-center mt-8 mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-[0_0_40px_rgba(250,204,21,0.4)] mb-6 rotate-12">
            <Crown className="w-10 h-10 text-white -rotate-12" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">StudyPath <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">PRO</span></h1>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
            Supercharge your learning journey and achieve your goals faster.
          </p>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-3xl p-6 mb-8">
          <div className="flex items-end justify-center gap-1 mb-8">
            <span className="text-4xl font-black text-white">৳150</span>
            <span className="text-slate-400 font-bold mb-1">/month</span>
          </div>

          <div className="space-y-6">
            {features.map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-card-dark-2 rounded-2xl flex items-center justify-center shrink-0 border border-border-dark">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-extrabold rounded-2xl shadow-[0_8px_20px_rgba(250,204,21,0.3)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
          >
            Get PRO Now <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-slate-500 text-xs mt-4 font-medium">
            Manual payment via bKash or Nagad.
          </p>
        </div>
      </div>
    </div>
  );
}
