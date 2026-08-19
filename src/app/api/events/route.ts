import { createClient as createServiceClient } from '@supabase/supabase-js';

const TABLE_CHANNELS = [
  'devices',
  'device_events',
  'ota_jobs',
  'firmware_releases',
  'interactions',
  'schedules',
  'notifications',
];

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  // Assigned in start(), invoked from cancel() when the client goes away.
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* stream closed */
        }
      };

      send('connected', { channels: TABLE_CHANNELS });

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !serviceKey) {
        send('unavailable', {
          message: 'Supabase Realtime is not configured. Using fallback refresh.',
        });
        // Close instead of holding an idle stream open until a proxy times it
        // out; the client backs off and retries on its own schedule.
        controller.close();
        return;
      }

      const supabase = createServiceClient(url, serviceKey);
      const channel = supabase.channel('dashboard-feed');

      for (const table of TABLE_CHANNELS) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => send('change', payload),
        );
      }

      channel.subscribe((status) => {
        send('channel_status', { status });
      });

      const heartbeat = setInterval(() => send('ping', { t: Date.now() }), 25000);

      cleanup = () => {
        clearInterval(heartbeat);
        void supabase.removeChannel(channel);
      };
    },
    cancel() {
      // Without this the heartbeat interval and the Supabase channel outlive
      // every disconnected client.
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
