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
  const json = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;

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
export const updateMe = (patch: { display_name?: string; username?: string; timezone?: string }) =>
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
export const searchUsers = (q: string) =>
  request<{ users: ProfileLite[] }>('GET', `/users/search?q=${encodeURIComponent(q)}`).then(
    (d) => d.users,
  );

/* ---- devices ---- */

export const myDevices = () =>
  request<{ devices: Device[] }>('GET', '/devices').then((d) => d.devices);
export const myDevice = (deviceId: string) =>
  request<{ device: Device }>('GET', `/devices/${deviceId}`).then((d) => d.device);
export const provisionDevice = (input: {
  device_id: string;
  name: string;
  hardware_model?: string;
}) => request<{ device: Device; token: string; note: string }>('POST', '/devices/provision', input);
export const createDeviceSetupSession = (input: {
  setup_id: string;
  name: string;
  hardware_model?: string;
}) => request<DeviceSetupSession & { code: string }>('POST', '/device-setup/sessions', input);
export const getDeviceSetupSession = (sessionId: string) =>
  request<DeviceSetupSession>('GET', `/device-setup/sessions/${sessionId}`);
export const deviceHistory = (deviceId: string) =>
  request<{ history: OwnershipHistoryEntry[] }>('GET', `/devices/${deviceId}/history`).then(
    (d) => d.history,
  );
export const transferDevice = (deviceId: string, newOwnerUsername: string) =>
  request<{ device: Device }>('POST', `/devices/${deviceId}/transfer`, {
    new_owner_username: newOwnerUsername,
  });
export const updateMyDevice = (deviceId: string, input: { name?: string; firmware_channel?: string }) =>
  request<{ device: Device }>('PATCH', `/devices/${deviceId}`, input).then((d) => d.device);
export const getDeviceSettings = (deviceId: string) =>
  request<{ settings: DeviceSettings }>('GET', `/devices/${deviceId}/settings`).then(
    (d) => d.settings,
  );
export const updateDeviceSettings = (deviceId: string, patch: DeviceSettingsPatch) =>
  request<{ settings: DeviceSettings }>('PUT', `/devices/${deviceId}/settings`, patch).then(
    (d) => d.settings,
  );
export const getDeviceMode = (deviceId: string) =>
  request<{ mode: DeviceMode }>('GET', `/devices/${deviceId}/mode`).then((d) => d.mode);
export const setDeviceMode = (deviceId: string, mode: DeviceMode) =>
  request<{ mode: DeviceMode; command: CommandRecord }>('PUT', `/devices/${deviceId}/mode`, { mode });
export const getDeviceMood = (deviceId: string) =>
  request<{ mood: DeviceMood }>('GET', `/devices/${deviceId}/mood`).then((d) => d.mood);
export const setDeviceMood = (deviceId: string, mood: DeviceMood) =>
  request<{ mood: DeviceMood; command: CommandRecord }>('PUT', `/devices/${deviceId}/mood`, { mood });
export const sendDeviceMood = (deviceId: string, emotion: string) =>
  request<{ emotion: string; command: CommandRecord }>('POST', `/devices/${deviceId}/mood`, { emotion });
export const getEmotionEngineSettings = (deviceId: string) =>
  request<{ settings: EmotionEngineSettings }>('GET', `/devices/${deviceId}/emotion-engine`).then((d) => d.settings);
export const updateEmotionEngineSettings = (deviceId: string, patch: Partial<EmotionEngineSettings>) =>
  request<{ settings: EmotionEngineSettings }>('PATCH', `/devices/${deviceId}/emotion-engine`, patch).then((d) => d.settings);
export const getEmotionDecisions = (deviceId: string) =>
  request<{ decisions: EmotionDecision[] }>('GET', `/devices/${deviceId}/emotion-decisions?limit=8`).then((d) => d.decisions);
export const removeMyDevice = (deviceId: string) =>
  request<{ device: Device }>('DELETE', `/devices/${deviceId}`);

/* ---- pairing ---- */

export const createPairingCode = (relationshipType: string) =>
  request<{ code: string; expires_at: string }>('POST', '/pairing/create', {
    relationship_type: relationshipType,
  });
export const joinPairingCode = (code: string) =>
  request<{ relationship: Relationship }>('POST', '/pairing/join', { code });
export const myPairingCodes = () =>
  request<{ codes: PairingCode[] }>('GET', '/pairing').then((d) => d.codes);
export const revokePairingCode = (codeId: string) =>
  request<{ revoked: string }>('DELETE', `/pairing/${codeId}`);

/* ---- relationships ---- */

export const myRelationships = () =>
  request<{ relationships: Relationship[] }>('GET', '/relationships').then((d) => d.relationships);
export const relationship = (id: string) =>
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
export const myBlocks = () =>
  request<{ blocks: BlockEntry[] }>('GET', '/relationships/blocks').then((d) => d.blocks);

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
export const myInteractions = () =>
  request<{ interactions: Interaction[] }>('GET', '/interactions').then((d) => d.interactions);
export const deleteInteraction = (id: string) =>
  request<{ deleted: boolean }>('DELETE', `/interactions/${id}`);

/* ---- subscriptions & plans ---- */

export const plans = () => request<{ plans: Plan[] }>('GET', '/plans');
export const subscribe = (planId: string) =>
  request<{ subscription: Subscription }>('POST', '/subscription', { plan_id: planId });
export const cancelSubscription = () =>
  request<{ subscription: Subscription }>('POST', '/subscription/cancel', {});

/* ---- schedules ---- */

export const mySchedules = () =>
  request<{ schedules: Schedule[] }>('GET', '/schedules').then((d) => d.schedules);
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
