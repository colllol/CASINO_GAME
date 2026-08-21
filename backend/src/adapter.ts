import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type WalletContainer = 'cashCarried' | 'cashBanked' | 'chips';
export type Role = 'NONE' | 'DEALER' | 'FLOOR_MANAGER' | 'OWNER' | 'SUCCESSOR';
export type LootClassification = 'LOOTABLE' | 'PROTECTED';

export interface ItemInstance {
  instanceId: string;
  catalogueId: string;
  bound: boolean;
  grantReason: string;
  grantedAtUtc: string;
  classification?: LootClassification;
  starter?: boolean;
  questCritical?: boolean;
  activeJob?: boolean;
  equipped?: boolean;
}

export interface ProfileRecord {
  playerId: string;
  displayName: string;
  createdAtUtc: string;
  lastSeenUtc: string;
  cashCarried: number;
  cashBanked: number;
  chips: number;
  standing: number;
  heat: number;
  heatLastDecayUtc: string;
  outstandingDebt: number;
  inventory: ItemInstance[];
  loadout: Record<string, string | null>;
  role: Role;
  shiftState: string;
  questStage: 'Q0' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5';
  completedQuestStages: string[];
  noteFragmentsHeld: string[];
  jobInstanceId: string | null;
  jobProgress: Record<string, unknown> | null;
  robberyCooldownUntilUtc: string | null;
  victimImmunityUntilUtc: string | null;
  [key: string]: unknown;
}

export interface EconomyParameters {
  version: number;
  clientEditable?: boolean;
  robberyCarriedCashShareBps: number;
  robberyCarriedCashCap: number | null;
  robberyLootSelection: boolean;
  robberyCooldownSeconds: number;
  victimRecoveryImmunitySeconds: number;
  jackpotOutcomeSpace: string[];
  jackpotPaytable: Record<string, number | 'pool'>;
  jackpotHitOdds: Record<string, number>;
  jackpotContributionBps: number;
  jackpotSeed: number;
  /** Per-zone seeds from the jackpot defaults; jackpotSeed remains the active pool seed. */
  jackpotSeedByZone: Record<string, number>;
  jackpotStakeByZoneAndTier: Record<string, number>;
  offlineHeatDecayPerHour?: number;
}

export interface ServerRecord {
  houseMarginAccrued: number;
  jackpotPoolAccrued: number;
  ownerSeatHolder: string | null;
  floorManagerSeatHolder: string | null;
  successorQueue: string[];
  casinoUpkeepDueUtc: string | null;
  schemaVersion: number;
  economyParameters: EconomyParameters;
  [key: string]: unknown;
}

export interface WalletMutation {
  playerId: string;
  container: WalletContainer;
  delta: number;
  reason: string;
  eventType?: 'WALLET_CREDIT' | 'WALLET_DEBIT';
  actorPlayerId?: string;
  subjectPlayerId?: string;
  cause?: string;
  payload?: Record<string, unknown>;
}

export interface ServerPoolMutation {
  pool: 'houseMarginAccrued' | 'jackpotPoolAccrued';
  delta: number;
  reason: string;
  eventType?: 'POOL_CREDIT' | 'POOL_DEBIT' | 'JACKPOT_CONTRIBUTION' | 'JACKPOT_HIT' | 'JACKPOT_POOL_RESET';
  payload?: Record<string, unknown>;
}

export interface TransactionGroup {
  groupId: string;
  mutations?: WalletMutation[];
  poolMutations?: ServerPoolMutation[];
  events?: EventInput[];
  result?: unknown;
}

export interface EventInput {
  eventId?: string;
  occurredAtUtc?: string;
  type: string;
  actorPlayerId?: string;
  subjectPlayerId?: string;
  groupId?: string;
  idempotencyKey?: string;
  cause: string;
  payload?: Record<string, unknown>;
}

export interface EventEnvelope extends EventInput {
  sequence: number;
  eventId: string;
  occurredAtUtc: string;
  payload: Record<string, unknown>;
}

