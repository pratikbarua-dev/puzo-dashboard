import type {
  ApiEnvelope,
  AuditLogEntry,
  AdminUser,
  BlockEntry,
  CommandRecord,
  Device,
  DeviceSettings,
  DeviceSettingsPatch,
  DeviceMode,
  DeviceMood,
  DeviceSetupSession,
  DeviceSetupSessionCreated,
  DeviceEvent,
  DeviceStatus,
  FirmwareRelease,
  Interaction,
  MeResponse,
  OtaJob,
  OtaStats,
  OwnershipHistoryEntry,
  PairingCode,
  Plan,
  Profile,
  ProfileLite,
  Relationship,
  Schedule,
  Subscription,
  ContentEmotion,
  ContentAsset,
  EmotionEngineSettings,
  EmotionDecision,
  NotificationRecord,
} from './types';

export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Seconds until a rate limit lifts. Reads `Retry-After` first, then the
 * draft-8 `RateLimit` header (`limit=5, remaining=0, reset=42`) that
 * express-rate-limit emits on the backend.
 */
function retryAfterSeconds(headers: Headers): number | null {
  const retryAfter = Number(headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter;

  const reset = /reset=(\d+)/.exec(headers.get('ratelimit') ?? '')?.[1];
  const resetSeconds = Number(reset);
  if (Number.isFinite(resetSeconds) && resetSeconds > 0) return resetSeconds;

  return null;
}

function rateLimitMessage(seconds: number | null): string {
  if (seconds === null) return 'Too many attempts. Please try again in a few minutes.';
  if (seconds < 60) return `Too many attempts. Please try again in ${Math.ceil(seconds)}s.`;
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (isForm) {
    payload = body as BodyInit;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api/proxy${path}`, {
    method,
    headers,
    body: payload,
  });

  const text = await res.text();
  // Gateways and crashes can answer with HTML, so never let a parse failure
  // surface as a raw SyntaxError.
  let json: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      json = null;
    }
  }

  if (res.status === 429) {
    throw new ApiError(429, 'RATE_LIMITED', rateLimitMessage(retryAfterSeconds(res.headers)));
  }

  if (!res.ok || !json?.success) {
    const err = json?.error;
    throw new ApiError(res.status, err?.code, err?.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

/* ---- identity & profile ---- */

export const me = () => request<MeResponse>('GET', '/me');
export const getProfile = () =>
  request<MeResponse>('GET', '/me').then((d) => d.profile);
export const updateMe = (patch: { display_name?: string; username?: string; timezone?: string; notification_preferences?: Record<string, boolean> }) =>
  request<{ profile: Profile }>('PATCH', '/me', patch).then((d) => d.profile);
export interface ProfileLocationInput {
  location?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
export interface ProfileLocation {
  location: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}
export const getProfileLocation = () =>
  request<ProfileLocation>('GET', '/me/location').then((d) => d);
export const updateProfileLocation = (input: ProfileLocationInput) =>
  request<ProfileLocation>('PUT', '/me/location', input).then((d) => d);
export const deleteMe = () => request<{ deleted: boolean }>('DELETE', '/me');
export const listNotifications = () => request<{ notifications: NotificationRecord[]; unread_count: number }>('GET', '/notifications');
export const markNotificationRead = (id: string) => request<NotificationRecord>('PATCH', `/notifications/${id}/read`);
export const registerPushSubscription = (token: string) => request<unknown>('POST', '/notifications/push-subscriptions', { token, platform: 'web', userAgent: navigator.userAgent });
export const removePushSubscription = (token: string) => request<unknown>('DELETE', '/notifications/push-subscriptions', { token });
export const searchUsers = (q: string) =>
  request<{ users: ProfileLite[] }>('GET', `/users/search?q=${encodeURIComponent(q)}`).then(
    (d) => d.users,
  );

/* ---- devices ---- */

export const myDevices = (): Promise<Device[]> =>
  request<any>('GET', '/devices').then((d) => (Array.isArray(d) ? d : d?.devices ?? []));
export const myDevice = (deviceId: string): Promise<Device> =>
  request<any>('GET', `/devices/${deviceId}`).then((d) => d?.device ?? d);
export const provisionDevice = (input: {
  device_id: string;
  name: string;
  hardware_model?: string;
}) => request<{ device: Device; token: string; note: string }>('POST', '/devices/provision', input);
export const createDeviceSetupSession = (input: {
  setup_id: string;
  name: string;
  hardware_model?: string;
}) => request<DeviceSetupSessionCreated>('POST', '/device-setup/sessions', input);
export const getDeviceSetupSession = (sessionId: string) =>
  request<DeviceSetupSession>('GET', `/device-setup/sessions/${sessionId}`);
export const deviceHistory = (deviceId: string): Promise<OwnershipHistoryEntry[]> =>
  request<any>('GET', `/devices/${deviceId}/history`).then(
    (d) => (Array.isArray(d) ? d : d?.history ?? []),
  );
export const transferDevice = (deviceId: string, newOwnerUsername: string) =>
  request<{ device: Device }>('POST', `/devices/${deviceId}/transfer`, {
    new_owner_username: newOwnerUsername,
  });
export const updateMyDevice = (deviceId: string, input: { name?: string; firmware_channel?: string }) =>
  request<{ device: Device }>('PATCH', `/devices/${deviceId}`, input).then((d) => d.device);
export const getDeviceSettings = (deviceId: string): Promise<DeviceSettings | null> =>
  request<any>('GET', `/devices/${deviceId}/settings`).then(
    (d) => d?.settings ?? d ?? null,
  );
export const updateDeviceSettings = (deviceId: string, patch: DeviceSettingsPatch) =>
  request<{ settings: DeviceSettings }>('PUT', `/devices/${deviceId}/settings`, patch).then(
    (d) => d.settings,
  );
export const getDeviceMode = (deviceId: string): Promise<DeviceMode> =>
  request<any>('GET', `/devices/${deviceId}/mode`).then((d) => d?.mode ?? (typeof d === 'string' ? d : 'normal'));
export const setDeviceMode = (deviceId: string, mode: DeviceMode) =>
  request<{ mode: DeviceMode; command: CommandRecord }>('PUT', `/devices/${deviceId}/mode`, { mode });
export const getDeviceMood = (deviceId: string): Promise<DeviceMood> =>
  request<any>('GET', `/devices/${deviceId}/mood`).then((d) => d?.mood ?? (typeof d === 'string' ? d : 'happy'));
export const setDeviceMood = (deviceId: string, mood: DeviceMood) =>
  request<{ mood: DeviceMood; command: CommandRecord }>('PUT', `/devices/${deviceId}/mood`, { mood });
export const sendDeviceMood = (deviceId: string, emotion: string) =>
  request<{ emotion: string; command: CommandRecord }>('POST', `/devices/${deviceId}/mood`, { emotion });
export const getEmotionEngineSettings = (deviceId: string): Promise<EmotionEngineSettings> =>
  request<any>('GET', `/devices/${deviceId}/emotion-engine`).then((d) => (d?.settings ? d.settings : d ?? {
    emotion_engine_enabled: true,
    emotion_intensity: 'normal',
    weather_reactions_enabled: true,
    weather_messages_enabled: true,
    partner_context_enabled: true,
    emotion_quiet_hours_start: null,
    emotion_quiet_hours_end: null,
    emotion_minimum_interval_seconds: 300,
  }));
export const updateEmotionEngineSettings = (deviceId: string, patch: Partial<EmotionEngineSettings>) =>
  request<{ settings: EmotionEngineSettings }>('PATCH', `/devices/${deviceId}/emotion-engine`, patch).then((d) => d.settings);
export const getEmotionDecisions = (deviceId: string): Promise<EmotionDecision[]> =>
  request<any>('GET', `/devices/${deviceId}/emotion-decisions?limit=8`).then((d) => (Array.isArray(d) ? d : d?.decisions ?? []));
export const removeMyDevice = (deviceId: string) =>
  request<{ device: Device }>('DELETE', `/devices/${deviceId}`);

/* ---- pairing ---- */

export const createPairingCode = (relationshipType: string) =>
  request<{ code: string; expires_at: string }>('POST', '/pairing/create', {
    relationship_type: relationshipType,
  });
export const joinPairingCode = (code: string) =>
  request<{ relationship: Relationship }>('POST', '/pairing/join', { code });
export const myPairingCodes = (): Promise<PairingCode[]> =>
  request<any>('GET', '/pairing').then((d) => (Array.isArray(d) ? d : d?.codes ?? []));
export const revokePairingCode = (codeId: string) =>
  request<{ revoked: string }>('DELETE', `/pairing/${codeId}`);

/* ---- relationships ---- */

export const myRelationships = (): Promise<Relationship[]> =>
  request<any>('GET', '/relationships').then((d) => (Array.isArray(d) ? d : d?.relationships ?? []));
export const relationship = (id: string): Promise<Relationship> =>
  request<{ relationship: Relationship }>('GET', `/relationships/${id}`).then(
    (d) => d.relationship,
  );
export const relationshipAction = (
  id: string,
  action: 'pause' | 'resume' | 'block' | 'unblock',
) =>
  request<{ relationship: Relationship }>('POST', `/relationships/${id}/${action}`, {}).then(
    (d) => d.relationship,
  );
export const unpair = (id: string, reason?: string) =>
  request<{ relationship: Relationship }>('DELETE', `/relationships/${id}`, { reason });
export const myBlocks = (): Promise<BlockEntry[]> =>
  request<any>('GET', '/relationships/blocks').then((d) => (Array.isArray(d) ? d : d?.blocks ?? []));

/* ---- interactions ---- */

export const sendInteraction = (input: {
  type: string;
  payload: Record<string, unknown>;
  target_device_id: string;
  source_device_id?: string;
  relationship_id?: string;
}) =>
  request<{ interaction: Interaction }>('POST', '/interactions', input).then(
    (d) => d.interaction,
  );
export const myInteractions = (): Promise<Interaction[]> =>
  request<any>('GET', '/interactions').then((d) => (Array.isArray(d) ? d : d?.interactions ?? []));
export const deleteInteraction = (id: string) =>
  request<{ deleted: boolean }>('DELETE', `/interactions/${id}`);

/* ---- subscriptions & plans ---- */

export const plans = () => request<{ plans: Plan[] }>('GET', '/plans');
export const subscribe = (planId: string) =>
  request<{ subscription: Subscription }>('POST', '/subscription', { plan_id: planId });
export const cancelSubscription = () =>
  request<{ subscription: Subscription }>('POST', '/subscription/cancel', {});

/* ---- schedules ---- */

export const mySchedules = (): Promise<Schedule[]> =>
  request<any>('GET', '/schedules').then((d) => (Array.isArray(d) ? d : d?.schedules ?? []));
export const createSchedule = (input: {
  type: string;
  payload: Record<string, unknown>;
  target_device_id: string;
  source_device_id?: string;
  relationship_id?: string;
  scheduled_for: string;
  timezone?: string;
}) => request<{ schedule: Schedule }>('POST', '/schedules', input);
export const cancelSchedule = (id: string) =>
  request<{ schedule: Schedule }>('DELETE', `/schedules/${id}`);

/* ---- admin ---- */

export const adminDevices = () =>
  request<{ devices: Device[] }>('GET', '/admin/devices').then((d) => d.devices);
export const adminDevice = (deviceId: string) =>
  request<{ device: Device }>('GET', `/admin/devices/${deviceId}`).then((d) => d.device);
export const adminDeviceStatus = (deviceId: string) =>
  request<{ device: Device; state: Record<string, unknown> | null }>(
    'GET',
    `/admin/devices/${deviceId}/status`,
  ).then((d) => ({
    device: d.device,
    presence: {
      status: d.state?.online ? 'online' : 'offline',
      last_seen: (d.state?.updated_at as string) ?? null,
      telemetry: {
        heap_free: d.state?.heap_free,
        uptime: d.state?.uptime,
        temperature: d.state?.temperature,
        battery_voltage: d.device?.battery_voltage,
        battery_percentage: d.device?.battery_percentage,
      },
    },
  }));
export const adminDeviceEvents = (deviceId: string) =>
  request<{ events: DeviceEvent[] }>('GET', `/admin/devices/${deviceId}/events`).then(
    (d) => d.events,
  );
export const adminDeviceCommands = (deviceId: string) =>
  request<{ commands: CommandRecord[] }>('GET', `/admin/devices/${deviceId}/commands`).then(
    (d) => d.commands,
  );
export const adminSendCommand = (deviceId: string, command: string, payload: unknown) =>
  request<{ command: CommandRecord }>('POST', `/admin/devices/${deviceId}/commands`, {
    command,
    payload,
  });
export const sendDeviceCommand = (deviceId: string, command: string, payload: unknown) =>
  request<{ command: CommandRecord }>('POST', `/owned-devices/${deviceId}/commands`, {
    command,
    payload,
  });
export const adminGetDeviceMode = (deviceId: string) =>
  request<{ mode: DeviceMode }>('GET', `/admin/devices/${deviceId}/mode`).then((d) => d.mode);
export const adminSetDeviceMode = (deviceId: string, mode: DeviceMode) =>
  request<{ mode: DeviceMode; command: CommandRecord }>('PUT', `/admin/devices/${deviceId}/mode`, { mode });
export const adminGetDeviceMood = (deviceId: string) =>
  request<{ mood: DeviceMood }>('GET', `/admin/devices/${deviceId}/mood`).then((d) => d.mood);
export const adminSetDeviceMood = (deviceId: string, mood: DeviceMood) =>
  request<{ mood: DeviceMood; command: CommandRecord }>('PUT', `/admin/devices/${deviceId}/mood`, { mood });
export const adminSendDeviceMood = (deviceId: string, emotion: string) =>
  request<{ emotion: string; command: CommandRecord }>('POST', `/admin/devices/${deviceId}/mood`, { emotion });
export const adminProvision = (deviceId: string) =>
  request<{ device: Device; token: string; note: string }>(
    'POST',
    `/admin/devices/${deviceId}/provision`,
  );
export const adminRegisterDevice = (input: {
  name: string;
  device_type?: string;
  hardware_model?: string;
  firmware_channel?: string;
}) => request<{ device: Device; token: string; note: string }>('POST', '/admin/devices', input);
export const adminRemoveDevice = (deviceId: string) =>
  request<{ deleted: string }>('DELETE', `/admin/devices/${deviceId}`);

export const adminUsers = () =>
  request<{ users: AdminUser[] }>('GET', '/admin/users').then((d) => d.users);
export const adminUser = (id: string) =>
  request<{ user: AdminUser }>('GET', `/admin/users/${id}`).then((d) => d.user);
export const adminSetRole = (id: string, role: string) =>
  request<{ user: AdminUser }>('PATCH', `/admin/users/${id}/role`, { role });

export const adminSubscriptions = () =>
  request<{ subscriptions: Subscription[] }>('GET', '/admin/subscriptions').then(
    (d) => d.subscriptions,
  );

export const adminAuditLogs = () =>
  request<{ logs: AuditLogEntry[] }>('GET', '/admin/audit-logs').then((d) => d.logs);

export const firmwareReleases = () =>
  request<{ releases: FirmwareRelease[] }>('GET', '/admin/firmware/releases').then(
    (d) => d.releases,
  );
export const firmwareRelease = (id: string) =>
  request<{ release: FirmwareRelease }>('GET', `/admin/firmware/releases/${id}`).then(
    (d) => d.release,
  );
export const firmwarePublish = (id: string, publish: boolean) =>
  request<{ release: FirmwareRelease }>(
    'POST',
    `/admin/firmware/releases/${id}/${publish ? 'publish' : 'unpublish'}`,
  ).then((d) => d.release);
export const firmwareUpload = (form: FormData) =>
  request<{ release: FirmwareRelease }>('POST', '/admin/firmware/releases', form, true).then(
    (d) => d.release,
  );

export const otaJobs = () =>
  request<{ jobs: OtaJob[] }>('GET', '/admin/ota/jobs').then((d) => d.jobs);
export const otaStats = () => request<OtaStats>('GET', '/admin/ota/stats');

export const adminListEmotions = () =>
  request<{ emotions: ContentEmotion[] }>('GET', '/emotions').then((d) => d.emotions);
export const adminUpsertEmotion = (input: ContentEmotion) =>
  request<{ emotion: ContentEmotion }>('POST', '/emotions', input).then((d) => d.emotion);

export const adminListAssets = () =>
  request<{ assets: ContentAsset[] }>('GET', '/content/assets').then((d) => d.assets);
export const adminCreateAsset = (input: Partial<ContentAsset>) =>
  request<{ asset: ContentAsset }>('POST', '/content/assets', input).then((d) => d.asset);
export const adminSetAssetStatus = (id: string, status: string) =>
  request<{ asset: ContentAsset }>('POST', `/content/assets/${id}/status`, { status }).then(
    (d) => d.asset,
  );
