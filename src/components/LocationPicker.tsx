'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Locate, MapPin, X } from 'lucide-react';
import { getProfileLocation, updateProfileLocation } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button, Input } from '@/components/ui';
import { toast } from '@/components/Toast';
import { extractError } from '@/lib/utils';

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

/**
 * Edits the signed-in profile's weather location (`PUT /api/me/location`).
 * Coordinates come from Open-Meteo geocoding or the browser's geolocation API;
 * the backend uses them to drive the companion's weather reactions.
 */
export function LocationPicker() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: locData } = useQuery({
    queryKey: ['me', 'location'],
    queryFn: getProfileLocation,
    enabled: !profile,
  });

  const source = profile ?? locData ?? null;
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (!source) return;
    setCity(source.city ?? source.location ?? '');
    setLat(source.latitude ?? null);
    setLng(source.longitude ?? null);
  }, [source]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            q,
          )}&count=5&language=en&format=json`,
        );
        if (res.ok) {
          const data = (await res.json()) as { results?: GeoResult[] };
          setResults(data.results ?? []);
          setOpen(true);
        }
      } catch {
        // network hiccup — leave the previous suggestions in place
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const saveMut = useMutation({
    mutationFn: (input: { city: string; latitude: number | null; longitude: number | null }) =>
      updateProfileLocation({
        location: input.city || null,
        city: input.city || null,
        latitude: input.latitude,
        longitude: input.longitude,
      }),
    onSuccess: (saved) => {
      setCity(saved.city ?? saved.location ?? '');
      setLat(saved.latitude);
      setLng(saved.longitude);
      toast.success(saved.city ? `Weather location set to ${saved.city}` : 'Location cleared');
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const detect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = Math.round(pos.coords.latitude * 10000) / 10000;
        const ln = Math.round(pos.coords.longitude * 10000) / 10000;
        let name = `Location (${la}, ${ln})`;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${la}&longitude=${ln}&localityLanguage=en`,
          );
          if (res.ok) {
            const data = (await res.json()) as {
              city?: string;
              locality?: string;
              countryName?: string;
            };
            const cityName = data.city || data.locality || '';
            if (cityName) name = data.countryName ? `${cityName}, ${data.countryName}` : cityName;
          }
        } catch {
          // keep the coordinate-based label
        }
        setLocating(false);
        saveMut.mutate({ city: name, latitude: la, longitude: ln });
      },
      (err) => {
        setLocating(false);
        toast.error(`Geolocation failed: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="text-xs leading-relaxed text-[#64748B]">
        Your PUZO uses this to react to local weather — rain, heat, and clearing skies.
      </p>

      {city ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin size={16} className="shrink-0 text-[#FF5A5F]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1E232B]">{city}</p>
              {lat != null && lng != null && (
                <p className="font-mono text-[10px] text-[#94A3B8]">
                  {lat.toFixed(2)}°, {lng.toFixed(2)}°
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            title="Clear location"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate({ city: '', latitude: null, longitude: null })}
            className="shrink-0 text-[#94A3B8] hover:text-[#B92B34] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#CBD5E1] px-3.5 py-3 text-xs text-[#94A3B8]">
          No location set yet.
        </p>
      )}

      <div className="relative" ref={boxRef}>
        <Input
          label={city ? 'Change city' : 'Search city'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Dhaka, London, New York…"
        />
        {searching && (
          <span className="absolute right-3 top-[38px] h-4 w-4 animate-spin rounded-full border-2 border-[#FF5A5F] border-t-transparent" />
        )}

        {open && results.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white py-1 shadow-lg">
            {results.map((item) => {
              const region = [item.admin1, item.country].filter(Boolean).join(', ');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const full = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
                    setQuery('');
                    setOpen(false);
                    saveMut.mutate({
                      city: full,
                      latitude: item.latitude,
                      longitude: item.longitude,
                    });
                  }}
                  className="flex w-full flex-col px-3.5 py-2 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold text-[#1E232B]">{item.name}</span>
                  {region && <span className="text-[11px] text-[#94A3B8]">{region}</span>}
                </button>
              );
            })}
          </div>
        )}

        {open && !searching && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-2xl border border-[#E2E8F0] bg-white p-3 text-center text-xs text-[#94A3B8] shadow-lg">
            No matching cities found
          </div>
        )}
      </div>

      <Button variant="secondary" onClick={detect} disabled={locating || saveMut.isPending} className="w-full">
        <Locate size={15} className={locating ? 'animate-spin' : ''} />
        <span>{locating ? 'Detecting…' : 'Use my current location'}</span>
      </Button>
    </div>
  );
}
