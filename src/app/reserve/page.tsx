'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PuzoLogo } from '@/components/PuzoLogo';
import { PuzoMascot } from '@/components/PuzoMascot';
import { Button, Input, Select } from '@/components/ui';
import { toast } from '@/components/Toast';
import { ArrowLeft, Check, Sparkles, Users, Shield, Truck } from 'lucide-react';

type Model = 'one' | 'duo';

export default function ReservePage() {
  const [model, setModel] = useState<Model>('one');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('India');
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in name and email');
      return;
    }
    if (!agree) {
      toast.error('Please agree to the reservation terms');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Reservation confirmed — check your email!');
    }, 900);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex flex-col">
        <nav className="bg-white/80 backdrop-blur-xl border-b border-[#EBF0F5] sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <PuzoLogo size={32} animated />
              <span className="text-[17px] font-black tracking-[-0.02em] text-[#D93845]" style={{ fontFamily: 'var(--font-display)' }}>PUZO</span>
            </Link>
            <Link href="/" className="text-sm font-bold text-[#64748B] hover:text-[#1E232B] flex items-center gap-1.5">
              <ArrowLeft size={16} /> Back to home
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#2EC4B6] grid place-items-center text-white mb-6">
              <Check size={28} strokeWidth={3} />
            </div>
            <h1 className="puzo-display text-[30px] font-black text-[#1E232B]">You&apos;re on the list!</h1>
            <p className="text-[15px] text-[#64748B] leading-relaxed mt-3 font-medium">
              Thanks for reserving <span className="font-bold text-[#1E232B]">{model === 'one' ? 'PUZO Companion One' : 'PUZO Duo Pack'}</span>. We&apos;ve sent a confirmation to <span className="font-bold text-[#1E232B]">{email}</span>.
            </p>
            <div className="puzo-card p-5 mt-8 text-left">
              <p className="text-xs font-bold tracking-wide text-[#64748B] uppercase">What happens next?</p>
              <ul className="mt-3 space-y-2.5 text-sm text-[#1E232B]">
                <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5A5F] shrink-0" /> Early batch allocation — no payment until your slot is confirmed</li>
                <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5A5F] shrink-0" /> You&apos;ll get an email when it&apos;s time to complete your order</li>
                <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5A5F] shrink-0" /> Cancel anytime before shipment — no fees</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center mt-8">
              <Link href="/"><Button variant="outline" className="rounded-full">Back to home</Button></Link>
              <Button className="rounded-full" onClick={() => setSubmitted(false)}>Reserve another</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA]">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-[#EBF0F5] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <PuzoLogo size={32} animated />
            <span className="text-[17px] font-black tracking-[-0.02em] text-[#D93845]" style={{ fontFamily: 'var(--font-display)' }}>PUZO</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-[#64748B] hover:text-[#1E232B] flex items-center gap-1.5">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
        <div>
          <p className="puzo-eyebrow text-[11px] text-[#FF5A5F]">Reserve</p>
          <h1 className="puzo-display text-[32px] sm:text-[40px] font-black text-[#1E232B] mt-2 leading-[1.05]">Reserve your PUZO.</h1>
          <p className="text-[15px] text-[#64748B] leading-relaxed mt-3 font-medium max-w-[520px]">
            Secure priority access to the first production batch. No payment today — cancel anytime before shipment.
          </p>

          <div className="hidden lg:flex justify-center mt-8 p-8 rounded-[32px] bg-white border border-[#EBF0F5] shadow-sm">
            <div className="text-center">
              <PuzoMascot size={180} mood="happy" className="drop-shadow-[0_10px_20px_rgba(255,90,95,0.15)]" />
              <p className="text-xs font-bold tracking-wide text-[#64748B] uppercase mt-4">Your future desk companion</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: Shield, label: 'No payment today' },
              { icon: Truck, label: 'Free shipping' },
              { icon: Sparkles, label: '1-year warranty' },
            ].map((item) => (
              <div key={item.label} className="puzo-card p-4 text-center">
                <item.icon size={18} className="mx-auto text-[#FF5A5F]" />
                <p className="text-[11px] font-bold mt-2 text-[#1E232B]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="puzo-card p-6 sm:p-7 lg:sticky lg:top-24">
          <h2 className="text-[18px] font-extrabold text-[#1E232B]" style={{ fontFamily: 'var(--font-display)' }}>Reservation details</h2>
          <p className="text-[13px] text-[#64748B] mt-1">We&apos;ll email you when your batch is ready.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setModel('one')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${model === 'one' ? 'border-[#FF5A5F] bg-[#FFEBEF]/60' : 'border-[#EBF0F5] bg-white hover:border-[#E2E8F0]'}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={model === 'one' ? 'text-[#FF5A5F]' : 'text-[#64748B]'} />
                <span className="text-sm font-extrabold">One</span>
                {model === 'one' && <Check size={14} className="ml-auto text-[#FF5A5F]" />}
              </div>
              <p className="text-xs text-[#64748B] mt-1">Single companion</p>
            </button>
            <button
              type="button"
              onClick={() => setModel('duo')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${model === 'duo' ? 'border-[#FF5A5F] bg-[#FFEBEF]/60' : 'border-[#EBF0F5] bg-white hover:border-[#E2E8F0]'}`}
            >
              <div className="flex items-center gap-2">
                <Users size={16} className={model === 'duo' ? 'text-[#FF5A5F]' : 'text-[#64748B]'} />
                <span className="text-sm font-extrabold">Duo Pack</span>
                {model === 'duo' && <Check size={14} className="ml-auto text-[#FF5A5F]" />}
              </div>
              <p className="text-xs text-[#64748B] mt-1">Partner connected</p>
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <Input label="Full name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email address" type="email" placeholder="ada@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Select label="Country / Region" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option>India</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Germany</option>
              <option>Japan</option>
              <option>Singapore</option>
              <option>Other</option>
            </Select>
          </div>

          <label className="mt-5 flex gap-3 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] accent-[#FF5A5F]" />
            <span className="text-xs leading-relaxed text-[#64748B]">
              I agree to the Reservation Terms — no charge until batch confirmation. I can cancel anytime.
            </span>
          </label>

          <Button type="submit" size="lg" className="w-full mt-6 rounded-full" isLoading={loading}>
            Reserve {model === 'one' ? 'PUZO One' : 'PUZO Duo'} — Free
          </Button>

          <p className="text-[11px] text-center text-[#94A3B8] mt-3">No spam. Unsubscribe anytime. Read our Privacy Policy.</p>
        </form>
      </div>
    </div>
  );
}