interface PersistedState {
  schemaVersion: number;
  profiles: Record<string, ProfileRecord>;
  server: ServerRecord;
  idempotency: Record<string, { fingerprint: string; result: unknown }>;
  events: EventEnvelope[];
  nextSequence: number;
  [key: string]: unknown;
}

export interface AdapterOptions {
  directory: string;
  schemaVersion?: number;
  economyParameters?: Partial<EconomyParameters>;
  starterLoadout?: ItemInstance[];
  now?: () => Date;
}

export class PersistenceError extends Error {}
export class ConfigValidationError extends PersistenceError {}
export class LockError extends PersistenceError {}

const DEFAULT_CONFIG: EconomyParameters = {
  version: 1,
  clientEditable: false,
  robberyCarriedCashShareBps: 10000,
  robberyCarriedCashCap: null,
  robberyLootSelection: true,
  robberyCooldownSeconds: 0,
  victimRecoveryImmunitySeconds: 0,
  jackpotOutcomeSpace: ['SMALL', 'MEDIUM', 'LARGE', 'MISS', 'JACKPOT'],
  jackpotPaytable: { SMALL: 2, MEDIUM: 10, LARGE: 20, MISS: 0, JACKPOT: 'pool' },
  jackpotHitOdds: { LOW: 2, MEDIUM: 5, HIGH: 10, EXTREME: 25 },
  jackpotContributionBps: 800,
  jackpotSeed: 10000,
  jackpotSeedByZone: { BUDGET: 10000, MIDDLE: 50000, VIP: 250000 },
  jackpotStakeByZoneAndTier: {
    'BUDGET:LOW': 100,
    'BUDGET:MEDIUM': 500,
    'BUDGET:HIGH': 2000,
    'BUDGET:EXTREME': 10000,
    'MIDDLE:LOW': 500,
    'MIDDLE:MEDIUM': 2000,
    'MIDDLE:HIGH': 10000,
    'MIDDLE:EXTREME': 50000,
    'VIP:LOW': 2000,
    'VIP:MEDIUM': 10000,
    'VIP:HIGH': 50000,
    'VIP:EXTREME': 250000,
  },
  offlineHeatDecayPerHour: 0,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fingerprint(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)]));
    }
    return input;
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function assertIntegerMoney(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) throw new PersistenceError(`${name} must be an integer minor-unit amount`);
}

export function classifyLoot(item: ItemInstance): LootClassification {
  if (item.bound || item.starter || item.questCritical || item.activeJob || item.equipped) return 'PROTECTED';
  return item.classification === 'LOOTABLE' ? 'LOOTABLE' : 'PROTECTED';
}

export function eligibleLoot(items: ItemInstance[]): ItemInstance[] {
  return items.filter((item) => classifyLoot(item) === 'LOOTABLE').map(clone);
}

