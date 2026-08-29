'use client';

import { CheckCircle2, Circle, Cpu, Link2, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface OnboardingChecklistProps {
  hasDevices: boolean;
  hasPartner: boolean;
  hasInteractions: boolean;
  onOpenDeviceSetup: () => void;
  onOpenPairing: () => void;
  onOpenInteractions: () => void;
}

export function OnboardingChecklist({
  hasDevices,
  hasPartner,
  hasInteractions,
  onOpenDeviceSetup,
  onOpenPairing,
  onOpenInteractions,
}: OnboardingChecklistProps) {
  const completedCount = (hasDevices ? 1 : 0) + (hasPartner ? 1 : 0) + (hasInteractions ? 1 : 0);

  // If all 3 onboarding steps are completed, don't show the onboarding banner
  if (completedCount === 3) return null;

  return (
    <Card className="mb-5 rounded-[32px] border border-[#FF5A5F]/20 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#FF5A5F]" />
            <h3 className="text-base font-extrabold text-[#1E232B]">Get Started with PUZO</h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Complete these 3 simple steps to bring your companion to life.
          </p>
        </div>
        <span className="rounded-full bg-[#FFEBEF] px-3 py-1 font-mono text-[10px] font-bold text-[#FF5A5F] uppercase">
          {completedCount} / 3 Done
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <div
          className="h-full bg-[#FF5A5F] transition-all duration-500 ease-out"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {/* Step 1 */}
        <div
          onClick={!hasDevices ? onOpenDeviceSetup : undefined}
          className={`flex flex-col justify-between rounded-2xl p-3.5 border transition-all ${
            hasDevices
              ? 'border-[#C7F9CC] bg-[#F0FDF9]'
              : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF5A5F]/40 hover:bg-[#FFEBEF]/20 cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Cpu size={16} className={hasDevices ? 'text-[#065A60]' : 'text-[#FF5A5F]'} />
              <span className="font-extrabold text-xs text-[#1E232B]">1. Register PUZO</span>
            </div>
            {hasDevices ? (
              <CheckCircle2 size={16} className="text-[#065A60] shrink-0" />
            ) : (
              <Circle size={16} className="text-[#94A3B8] shrink-0" />
            )}
          </div>
          <p className="font-mono text-[10px] text-[#64748B] mb-2">
            {hasDevices ? 'Hardware connected' : 'Enter 4-character code'}
          </p>
          {!hasDevices && (
            <Button size="sm" variant="outline" className="w-full justify-between mt-auto">
              <span>Add Device</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>

        {/* Step 2 */}
        <div
          onClick={!hasPartner ? onOpenPairing : undefined}
          className={`flex flex-col justify-between rounded-2xl p-3.5 border transition-all ${
            hasPartner
              ? 'border-[#C7F9CC] bg-[#F0FDF9]'
              : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF5A5F]/40 hover:bg-[#FFEBEF]/20 cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Link2 size={16} className={hasPartner ? 'text-[#065A60]' : 'text-[#FF5A5F]'} />
              <span className="font-extrabold text-xs text-[#1E232B]">2. Pair Partner</span>
            </div>
            {hasPartner ? (
              <CheckCircle2 size={16} className="text-[#065A60] shrink-0" />
            ) : (
              <Circle size={16} className="text-[#94A3B8] shrink-0" />
            )}
          </div>
          <p className="font-mono text-[10px] text-[#64748B] mb-2">
            {hasPartner ? 'Partner companion linked' : 'Share or enter code'}
          </p>
          {!hasPartner && (
            <Button size="sm" variant="outline" className="w-full justify-between mt-auto">
              <span>Pair Code</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>

        {/* Step 3 */}
        <div
          onClick={!hasInteractions ? onOpenInteractions : undefined}
          className={`flex flex-col justify-between rounded-2xl p-3.5 border transition-all ${
            hasInteractions
              ? 'border-[#C7F9CC] bg-[#F0FDF9]'
              : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#FF5A5F]/40 hover:bg-[#FFEBEF]/20 cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Heart size={16} className={hasInteractions ? 'text-[#065A60]' : 'text-[#FF5A5F]'} />
              <span className="font-extrabold text-xs text-[#1E232B]">3. First Moment</span>
            </div>
            {hasInteractions ? (
              <CheckCircle2 size={16} className="text-[#065A60] shrink-0" />
            ) : (
              <Circle size={16} className="text-[#94A3B8] shrink-0" />
            )}
          </div>
          <p className="font-mono text-[10px] text-[#64748B] mb-2">
            {hasInteractions ? 'First reaction sent!' : 'Send ❤️ or emotion'}
          </p>
          {!hasInteractions && (
            <Button size="sm" variant="outline" className="w-full justify-between mt-auto">
              <span>Send ❤️</span>
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

