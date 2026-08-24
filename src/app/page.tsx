'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PuzoMascotTalk } from '@/components/PuzoMascotTalk';
import { PuzoLogo } from '@/components/PuzoLogo';
import { Sheet, Button } from '@/components/ui';
import {
  Sparkles,
  Volume2,
  Users,
  Calendar,
  UploadCloud,
  Shield,
  CheckCircle,
  Cookie,
  Lock,
  FileText,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

const storeProducts = [
  {
    tag: 'NEW ANNOUNCEMENT',
    title: 'PUZO Companion One',
    subtitle: 'The intelligent desk robot.',
    availability: 'Registration Open • Early Allocation',
    badge: 'Includes OLED expression engine & haptics',
    icon: Sparkles,
  },
  {
    tag: 'POPULAR PAIR',
    title: 'PUZO Duo Pack',
    subtitle: 'Connected partner companions.',
    availability: 'Priority Access • Partner Link',
    badge: 'Synchronized tap & emotion mode included',
    icon: Users,
  },
];

const features = [
  { icon: Sparkles, eyebrow: 'EMOTION ENGINE', title: 'Expressive OLED eyes.', description: 'Render joy, focus, affection, and dozens of dynamic facial expressions with high-contrast OLED optics.' },
  { icon: Volume2, eyebrow: 'ACOUSTIC & HAPTICS', title: 'Immersive sound packs.', description: 'Tactile haptic impulses paired with acoustic feedback for natural, human-feeling interactions.' },
  { icon: Users, eyebrow: 'PARTNER LINK', title: 'Real-time presence.', description: 'Pair two companions across continents. Send physical taps and synchronized emotional states instantly.' },
  { icon: Calendar, eyebrow: 'SMART ROUTINES', title: 'Automated schedules.', description: 'Gentle morning wakeups, focus-timer prompts, and bedtime rituals tuned to your personal workflow.' },
  { icon: UploadCloud, eyebrow: 'OVER-THE-AIR', title: 'Continuous updates.', description: 'Wireless firmware upgrades keep your companion evolving with new behaviors and capabilities.' },
  { icon: Shield, eyebrow: 'PRIVACY FIRST', title: 'Encrypted on-device.', description: 'Local processing and end-to-end encryption. Your companion data never leaves your control.' },
];

const steps = [
  { number: '1', title: 'Pair', description: 'Plug in your PUZO, open the app, and connect via WiFi in seconds.', circleBg: 'bg-[#FF5A5F]', circleText: 'text-white' },
  { number: '2', title: 'Play', description: 'Send emotions, trigger sounds, and watch your companion come alive on your desk.', circleBg: 'bg-[#2EC4B6]', circleText: 'text-white' },
  { number: '3', title: 'Evolve', description: 'Your PUZO learns your routines, gets firmware updates, and grows with you.', circleBg: 'bg-[#FFD166]', circleText: 'text-[#3B2800]' },
];

export default function Home() {
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'sales' | 'cookies' | null>(null);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('puzo_cookie_consent');
    if (saved !== null) setCookieConsent(saved === 'true');
  }, []);

  const handleCookieConsent = (accepted: boolean) => {
    setCookieConsent(accepted);
    localStorage.setItem('puzo_cookie_consent', String(accepted));
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#1E232B] scroll-smooth antialiased">
      <div className="bg-[#FFEBEF] border-b border-[#FF5A5F]/20 py-2.5 px-4 text-center text-xs font-bold tracking-wide text-[#C82D35]">
        <span>PUZO Companion launch registration is now open.</span>
        <Link href="/reserve" className="underline hover:text-[#A82835] ml-1.5">Reserve Early Access →</Link>
      </div>

      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#EBF0F5]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <PuzoLogo size={32} animated />
            <span className="text-[17px] font-black tracking-[-0.02em] text-[#D93845]" style={{ fontFamily: 'var(--font-display)' }}>PUZO</span>
          </Link>
          <div className="hidden sm:flex items-center gap-7">
            <a href="#overview" className="text-[13px] font-bold tracking-wide text-[#64748B] hover:text-[#1E232B] transition-colors">Overview</a>
            <a href="#features" className="text-[13px] font-bold tracking-wide text-[#64748B] hover:text-[#1E232B] transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] font-bold tracking-wide text-[#64748B] hover:text-[#1E232B] transition-colors">How It Works</a>
            <a href="#lineup" className="text-[13px] font-bold tracking-wide text-[#64748B] hover:text-[#1E232B] transition-colors">Lineup</a>
          </div>
          <Link href="/login"><Button size="sm" className="rounded-full px-5 font-bold">Sign In</Button></Link>
        </div>
      </nav>

      <section id="overview" className="min-h-[80vh] flex items-center relative overflow-hidden py-14 sm:py-20">
        <div className="absolute top-[-10%] left-[-5%] w-[520px] h-[520px] rounded-full bg-[#FF5A5F]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[10%] w-[420px] h-[420px] rounded-full bg-[#2EC4B6]/8 blur-3xl pointer-events-none" />
        <div className="absolute top-[30%] right-[-5%] w-[360px] h-[360px] rounded-full bg-[#FFD166]/15 blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center w-full">
          <div>
            <h1 className="puzo-display text-[38px] sm:text-[48px] lg:text-[60px] font-black text-[#1E232B]">
              Meet PUZO.
              <br />
              Your desk&apos;s new
              <br />
              best friend.
            </h1>
            <p className="text-[16px] sm:text-[17px] text-[#64748B] leading-[1.7] max-w-[480px] mt-5 font-medium">
              A tiny robot that sits on your desk, expresses emotions, plays sounds, and keeps you connected with the people you love — all through a beautiful companion app.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/reserve"><Button size="lg" className="rounded-full px-7 font-bold shadow-md shadow-[#FF5A5F]/20">Reserve Now <ArrowRight size={18} /></Button></Link>
              <a href="#features"><Button variant="outline" size="lg" className="rounded-full px-7 font-bold">Learn More</Button></a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative p-7 sm:p-10 rounded-[32px] bg-white border border-[#EBF0F5] shadow-xl shadow-slate-900/[0.06] max-w-[480px] w-full mx-auto">
              <PuzoMascotTalk size={260} mascotClassName="drop-shadow-[0_10px_25px_rgba(255,90,95,0.16)]" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="puzo-eyebrow text-[11px] text-[#FF5A5F]">Features</p>
            <h2 className="puzo-display text-[28px] sm:text-[36px] font-black text-[#1E232B] mt-2">Everything your desk companion needs</h2>
            <p className="text-[15px] text-[#64748B] leading-relaxed mt-3 font-medium">Packed with personality and thoughtful features designed to make your workspace feel alive.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {features.map((f) => (
              <div key={f.title} className="puzo-card puzo-card-hover p-6 sm:p-7">
                <div className="h-11 w-11 rounded-2xl grid place-items-center bg-[#FFEBEF] text-[#FF5A5F]">
                  <f.icon size={20} />
                </div>
                <p className="puzo-eyebrow text-[10px] text-[#FF5A5F] mt-4">{f.eyebrow}</p>
                <h3 className="text-[17px] font-extrabold tracking-tight text-[#1E232B] mt-1" style={{ fontFamily: 'var(--font-display)' }}>{f.title}</h3>
                <p className="text-[13.5px] text-[#64748B] leading-relaxed mt-1.5">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="puzo-eyebrow text-[11px] text-[#FF5A5F]">How It Works</p>
          <h2 className="puzo-display text-[28px] sm:text-[36px] font-black text-[#1E232B] mt-2">Three steps to happiness</h2>
          <p className="text-[15px] text-[#64748B] mt-3 font-medium">Getting started with your PUZO is ridiculously simple.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center relative">
                <div className={`h-14 w-14 rounded-full grid place-items-center text-[20px] font-black ${s.circleBg} ${s.circleText}`}>{s.number}</div>
                <h3 className="font-extrabold text-[17px] mt-4 text-[#1E232B]" style={{ fontFamily: 'var(--font-display)' }}>{s.title}</h3>
                <p className="text-[13.5px] text-[#64748B] leading-relaxed mt-2 max-w-[240px]">{s.description}</p>
                {i < steps.length - 1 && <div className="hidden sm:block absolute top-7 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] border-t-2 border-dashed border-[#EBF0F5]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="lineup" className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="puzo-eyebrow text-[11px] text-[#FF5A5F]">Lineup</p>
            <h2 className="puzo-display text-[28px] sm:text-[36px] font-black text-[#1E232B] mt-2">Choose your setup</h2>
            <p className="text-[15px] text-[#64748B] mt-3 font-medium">Select the companion package tailored for your workspace.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {storeProducts.map((p) => (
              <div key={p.title} className="puzo-card p-7 sm:p-8 flex flex-col">
                <p className="puzo-eyebrow text-[10px] text-[#FF5A5F]">{p.tag}</p>
                <h3 className="text-[22px] font-black tracking-tight text-[#1E232B] mt-2" style={{ fontFamily: 'var(--font-display)' }}>{p.title}</h3>
                <p className="text-[14px] text-[#64748B] font-medium mt-1">{p.subtitle}</p>
                <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-[12px] font-extrabold text-[#1E232B]">{p.availability}</p>
                  <p className="text-[11px] text-[#64748B] mt-1">{p.badge}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-[#EBF0F5] flex items-center justify-between">
                  <Link href="/reserve"><Button size="sm" className="rounded-full font-bold">Reserve</Button></Link>
                  <span className="text-[11px] font-bold tracking-wide text-[#2EC4B6] flex items-center gap-1.5"><CheckCircle size={14} /> Early Access</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 bg-white border-t border-[#EBF0F5]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <PuzoLogo size={26} />
            <span className="text-[14px] font-black tracking-tight text-[#D93845]" style={{ fontFamily: 'var(--font-display)' }}>PUZO</span>
            <span className="text-[11px] text-[#94A3B8]">© 2026 PUZO Inc.</span>
          </div>
          <div className="flex flex-wrap gap-5 text-[11px] font-bold tracking-wide">
            <button onClick={() => setActivePolicy('privacy')} className="text-[#64748B] hover:text-[#1E232B] transition-colors">Privacy Policy</button>
            <button onClick={() => setActivePolicy('terms')} className="text-[#64748B] hover:text-[#1E232B] transition-colors">Terms of Use</button>
            <button onClick={() => setActivePolicy('sales')} className="text-[#64748B] hover:text-[#1E232B] transition-colors">Sales & Warranty</button>
            <button onClick={() => setActivePolicy('cookies')} className="text-[#64748B] hover:text-[#1E232B] transition-colors">Cookie Preferences</button>
          </div>
        </div>
      </footer>

      {cookieConsent === null && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-[#EBF0F5] p-5 rounded-[22px] shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FFEBEF] text-[#FF5A5F] shrink-0"><Cookie size={18} /></div>
            <div>
              <h4 className="text-[13px] font-extrabold text-[#1E232B]" style={{ fontFamily: 'var(--font-display)' }}>Cookie & Privacy Consent</h4>
              <p className="text-[12px] text-[#64748B] leading-relaxed mt-1">PUZO uses essential cookies for secure sessions. Optional cookies help improve telemetry.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => handleCookieConsent(false)} className="text-[12px] font-bold px-4 py-2 rounded-full hover:bg-[#F8FAFC] text-[#64748B]">Essential Only</button>
            <Button size="sm" className="rounded-full font-bold" onClick={() => handleCookieConsent(true)}>Accept All</Button>
          </div>
        </div>
      )}

      <Sheet open={activePolicy === 'privacy'} onClose={() => setActivePolicy(null)} title="Privacy Policy">
        <div className="space-y-4 text-sm leading-relaxed py-2">
          <div className="flex items-center gap-2 text-[#FF5A5F] font-bold"><Lock size={18} /> On-Device Encrypted Architecture</div>
          <p>Your privacy is fundamental to PUZO. All expression processing and emotion calculations happen locally on-device.</p>
          <h4 className="font-extrabold pt-2">1. Data Collection & Telemetry</h4><p className="text-[#64748B]">We collect minimal encrypted telemetry to maintain stability and deliver OTA updates.</p>
          <h4 className="font-extrabold pt-2">2. Partner Link & Encryption</h4><p className="text-[#64748B]">Partner taps are end-to-end encrypted via TLS 1.3. No audio or sensor feeds are recorded.</p>
        </div>
      </Sheet>
      <Sheet open={activePolicy === 'terms'} onClose={() => setActivePolicy(null)} title="Terms of Use">
        <div className="space-y-4 text-sm leading-relaxed py-2">
          <div className="flex items-center gap-2 text-[#FF5A5F] font-bold"><FileText size={18} /> Service Agreement</div>
          <p>By using the PUZO dashboard or companion device, you agree to these Terms.</p>
          <h4 className="font-extrabold pt-2">1. Account Responsibilities</h4><p className="text-[#64748B]">You are responsible for keeping your session authentication secure.</p>
          <h4 className="font-extrabold pt-2">2. Software License</h4><p className="text-[#64748B]">Firmware and dashboard are licensed, not sold. Reverse engineering or malicious payload injection is prohibited.</p>
        </div>
      </Sheet>
      <Sheet open={activePolicy === 'sales'} onClose={() => setActivePolicy(null)} title="Sales & Warranty Policy">
        <div className="space-y-4 text-sm leading-relaxed py-2">
          <div className="flex items-center gap-2 text-[#FF5A5F] font-bold"><RefreshCw size={18} /> Early Access & Warranty</div>
          <p>Reservations secure priority access to initial production batches.</p>
          <h4 className="font-extrabold pt-2">1. Pre-order Guarantee</h4><p className="text-[#64748B]">No binding commitment until batch allocation. Cancel anytime before shipment.</p>
          <h4 className="font-extrabold pt-2">2. Limited Hardware Warranty</h4><p className="text-[#64748B]">1-year limited warranty against manufacturing defects in OLED, haptics, and MCU.</p>
        </div>
      </Sheet>
      <Sheet open={activePolicy === 'cookies'} onClose={() => setActivePolicy(null)} title="Cookie Preferences">
        <div className="space-y-4 text-sm leading-relaxed py-2">
          <div className="flex items-center gap-2 text-[#FF5A5F] font-bold"><Cookie size={18} /> Cookie Preferences</div>
          <p>Essential cookies are required for authentication. Analytics are optional.</p>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"><div><p className="font-bold">Essential Cookies</p><p className="text-xs text-[#64748B]">Session & auth security.</p></div><span className="text-xs font-bold text-[#2EC4B6]">Always Active</span></div>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"><div><p className="font-bold">Analytics</p><p className="text-xs text-[#64748B]">Telemetry metrics.</p></div><button onClick={() => handleCookieConsent(!cookieConsent)} className={`px-3 py-1 text-xs rounded-full font-bold ${cookieConsent ? 'bg-[#2EC4B6] text-white' : 'bg-[#E2E8F0] text-[#1E232B]'}`}>{cookieConsent ? 'Enabled' : 'Disabled'}</button></div>
        </div>
      </Sheet>
    </div>
  );
}