export function validateEconomyParameters(config: Partial<EconomyParameters> | undefined): { robbery: boolean; jackpot: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || config.clientEditable === true) errors.push('robbery/jackpot config is missing or client-editable');
  const c = config as Partial<EconomyParameters> | undefined;
  if (c) {
    for (const key of ['robberyCarriedCashShareBps', 'robberyCooldownSeconds', 'victimRecoveryImmunitySeconds', 'jackpotContributionBps', 'jackpotSeed'] as const) {
      if (typeof c[key] !== 'number' || !Number.isFinite(c[key]) || c[key] < 0) errors.push(`${key} is invalid`);
    }
    const requiredOutcomes = ['SMALL', 'MEDIUM', 'LARGE', 'MISS', 'JACKPOT'];
    if (Array.isArray(c.jackpotOutcomeSpace) && requiredOutcomes.some((outcome) => !c.jackpotOutcomeSpace!.includes(outcome))) errors.push('jackpotOutcomeSpace is missing a required outcome');
    if (typeof c.robberyCarriedCashShareBps === 'number' && c.robberyCarriedCashShareBps > 10000) errors.push('robberyCarriedCashShareBps exceeds 10000');
    if (typeof c.jackpotContributionBps === 'number' && c.jackpotContributionBps >= 10000) errors.push('jackpotContributionBps must be below 10000');
    if (!Array.isArray(c.jackpotOutcomeSpace) || c.jackpotOutcomeSpace.length === 0 || c.jackpotOutcomeSpace.some((outcome) => typeof outcome !== 'string' || outcome.trim() === '')) errors.push('jackpotOutcomeSpace is invalid');
    if (!c.jackpotPaytable || typeof c.jackpotPaytable !== 'object') errors.push('jackpotPaytable is missing');
    else for (const [outcome, payout] of Object.entries(c.jackpotPaytable)) {
      if (!c.jackpotOutcomeSpace?.includes(outcome)) errors.push(`jackpotPaytable has unknown outcome ${outcome}`);
      if (payout !== 'pool' && (!Number.isSafeInteger(payout) || payout < 0)) errors.push(`jackpotPaytable.${outcome} is invalid`);
    }
    const requiredTiers = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
    if (!c.jackpotHitOdds || typeof c.jackpotHitOdds !== 'object' || Object.values(c.jackpotHitOdds ?? {}).some((odds) => typeof odds !== 'number' || !Number.isFinite(odds) || odds < 0 || odds > 10000) || requiredTiers.some((tier) => typeof c.jackpotHitOdds?.[tier] !== 'number')) errors.push('jackpotHitOdds is invalid');
    const requiredZones = ['BUDGET', 'MIDDLE', 'VIP'];
    if (!c.jackpotSeedByZone || typeof c.jackpotSeedByZone !== 'object' || Object.values(c.jackpotSeedByZone ?? {}).some((seed) => !Number.isSafeInteger(seed) || seed < 0) || requiredZones.some((zone) => typeof c.jackpotSeedByZone?.[zone] !== 'number')) errors.push('jackpotSeedByZone is invalid');
    const requiredStakeKeys = requiredZones.flatMap((zone) => requiredTiers.map((tier) => `${zone}:${tier}`));
    if (!c.jackpotStakeByZoneAndTier || typeof c.jackpotStakeByZoneAndTier !== 'object' || Object.values(c.jackpotStakeByZoneAndTier ?? {}).some((stake) => !Number.isSafeInteger(stake) || stake < 0) || requiredStakeKeys.some((key) => typeof c.jackpotStakeByZoneAndTier?.[key] !== 'number')) errors.push('jackpotStakeByZoneAndTier is invalid');
    if (c.robberyCarriedCashCap !== null && c.robberyCarriedCashCap !== undefined && (!Number.isSafeInteger(c.robberyCarriedCashCap) || c.robberyCarriedCashCap < 0)) errors.push('robberyCarriedCashCap is invalid');
  }
  return { robbery: errors.length === 0, jackpot: errors.length === 0, errors };
}

export class LocalPersistenceAdapter {
  readonly directory: string;
  readonly supportedSchemaVersion: number;
  private readonly storePath: string;
  private readonly lockPath: string;
  private readonly journalPath: string;
  private readonly now: () => Date;
  private readonly starterLoadout: ItemInstance[];
  private lockFd: number | undefined;
  private state: PersistedState;
  private queue: Promise<void> = Promise.resolve();

  constructor(options: AdapterOptions) {
    this.directory = path.resolve(options.directory);
    this.supportedSchemaVersion = options.schemaVersion ?? 1;
    this.storePath = path.join(this.directory, 'store.json');
    this.lockPath = path.join(this.directory, '.writer.lock');
    this.journalPath = path.join(this.directory, '.transaction-journal.json');
    this.now = options.now ?? (() => new Date());
    this.starterLoadout = clone(options.starterLoadout ?? []);
    fs.mkdirSync(this.directory, { recursive: true });
    this.acquireLock();
    this.state = this.readOrCreateState(options.economyParameters);
  }

