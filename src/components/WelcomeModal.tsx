'use client';

import { PuzoLogo } from '@/components/PuzoLogo';
import { Button } from '@/components/ui';
import { Cpu, Link2, X } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onStartDeviceSetup: () => void;
  onStartPairing: () => void;
}

export function WelcomeModal({
  open,
  onClose,
  onStartDeviceSetup,
  onStartPairing,
}: WelcomeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl border border-[#EBF0F5] animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E232B] transition-colors cursor-pointer"
          aria-label="Close welcome modal"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center">
            <PuzoLogo size={90} animated={true} />
          </div>

          <h2 className="mb-1 text-2xl font-extrabold text-[#1E232B] tracking-tight">
            Welcome to PUZO!
          </h2>
          <p className="mb-6 text-xs leading-relaxed text-[#64748B] max-w-xs">
            Your hardware desk companion for sharing warmth, OLED animations, and haptic moments with your partner.
          </p>

          <div className="flex w-full flex-col gap-3">
            <Button
              variant="primary"
              className="w-full justify-start gap-3.5 py-4"
              onClick={() => {
                onClose();
                onStartDeviceSetup();
              }}
            >
              <Cpu size={20} />
              <div className="text-left">
                <div className="font-extrabold text-sm">I have a PUZO device</div>
                <div className="text-[11px] font-normal opacity-90">Claim and connect your hardware</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3.5 py-4"
              onClick={() => {
                onClose();
                onStartPairing();
              }}
            >
              <Link2 size={20} />
              <div className="text-left">
                <div className="font-extrabold text-sm">I have a partner code</div>
                <div className="text-[11px] text-[#64748B]">Link with your partner&apos;s companion</div>
              </div>
            </Button>
          </div>

          <button
            onClick={onClose}
            className="mt-5 font-mono text-[11px] font-bold text-[#94A3B8] hover:text-[#1E232B] transition-colors cursor-pointer uppercase tracking-wider"
          >
            Explore Dashboard First →
          </button>
        </div>
      </div>
    </div>
  );
}

