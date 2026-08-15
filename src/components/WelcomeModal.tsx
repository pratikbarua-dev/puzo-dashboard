'use client';

import { useState } from 'react';
import { PuzoLogo } from '@/components/PuzoLogo';
import { Button, Sheet } from '@/components/ui';
import { Cpu, Link2, Sparkles, X } from 'lucide-react';

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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface-container p-6 shadow-puzo border border-primary/20 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high transition-fast"
          aria-label="Close welcome modal"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center">
            <PuzoLogo size={90} animated={true} />
          </div>

          <h2 className="mb-1 font-display text-2xl font-black text-on-surface">
            Welcome to PUZO!
          </h2>
          <p className="mb-6 text-body-base text-on-surface-variant max-w-xs">
            Your hardware desk companion for sharing warmth, OLED animations, and haptic moments with your partner.
          </p>

          <div className="flex w-full flex-col gap-3">
            <Button
              variant="primary"
              className="w-full justify-start gap-3 py-3"
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
              className="w-full justify-start gap-3 py-3"
              onClick={() => {
                onClose();
                onStartPairing();
              }}
            >
              <Link2 size={20} />
              <div className="text-left">
                <div className="font-extrabold text-sm">I have a partner code</div>
                <div className="text-[11px] text-on-surface-variant">Link with your partner&apos;s companion</div>
              </div>
            </Button>
          </div>

          <button
            onClick={onClose}
            className="mt-5 text-micro-label font-bold text-on-surface-variant hover:text-on-surface transition-fast"
          >
            Explore Dashboard First →
          </button>
        </div>
      </div>
    </div>
  );
}