  close(): void {
    if (this.lockFd !== undefined) {
      fs.closeSync(this.lockFd);
      this.lockFd = undefined;
      try { fs.unlinkSync(this.lockPath); } catch { /* already removed */ }
    }
  }

  get configStatus(): { robbery: boolean; jackpot: boolean; errors: string[] } {
    return validateEconomyParameters(this.state.server.economyParameters);
  }

  loadProfile(playerId: string): ProfileRecord {
    if (!playerId) throw new PersistenceError('playerId is required');
    const existing = this.state.profiles[playerId];
    if (existing) return clone(existing);
    const profile = this.createProfile(playerId);
    this.state.profiles[playerId] = profile;
    this.persistState(this.state);
    return clone(profile);
  }

  saveProfile(profile: ProfileRecord, idempotencyKey: string): unknown {
    this.requireKey(idempotencyKey);
    this.validateProfile(profile);
    const input = { op: 'saveProfile', profile };
    const existing = this.state.idempotency[idempotencyKey];
    const fp = fingerprint(input);
    if (existing) { if (existing.fingerprint !== fp) throw new PersistenceError(`idempotency key collision: ${idempotencyKey}`); return clone(existing.result); }
    const next = clone(this.state); next.profiles[profile.playerId] = clone(profile); const result = clone(profile);
    next.idempotency[idempotencyKey] = { fingerprint: fp, result }; this.commitTransaction(next); this.state = next; return clone(result);
  }

  loadServerRecord(): ServerRecord { return clone(this.state.server); }

  saveServerRecord(record: ServerRecord, idempotencyKey: string): unknown {
    this.requireKey(idempotencyKey);
    this.validateServer(record);
    const input = { op: 'saveServerRecord', record };
    const existing = this.state.idempotency[idempotencyKey];
    const fp = fingerprint(input);
    if (existing) { if (existing.fingerprint !== fp) throw new PersistenceError(`idempotency key collision: ${idempotencyKey}`); return clone(existing.result); }
    const next = clone(this.state); next.server = clone(record); const result = clone(record);
    next.idempotency[idempotencyKey] = { fingerprint: fp, result }; this.commitTransaction(next); this.state = next; return clone(result);
  }

  applyWalletMutation(mutation: WalletMutation, idempotencyKey: string): unknown {
    this.requireKey(idempotencyKey);
    return this.applyTransactionGroup({ groupId: idempotencyKey, mutations: [mutation] }, idempotencyKey);
  }

