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
  location?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notification_preferences?: Record<string, boolean> | null;
  role: Role;
  deleted_at: string | null;
  created_at: string;
}

export interface Entitlements {
  interactions?: boolean;
  expressions?: boolean;
  vibrations?: boolean;
  sounds?: boolean;
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

export interface NotificationRecord {
  id: string;
  profile_id: string;
  kind: 'partner_message' | 'puzo_pet' | 'system';
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface Device {
  device_id: string;
  id: string;
  name: string;
  device_type: string;
  hardware_model: string | null;
  firmware_channel: string;
  firmware_version?: string | null;
  firmware_build?: number | null;
  battery_voltage?: number | null;
  battery_percentage?: number | null;
  wifi_rssi?: number | null;
  last_ip?: string | null;
  status: 'unknown' | 'online' | 'offline' | 'updating';
  owner_id: string | null;
  last_seen?: string | null;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export type DeviceSetupStatus = 'pending' | 'claimed' | 'expired' | 'cancelled';

/**
 * Firmware-configurable device settings. Key names are the NVS `set_config`
 * keys the ESP32 firmware reads (see firmware/src/services/config_service.cpp).
 */
export interface DeviceSettings {
  sleep_timeout_min: number;
  focus_duration_min: number;
  timezone_offset_min: number;
  wake_sound_enabled: boolean;
  wake_vibration_enabled: boolean;
  quiet_mode_enabled: boolean;
  weather_cache?: string;
  eye_pack: 'classic' | 'iris_oled';
  /** 0–100. Scales playback amplitude in software; the amplifier's gain is fixed in hardware. */
  volume: number;
  haptic_intensity: HapticIntensity;
}

/**
 * Named vibration patterns and intensity tiers the firmware implements. The
 * device resolves each with an exact match against a compiled table, so these
 * strings are a contract, not labels — see the backend command registry.
 */
export type HapticPattern =
  | 'short'
  | 'double'
  | 'triple'
  | 'long'
  | 'heartbeat'
  | 'love'
  | 'notification';
export type HapticIntensity = 'low' | 'medium' | 'high';

export type DeviceMode = 'normal' | 'focus' | 'clock' | 'weather';
export type DeviceMood = 'curious' | 'calm' | 'playful' | 'sleepy' | 'happy' | 'love' | 'sad' | 'excited' | 'angry';

export type DeviceSettingsPatch = Partial<DeviceSettings>;

export type EmotionIntensity = 'low' | 'normal' | 'expressive';
export interface EmotionEngineSettings {
  emotion_engine_enabled: boolean;
  emotion_intensity: EmotionIntensity;
  weather_reactions_enabled: boolean;
  weather_messages_enabled: boolean;
  partner_context_enabled: boolean;
  emotion_quiet_hours_start: string | null;
  emotion_quiet_hours_end: string | null;
  emotion_minimum_interval_seconds: number;
}

export interface EmotionDecision {
  id: string;
  device_id: string;
  trigger_type: string;
  emotion: string;
  message: string | null;
  priority: string;
  reason_codes: string[];
  status: string;
  suppression_reason?: string | null;
  created_at: string;
  delivered_at?: string | null;
}

export interface DeviceSetupSession {
  session_id: string;
  setup_id: string;
  code?: string;
  status: DeviceSetupStatus;
  expires_at: string;
  claimed_at?: string | null;
  device?: Device | null;
}

/** Response of `POST /api/device-setup/sessions` — no status yet, code shown once. */
export interface DeviceSetupSessionCreated {
  session_id: string;
  setup_id: string;
  code: string;
  expires_at: string;
}

export interface DeviceTelemetry {
  rssi?: number;
  battery_voltage?: number;
  battery_percentage?: number;
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

export interface RelationshipMember {
  profile_id: string;
  role: string;
  joined_at: string | null;
  left_at: string | null;
  profile: (ProfileLite & { timezone?: string }) | null;
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
  members?: RelationshipMember[];
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
  devices?: {
    total: number;
    online: number;
    offline: number;
    updating: number;
    update_failed: number;
    unknown: number;
    firmware_versions_in_use: { firmware_version: string; count: number }[];
  };
  firmware?: {
    latest_stable: FirmwareRelease[];
  };
  ota?: {
    total_jobs: number;
    success: number;
    failed: number;
    success_rate: number;
    failure_rate: number;
  };
  total_jobs?: number;
  success_rate?: number;
  [key: string]: unknown;
}

export interface AdminUser extends Profile {
  email?: string;
  last_active_at?: string | null;
}

export interface ContentEmotion {
  id?: string;
  name: string;
  expression: string;
  haptic?: string | null;
  sound?: string | null;
  duration_ms?: number | null;
  priority?: 'idle_personality' | 'scheduled' | 'local_user' | 'partner' | 'system' | 'critical_safety';
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface ContentAsset {
  id: string;
  kind: 'animation' | 'expression' | 'sound' | 'theme' | 'animation_pack' | 'sound_pack';
  name: string;
  version: string;
  status: 'draft' | 'published' | 'unpublished';
  storage_path?: string;
  file_size?: number;
  sha256?: string;
  url?: string;
  created_at: string;
}

/* ---------- audio packs ---------- */

/**
 * A downloadable set of sounds. Deliberately free of storage paths, checksums
 * and on-device filesystem detail: the user is buying a sound pack, not managing
 * a flash volume.
 */
export interface AudioPack {
  slug: string;
  name: string;
  description: string | null;
  version: string;
  thumbnail_url: string | null;
  total_bytes: number;
  is_premium: boolean;
  /** Premium pack the current plan does not include. Listed, but not installable. */
  locked: boolean;
}

export interface AudioPackSound {
  sound_id: string;
  ordinal: number;
  bytes: number;
  /** Null when the pack is locked — preview is part of what a plan buys. */
  preview_url: string | null;
}

export interface AudioPackDetail extends AudioPack {
  sounds: AudioPackSound[];
}

/** `not_installed` is synthesised by the backend when no row exists yet. */
export type AudioPackState = 'not_installed' | 'pending' | 'downloading' | 'installed' | 'failed';

/** A catalogue pack joined with what one device last reported having on flash. */
export interface DeviceAudioPack extends AudioPack {
  state: AudioPackState;
  installed_version: string | null;
  installed_bytes: number;
  update_available: boolean;
  active: boolean;
  last_error: string | null;
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
