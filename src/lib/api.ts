import type {
  ApiEnvelope,
  AuditLogEntry,
  AdminUser,
  BlockEntry,
  CommandRecord,
  Device,
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
  ProfileLite,
  Relationship,
  Schedule,
  Subscription,
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
export const updateMe = (patch: { display_name?: string; username?: string; timezone?: string }) =>
  request<MeResponse>('PATCH', '/me', patch);
export const deleteMe = () => request<{ deleted: boolean }>('DELETE', '/me');
export const searchUsers = (q: string) =>
  request<ProfileLite[]>('GET', `/users/search?q=${encodeURIComponent(q)}`);

/* ---- devices ---- */

export const myDevices = () => request<Device[]>('GET', '/devices');
export const myDevice = (deviceId: string) => request<Device>('GET', `/devices/${deviceId}`);
export const provisionDevice = (input: {
  device_id: string;
  name: string;
  hardware_model?: string;
}) => request<{ device: Device; token: string; note: string }>('POST', '/devices/provision', input);
export const deviceHistory = (deviceId: string) =>
  request<OwnershipHistoryEntry[]>('GET', `/devices/${deviceId}/history`);
export const transferDevice = (deviceId: string, newOwnerUsername: string) =>
  request<{ device: Device }>('POST', `/devices/${deviceId}/transfer`, {
    new_owner_username: newOwnerUsername,
  });
export const removeMyDevice = (deviceId: string) =>
  request<{ removed: boolean }>('DELETE', `/devices/${deviceId}`);

/* ---- pairing ---- */

export const createPairingCode = (relationshipType: string) =>
  request<{ code: string; expires_at: string }>('POST', '/pairing/create', {
    relationship_type: relationshipType,
  });
export const joinPairingCode = (code: string) =>
  request<{ relationship: Relationship }>('POST', '/pairing/join', { code });
export const myPairingCodes = () => request<PairingCode[]>('GET', '/pairing');
export const revokePairingCode = (codeId: string) =>
  request<{ revoked: boolean }>('DELETE', `/pairing/${codeId}`);

/* ---- relationships ---- */

export const myRelationships = () => request<Relationship[]>('GET', '/relationships');
export const relationship = (id: string) => request<Relationship>('GET', `/relationships/${id}`);
export const relationshipAction = (
  id: string,
  action: 'pause' | 'resume' | 'block' | 'unblock',
) => request<Relationship>('POST', `/relationships/${id}/${action}`, {});
export const unpair = (id: string, reason?: string) =>
  request<{ unpair: boolean }>('DELETE', `/relationships/${id}`, { reason });
export const myBlocks = () => request<BlockEntry[]>('GET', '/relationships/blocks');

/* ---- interactions ---- */

export const sendInteraction = (input: {
  type: string;
  payload: Record<string, unknown>;
  target_device_id: string;
  source_device_id?: string;
  relationship_id?: string;
}) => request<Interaction>('POST', '/interactions', input);
export const myInteractions = () => request<Interaction[]>('GET', '/interactions');
export const deleteInteraction = (id: string) =>
  request<{ deleted: boolean }>('DELETE', `/interactions/${id}`);

/* ---- subscriptions & plans ---- */

export const plans = () => request<{ plans: Plan[] }>('GET', '/plans');
export const subscribe = (planId: string) =>
  request<{ subscription: Subscription }>('POST', '/subscription', { plan_id: planId });
export const cancelSubscription = () =>
  request<{ subscription: Subscription }>('POST', '/subscription/cancel', {});

/* ---- schedules ---- */

export const mySchedules = () => request<Schedule[]>('GET', '/schedules');
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

export const adminDevices = () => request<Device[]>('GET', '/admin/devices');
export const adminDevice = (deviceId: string) => request<Device>('GET', `/admin/devices/${deviceId}`);
export const adminDeviceStatus = (deviceId: string) =>
  request<DeviceStatus>('GET', `/admin/devices/${deviceId}/status`);
export const adminDeviceEvents = (deviceId: string) =>
  request<DeviceEvent[]>('GET', `/admin/devices/${deviceId}/events`);
export const adminDeviceCommands = (deviceId: string) =>
  request<CommandRecord[]>('GET', `/admin/devices/${deviceId}/commands`);
export const adminSendCommand = (deviceId: string, command: string, payload: unknown) =>
  request<{ command: CommandRecord }>('POST', `/admin/devices/${deviceId}/commands`, {
    command,
    payload,
  });
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
  request<{ removed: boolean }>('DELETE', `/admin/devices/${deviceId}`);

export const adminUsers = () => request<AdminUser[]>('GET', '/admin/users');
export const adminUser = (id: string) => request<AdminUser>('GET', `/admin/users/${id}`);
export const adminSetRole = (id: string, role: string) =>
  request<{ user: AdminUser }>('PATCH', `/admin/users/${id}/role`, { role });

export const adminSubscriptions = () =>
  request<Subscription[]>('GET', '/admin/subscriptions');

export const adminAuditLogs = () => request<AuditLogEntry[]>('GET', '/admin/audit-logs');

export const firmwareReleases = () => request<FirmwareRelease[]>('GET', '/admin/firmware/releases');
export const firmwareRelease = (id: string) =>
  request<FirmwareRelease>('GET', `/admin/firmware/releases/${id}`);
export const firmwarePublish = (id: string, publish: boolean) =>
  request<FirmwareRelease>(
    'POST',
    `/admin/firmware/releases/${id}/${publish ? 'publish' : 'unpublish'}`,
  );
export const firmwareUpload = (form: FormData) =>
  request<FirmwareRelease>('POST', '/admin/firmware/releases', form, true);

export const otaJobs = () => request<OtaJob[]>('GET', '/admin/ota/jobs');
export const otaStats = () => request<OtaStats>('GET', '/admin/ota/stats');
