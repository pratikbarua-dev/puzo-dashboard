export type Role = 'user' | 'admin' | 'super_admin';

export interface ProfileLite {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url?: string | null;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone: string;
  role: Role;
  deleted_at: string | null;
  created_at: string;
}

export interface Entitlements {
  interactions?: boolean;
  expressions?: boolean;
  vibrations?: boolean;
  sounds?: boolean;
  rgb?: boolean;
  messages?: boolean;
  emotions?: boolean;
  animations?: boolean;
  scheduled_emotions?: boolean;
  animation_packs?: boolean;
  premium_sounds?: boolean;
  family?: boolean;
  [key: string]: boolean | undefined;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval?: string;
  active: boolean;
  features?: Record<string, boolean>;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'canceled';
  current_period_end?: string | null;
  plan?: Plan;
}

export interface MeResponse {
  profile: Profile;
  entitlements: Entitlements;
  subscription: Subscription | null;
}

export interface Device {
  device_id: string;
  id: string;
  name: string;
  device_type: string;
  hardware_model: string | null;
  firmware_channel: string;
  firmware_version?: string | null;
  status: 'unknown' | 'online' | 'offline' | 'updating';
  owner_id: string | null;
  last_seen?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export type DeviceSetupStatus = 'pending' | 'claimed' | 'expired' | 'cancelled';

export interface DeviceSetupSession {
  session_id: string;
  setup_id: string;
  code?: string;
  status: DeviceSetupStatus;
  expires_at: string;
  claimed_at?: string | null;
  device?: Device | null;
}

export interface DeviceTelemetry {
  rssi?: number;
  battery_voltage?: number;
  battery_percent?: number;
  temperature?: number;
  heap_free?: number;
  uptime_seconds?: number;
  [key: string]: unknown;
}

export interface DeviceEvent {
  id: string;
  device_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CommandRecord {
  id: string;
  device_id: string;
  command_type: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'sent' | 'failed' | 'completed' | 'cancelled';
  created_at: string;
  sent_at: string | null;
}

export interface OwnershipHistoryEntry {
  id: string;
  device_id: string;
  owner_id: string | null;
  action: string;
  created_at: string;
}

export interface PairingCode {
  id: string;
  initiator_id: string;
  relationship_type: string;
  code?: string;
  status: 'pending' | 'used' | 'revoked' | 'expired';
  expires_at: string;
  used_by?: string | null;
  created_at: string;
}

export interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
  relationship_type: string;
  status: 'pending' | 'active' | 'paused' | 'terminated';
  created_by: string;
  created_at: string;
  updated_at: string;
  devices?: Array<Pick<Device, 'device_id' | 'name' | 'status' | 'owner_id'>>;
}

export interface BlockEntry {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export type InteractionType =
  | 'emotion'
  | 'expression'
  | 'vibration'
  | 'sound'
  | 'rgb'
  | 'message'
  | 'animation'
  | 'animation_pack';

export interface Interaction {
  id: string;
  sender_id: string;
  recipient_id: string;
  relationship_id: string | null;
  type: InteractionType;
  payload: Record<string, unknown>;
  source_device_id: string | null;
  target_device_id: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'acknowledged' | 'completed' | 'failed';
  created_at: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  acknowledged_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  deleted_for_sender_at?: string | null;
  deleted_for_recipient_at?: string | null;
}

export interface Schedule {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  relationship_id: string | null;
  source_device_id: string | null;
  target_device_id: string | null;
  type: InteractionType;
  payload: Record<string, unknown>;
  timezone: string;
  scheduled_for: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  fired_at?: string | null;
  created_at: string;
}

export interface FirmwareRelease {
  id: string;
  version: string;
  build_number?: number | null;
  hardware_model: string;
  channel: 'stable' | 'beta';
  status: 'draft' | 'published' | 'unpublished';
  size_bytes: number;
  sha256: string;
  release_notes?: string | null;
  created_at: string;
  published_at?: string | null;
}

export type OtaJobState =
  | 'pending'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'installing'
  | 'installed'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface OtaJob {
  id: string;
  device_id: string;
  release_id: string;
  state: OtaJobState;
  error?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface OtaStats {
  total_jobs?: number;
  success_rate?: number;
  [key: string]: unknown;
}

export interface AdminUser extends Profile {
  email?: string;
  last_active_at?: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DeviceStatus {
  device: Device;
  presence: { status: string; last_seen?: string | null; telemetry?: DeviceTelemetry };
}

/** The generic backend envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code?: string; message?: string; details?: unknown };
}