  applyTransactionGroup(group: TransactionGroup, idempotencyKey: string): unknown {
    this.requireKey(idempotencyKey);
    if (!group.groupId) throw new PersistenceError('groupId is required');
    const input = { op: 'transactionGroup', group };
    const existing = this.state.idempotency[idempotencyKey];
    const fp = fingerprint(input);
    if (existing) {
      if (existing.fingerprint !== fp) throw new PersistenceError(`idempotency key collision: ${idempotencyKey}`);
      return clone(existing.result);
    }
    const next = clone(this.state);
    const events: EventInput[] = (group.events ?? []).map((event) => {
      if (event.groupId && event.groupId !== group.groupId) throw new PersistenceError('event groupId does not match transaction group');
      return { ...event, groupId: group.groupId, idempotencyKey: event.idempotencyKey ?? idempotencyKey };
    });
    for (const mutation of group.mutations ?? []) {
      const profile = next.profiles[mutation.playerId] ?? this.createProfile(mutation.playerId);
      assertIntegerMoney(mutation.delta, 'delta');
      const current = profile[mutation.container] as number;
      if (!Number.isSafeInteger(current) || current + mutation.delta < 0) throw new PersistenceError('wallet cannot be negative');
      profile[mutation.container] = current + mutation.delta;
      events.push({ type: mutation.eventType ?? (mutation.delta >= 0 ? 'WALLET_CREDIT' : 'WALLET_DEBIT'), actorPlayerId: mutation.actorPlayerId, subjectPlayerId: mutation.subjectPlayerId ?? mutation.playerId, groupId: group.groupId, idempotencyKey, cause: mutation.cause ?? mutation.reason, payload: { container: mutation.container, amount: Math.abs(mutation.delta), reason: mutation.reason, ...(mutation.payload ?? {}) } });
      next.profiles[mutation.playerId] = profile;
    }
    for (const mutation of group.poolMutations ?? []) {
      assertIntegerMoney(mutation.delta, 'pool delta');
      const current = next.server[mutation.pool] as number;
      if (current + mutation.delta < 0) throw new PersistenceError('pool cannot be negative');
      next.server[mutation.pool] = current + mutation.delta;
      events.push({ type: mutation.eventType ?? (mutation.delta >= 0 ? 'POOL_CREDIT' : 'POOL_DEBIT'), groupId: group.groupId, idempotencyKey, cause: mutation.reason, payload: { pool: mutation.pool, amount: Math.abs(mutation.delta), resultingBalance: current + mutation.delta, ...(mutation.payload ?? {}) } });
    }
    const appended = this.assignEvents(events, next.events.length ? next.events[next.events.length - 1].sequence + 1 : 1, next);
    const result = clone(group.result ?? { groupId: group.groupId, eventSequences: appended.map((event) => event.sequence) });
    next.idempotency[idempotencyKey] = { fingerprint: fp, result };
    next.nextSequence = appended.length ? appended[appended.length - 1].sequence + 1 : next.nextSequence;
    this.commitTransaction(next);
    this.state = next;
    return clone(result);
  }

  appendEvents(events: EventInput[]): EventEnvelope[] {
    if (!events.length) return [];
    const next = clone(this.state);
    const result = this.assignEvents(events, next.nextSequence, next);
    next.nextSequence += result.length;
    this.commitTransaction(next);
    this.state = next;
    return clone(result);
  }

  readEvents(fromSequence = 1, limit = Number.MAX_SAFE_INTEGER): EventEnvelope[] {
    if (!Number.isSafeInteger(fromSequence) || fromSequence < 1) throw new PersistenceError('fromSequence must be positive');
    const events = this.state.events.filter((event) => event.sequence >= fromSequence).slice(0, limit);
    for (let i = 1; i < events.length; i++) if (events[i].sequence !== events[i - 1].sequence + 1) throw new PersistenceError('event sequence gap');
    return clone(events);
  }

  replay(): { profiles: Record<string, ProfileRecord>; houseMarginAccrued: number; jackpotPoolAccrued: number } {
    const profiles: Record<string, ProfileRecord> = {};
    let houseMarginAccrued = 0; let jackpotPoolAccrued = this.state.server.economyParameters.jackpotSeed;
    for (const event of this.readEvents()) {
      const p = event.payload;
      if ((event.type === 'WALLET_CREDIT' || event.type === 'WALLET_DEBIT') && event.subjectPlayerId && p.container) {
        const profile = profiles[event.subjectPlayerId] ?? this.createProfile(event.subjectPlayerId);
        const delta = event.type === 'WALLET_CREDIT' ? Number(p.amount) : -Number(p.amount);
        profile[p.container as WalletContainer] = (profile[p.container as WalletContainer] as number) + delta;
        profiles[event.subjectPlayerId] = profile;
      }
      if (event.type === 'POOL_CREDIT' || event.type === 'POOL_DEBIT' || event.type === 'JACKPOT_CONTRIBUTION' || event.type === 'JACKPOT_HIT') {
        const delta = (event.type === 'POOL_CREDIT' || event.type === 'JACKPOT_CONTRIBUTION') ? Number(p.amount) : -Number(p.amount);
        if (p.pool === 'houseMarginAccrued') houseMarginAccrued += delta; else jackpotPoolAccrued += delta;
      }
      if (event.type === 'JACKPOT_POOL_RESET') jackpotPoolAccrued = Number(p.seed ?? this.state.server.economyParameters.jackpotSeed);
    }
    return { profiles, houseMarginAccrued, jackpotPoolAccrued };
  }

