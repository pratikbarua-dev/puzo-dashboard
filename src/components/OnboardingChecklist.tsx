'use client';

import { CheckCircle2, Circle, Cpu, Link2, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardHeader, Button } from '@/components/ui';

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
    <Card className="mb-5 border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary-container" />
            <h3 className="font-display text-lg font-black text-on-surface">Get Started with PUZO</h3>
          </div>
          <p className="text-body-base text-on-surface-variant">
            Complete these 3 simple steps to bring your companion to life.
          </p>
        </div>
        <span className="rounded-full bg-primary-container/20 px-3 py-1 text-label-caps font-bold text-primary">
          {completedCount} / 3 Completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className="h-full bg-primary-container transition-all duration-500 ease-out"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Step 1 */}
        <div
          onClick={!hasDevices ? onOpenDeviceSetup : undefined}
          className={`flex flex-col justify-between rounded-lg p-3 border transition-fast ${
            hasDevices
              ? 'border-secondary/40 bg-secondary/5'
              : 'border-border/40 bg-surface-container-low hover:bg-surface-container-high cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Cpu size={16} className={hasDevices ? 'text-secondary' : 'text-primary'} />
              <span className="font-extrabold text-sm">1. Register PUZO</span>
            </div>
            {hasDevices ? (
              <CheckCircle2 size={18} className="text-secondary shrink-0" />
            ) : (
              <Circle size={18} className="text-on-surface-variant shrink-0" />
            )}
          </div>
          <p className="text-micro-label text-on-surface-variant mb-2">
            {hasDevices ? 'Hardware connected' : 'Enter 4-character code'}
          </p>
          {!hasDevices && (
            <Button size="sm" variant="outline" className="w-full justify-between mt-auto">
              <span>Add Device</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>

        {/* Step 2 */}
        <div
          onClick={!hasPartner ? onOpenPairing : undefined}
          className={`flex flex-col justify-between rounded-lg p-3 border transition-fast ${
            hasPartner
              ? 'border-secondary/40 bg-secondary/5'
              : 'border-border/40 bg-surface-container-low hover:bg-surface-container-high cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Link2 size={16} className={hasPartner ? 'text-secondary' : 'text-primary'} />
              <span className="font-extrabold text-sm">2. Pair Partner</span>
            </div>
            {hasPartner ? (
              <CheckCircle2 size={18} className="text-secondary shrink-0" />
            ) : (
              <Circle size={18} className="text-on-surface-variant shrink-0" />
            )}
          </div>
          <p className="text-micro-label text-on-surface-variant mb-2">
            {hasPartner ? 'Partner companion linked' : 'Share or enter code'}
          </p>
          {!hasPartner && (
            <Button size="sm" variant="outline" className="w-full justify-between mt-auto">
              <span>Pair Code</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>

        {/* Step 3 */}
        <div
          onClick={!hasInteractions ? onOpenInteractions : undefined}
          className={`flex flex-col justify-between rounded-lg p-3 border transition-fast ${
            hasInteractions
              ? 'border-secondary/40 bg-secondary/5'
              : 'border-border/40 bg-surface-container-low hover:bg-surface-container-high cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Heart size={16} className={hasInteractions ? 'text-secondary' : 'text-primary'} />
              <span className="font-extrabold text-sm">3. First Moment</span>
            </div>
            {hasInteractions ? (
              <CheckCircle2 size={18} className="text-secondary shrink-0" />
            ) : (
              <Circle size={18} className="text-on-surface-variant shrink-0" />
            )}
          </div>
          <p className="text-micro-label text-on-surface-variant mb-2">
            {hasInteractions ? 'First reaction sent!' : 'Send ❤️ or emotion'}
          </p>
          {!hasInteractions && (
            <Button size="sm" variant="outline" className="w-full justify-between mt-auto">
              <span>Send ❤️</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