  hydrateProfile(playerId: string, at = this.now()): ProfileRecord {
    const profile = this.loadProfile(playerId);
    const elapsedHours = Math.max(0, at.getTime() - Date.parse(profile.heatLastDecayUtc)) / 3600000;
    const rate = this.state.server.economyParameters.offlineHeatDecayPerHour ?? 0;
    const decay = Math.min(profile.heat, Math.floor(elapsedHours * rate));
    if (decay > 0) {
      profile.heat -= decay;
      profile.heatLastDecayUtc = at.toISOString();
    }
    profile.lastSeenUtc = at.toISOString();
    const next = clone(this.state);
    next.profiles[playerId] = clone(profile);
    if (decay > 0) this.assignEvents([{ type: 'HEAT_DECAYED', subjectPlayerId: playerId, cause: 'OFFLINE_DECAY', payload: { delta: decay, resultingValue: profile.heat, elapsedHours } }], next.nextSequence, next);
    if (decay > 0) next.nextSequence = next.events[next.events.length - 1].sequence + 1;
    this.commitTransaction(next); this.state = next;
    return profile;
  }

  migrate(): void {
    if (this.state.schemaVersion > this.supportedSchemaVersion) throw new PersistenceError(`schemaVersion ${this.state.schemaVersion} is newer than supported ${this.supportedSchemaVersion}`);
    while (this.state.schemaVersion < this.supportedSchemaVersion) {
      const from = this.state.schemaVersion;
      const backup = `${this.storePath}.bak.${Date.now()}`;
      fs.copyFileSync(this.storePath, backup);
      const next = clone(this.state);
      if (from === 1) {
        next.server = { ...next.server, successorQueue: next.server.successorQueue ?? [], economyParameters: { ...DEFAULT_CONFIG, ...next.server.economyParameters } };
      }
      next.schemaVersion = from + 1; next.server.schemaVersion = from + 1;
      next.events.push({ sequence: next.nextSequence++, eventId: crypto.randomUUID(), occurredAtUtc: this.now().toISOString(), type: 'MIGRATION_APPLIED', cause: 'MIGRATION', payload: { fromVersion: from, toVersion: from + 1 } });
      this.persistState(next); this.state = next;
    }
  }

  private requireKey(key: string): void { if (typeof key !== 'string' || key.trim() === '') throw new PersistenceError('idempotencyKey is required'); }

  private createProfile(playerId: string): ProfileRecord {
    const now = this.now().toISOString();
    return {
      playerId, displayName: playerId, createdAtUtc: now, lastSeenUtc: now,
      cashCarried: 0, cashBanked: 0, chips: 0, standing: 0, heat: 0,
      heatLastDecayUtc: now, outstandingDebt: 0, inventory: clone(this.starterLoadout),
      loadout: {}, role: 'NONE', shiftState: 'OFF_SHIFT', questStage: 'Q0',
      completedQuestStages: [], noteFragmentsHeld: [], jobInstanceId: null,
      jobProgress: null, robberyCooldownUntilUtc: null, victimImmunityUntilUtc: null,
    };
  }

  private mutateIdempotent(key: string, input: unknown, action: () => unknown): unknown {
    const fp = fingerprint(input); const existing = this.state.idempotency[key];
    if (existing) { if (existing.fingerprint !== fp) throw new PersistenceError(`idempotency key collision: ${key}`); return clone(existing.result); }
    const result = action(); this.state.idempotency[key] = { fingerprint: fp, result: clone(result) }; this.persistState(this.state); return clone(result);
  }

  private assignEvents(events: EventInput[], start: number, target: PersistedState): EventEnvelope[] {
    const result = events.map((event, index) => ({ ...event, sequence: start + index, eventId: event.eventId ?? crypto.randomUUID(), occurredAtUtc: event.occurredAtUtc ?? this.now().toISOString(), payload: clone(event.payload ?? {}) }));
    target.events.push(...result); return result;
  }

  private commitTransaction(next: PersistedState): void {
    this.persistJson(this.journalPath, { status: 'pending', state: next });
    this.persistState(next);
    try { fs.unlinkSync(this.journalPath); } catch { /* completed journal may already be gone */ }
  }

  private persistState(state: PersistedState): void { this.persistJson(this.storePath, state); }

  private persistJson(target: string, value: unknown): void {
    const temp = `${target}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
    const fd = fs.openSync(temp, 'w');
    try { fs.writeFileSync(fd, JSON.stringify(value, null, 2)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    try { fs.renameSync(temp, target); } catch { fs.rmSync(target, { force: true }); fs.renameSync(temp, target); }
  }

  private acquireLock(): void {
    try { this.lockFd = fs.openSync(this.lockPath, 'wx'); fs.writeFileSync(this.lockFd, String(process.pid)); return; }
    catch (error) {
      let pid = 0; try { pid = Number(fs.readFileSync(this.lockPath, 'utf8')); } catch { /* stale/unreadable */ }
      let alive = false; if (pid > 0) { try { process.kill(pid, 0); alive = true; } catch { alive = false; } }
      if (alive) throw new LockError('store is already locked by another writer');
      try { fs.unlinkSync(this.lockPath); this.lockFd = fs.openSync(this.lockPath, 'wx'); fs.writeFileSync(this.lockFd, String(process.pid)); } catch { throw new LockError('unable to acquire store lock'); }
    }
  }

  private readOrCreateState(parameters?: Partial<EconomyParameters>): PersistedState {
    let state: PersistedState;
    if (fs.existsSync(this.journalPath)) {
      const journal = JSON.parse(fs.readFileSync(this.journalPath, 'utf8')) as { state?: PersistedState };
      if (journal.state) { this.persistState(journal.state); try { fs.unlinkSync(this.journalPath); } catch { /* noop */ } }
    }
    if (fs.existsSync(this.storePath)) state = JSON.parse(fs.readFileSync(this.storePath, 'utf8')) as PersistedState;
    else {
      const config = { ...DEFAULT_CONFIG, ...(parameters ?? {}) };
      state = { schemaVersion: this.supportedSchemaVersion, profiles: {}, server: { houseMarginAccrued: 0, jackpotPoolAccrued: config.jackpotSeed, ownerSeatHolder: null, floorManagerSeatHolder: null, successorQueue: [], casinoUpkeepDueUtc: null, schemaVersion: this.supportedSchemaVersion, economyParameters: config }, idempotency: {}, events: [], nextSequence: 1 };
      this.persistState(state);
    }
    if (state.schemaVersion > this.supportedSchemaVersion) { this.close(); throw new PersistenceError(`schemaVersion ${state.schemaVersion} is newer than supported ${this.supportedSchemaVersion}`); }
    this.state = state;
    if (state.schemaVersion < this.supportedSchemaVersion) this.migrate();
    return this.state;
  }

  private validateProfile(profile: ProfileRecord): void {
    for (const key of ['cashCarried', 'cashBanked', 'chips', 'standing', 'heat', 'outstandingDebt'] as const) { assertIntegerMoney(profile[key], key); if (profile[key] < 0) throw new PersistenceError(`${key} cannot be negative`); }
  }

  private validateServer(server: ServerRecord): void {
    for (const key of ['houseMarginAccrued', 'jackpotPoolAccrued'] as const) { assertIntegerMoney(server[key], key); if (server[key] < 0) throw new PersistenceError(`${key} cannot be negative`); }
    const owners = Object.values(this.state.profiles).filter((profile) => profile.role === 'OWNER').length;
    if (owners > 1 || (server.ownerSeatHolder && !this.state.profiles[server.ownerSeatHolder])) throw new PersistenceError('invalid owner seat');
  }
}

export default LocalPersistenceAdapter;
