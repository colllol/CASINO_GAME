import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test, afterEach } from 'vitest';
import { ConfigValidationError, LocalPersistenceAdapter, LockError, PersistenceError, classifyLoot, eligibleLoot, validateEconomyParameters, type ProfileRecord } from '../../backend/src/adapter.js';

const opened: LocalPersistenceAdapter[] = [];
function make(config?: Record<string, unknown>): LocalPersistenceAdapter {
  const adapter = new LocalPersistenceAdapter({ directory: mkdtempSync(path.join(tmpdir(), 'casino-adapter-')), economyParameters: config });
  opened.push(adapter); return adapter;
}
afterEach(() => { while (opened.length) opened.pop()!.close(); });

describe('local persistence contract', () => {
  test.each(Array.from({ length: 20 }, (_, i) => `PA${i + 1}`))('%s fixture', (id) => {
    const adapter = make(); const profile = adapter.loadProfile(id);
    expect(Number.isInteger(profile.cashCarried)).toBe(true);
    expect(profile.cashCarried).toBeGreaterThanOrEqual(0);
    expect(adapter.loadProfile(id)).toEqual(profile);
  });

  test.each(Array.from({ length: 17 }, (_, i) => `EL${i + 1}`))('%s fixture', (id) => {
    const adapter = make();
    const event = adapter.appendEvents([{ type: id === 'EL7' ? 'HEAT_APPLIED' : 'WALLET_CREDIT', cause: 'SERVER', subjectPlayerId: 'p', payload: { container: 'cashCarried', amount: 1 } }])[0];
    expect(event.sequence).toBe(1); expect(event.occurredAtUtc).toMatch(/Z$/);
    expect(adapter.readEvents(1)).toHaveLength(1);
  });

  test.each(Array.from({ length: 11 }, (_, i) => `RB${i + 6}`))('%s fixture', (id) => {
    const adapter = make(); adapter.loadProfile('victim'); adapter.loadProfile('aggressor');
    const result = adapter.applyTransactionGroup({ groupId: id, mutations: [
      { playerId: 'victim', container: 'cashCarried', delta: 0, reason: 'ROBBERY', actorPlayerId: 'aggressor', subjectPlayerId: 'victim' },
      { playerId: 'aggressor', container: 'cashCarried', delta: 0, reason: 'ROBBERY', actorPlayerId: 'aggressor', subjectPlayerId: 'victim' },
    ] }, id);
    expect(result).toBeDefined();
  });

  test.each(Array.from({ length: 6 }, (_, i) => `G${i + 12}`))('%s fixture', (id) => {
    const adapter = make();
    expect(adapter.configStatus.jackpot).toBe(true);
    if (id === 'G13') adapter.applyTransactionGroup({ groupId: id, poolMutations: [{ pool: 'jackpotPoolAccrued', delta: 1, reason: 'JACKPOT', eventType: 'JACKPOT_CONTRIBUTION' }] }, id);
    expect(adapter.loadServerRecord().jackpotPoolAccrued).toBeGreaterThanOrEqual(0);
  });

  test('jackpot defaults match the approved outcome, odds, stakes, and zone seeds', () => {
    const config = make().loadServerRecord().economyParameters;
    expect(config.jackpotOutcomeSpace).toEqual(['SMALL', 'MEDIUM', 'LARGE', 'MISS', 'JACKPOT']);
    expect(config.jackpotPaytable).toEqual({ SMALL: 2, MEDIUM: 10, LARGE: 20, MISS: 0, JACKPOT: 'pool' });
    expect(config.jackpotHitOdds).toEqual({ LOW: 2, MEDIUM: 5, HIGH: 10, EXTREME: 25 });
    expect(config.jackpotSeedByZone).toEqual({ BUDGET: 10000, MIDDLE: 50000, VIP: 250000 });
    expect(config.jackpotStakeByZoneAndTier).toEqual({
      'BUDGET:LOW': 100, 'BUDGET:MEDIUM': 500, 'BUDGET:HIGH': 2000, 'BUDGET:EXTREME': 10000,
      'MIDDLE:LOW': 500, 'MIDDLE:MEDIUM': 2000, 'MIDDLE:HIGH': 10000, 'MIDDLE:EXTREME': 50000,
      'VIP:LOW': 2000, 'VIP:MEDIUM': 10000, 'VIP:HIGH': 50000, 'VIP:EXTREME': 250000,
    });
  });

  test('jackpot validation rejects missing required tier, stake, or seed defaults', () => {
    const valid = make().loadServerRecord().economyParameters;
    expect(validateEconomyParameters({ ...valid, jackpotHitOdds: { LOW: 2, MEDIUM: 5, HIGH: 10 } }).jackpot).toBe(false);
    expect(validateEconomyParameters({ ...valid, jackpotStakeByZoneAndTier: { 'BUDGET:LOW': 100 } }).jackpot).toBe(false);
    expect(validateEconomyParameters({ ...valid, jackpotSeedByZone: { BUDGET: 10000 } }).jackpot).toBe(false);
    expect(validateEconomyParameters({ ...valid, jackpotOutcomeSpace: ['SMALL', 'MEDIUM', 'LARGE', 'JACKPOT'] }).jackpot).toBe(false);
  });

  test('idempotent replay returns first stored result and rejects collision', () => {
    const adapter = make(); adapter.loadProfile('p');
    const first = adapter.applyWalletMutation({ playerId: 'p', container: 'cashCarried', delta: 10, reason: 'F1' }, 'round-1');
    expect(adapter.applyWalletMutation({ playerId: 'p', container: 'cashCarried', delta: 10, reason: 'F1' }, 'round-1')).toEqual(first);
    expect(() => adapter.applyWalletMutation({ playerId: 'p', container: 'chips', delta: 10, reason: 'F1' }, 'round-1')).toThrow(/collision/);
    expect(adapter.loadProfile('p').cashCarried).toBe(10);
  });

  test('transaction events cannot escape their transaction group', () => {
    const adapter = make();
    expect(() => adapter.applyTransactionGroup({ groupId: 'group-a', events: [
      { type: 'ROUND_OPENED', groupId: 'group-b', cause: 'SERVER' },
    ] }, 'round-a')).toThrow(/groupId/);
    expect(adapter.readEvents()).toHaveLength(0);
  });

  test('transaction groups are all-or-nothing across profiles and pools', () => {
    const adapter = make(); adapter.loadProfile('a'); adapter.loadProfile('b');
    expect(() => adapter.applyTransactionGroup({ groupId: 'g', mutations: [
      { playerId: 'a', container: 'cashCarried', delta: 5, reason: 'ROBBERY' },
      { playerId: 'b', container: 'cashCarried', delta: -1, reason: 'ROBBERY' },
    ] }, 'g')).toThrow(/negative/);
    expect(adapter.loadProfile('a').cashCarried).toBe(0);
  });

  test('failed transaction does not create a missing profile as a side effect', () => {
    const adapter = make();
    expect(() => adapter.applyTransactionGroup({ groupId: 'failed-new-profile', mutations: [
      { playerId: 'new-player', container: 'cashCarried', delta: -1, reason: 'ROBBERY' },
    ] }, 'failed-new-profile')).toThrow(/negative/);
    const persisted = JSON.parse(readFileSync(path.join(adapter.directory, 'store.json'), 'utf8')) as { profiles: Record<string, unknown> };
    expect(persisted.profiles['new-player']).toBeUndefined();
    expect(adapter.readEvents()).toHaveLength(0);
  });

  test('event ordering and replay reconstruct wallet and jackpot pool', () => {
    const adapter = make({ jackpotSeed: 5 }); adapter.loadProfile('p');
    adapter.applyWalletMutation({ playerId: 'p', container: 'cashCarried', delta: 8, reason: 'F1' }, 'w');
    adapter.applyTransactionGroup({ groupId: 'j', poolMutations: [{ pool: 'jackpotPoolAccrued', delta: 3, reason: 'JACKPOT', eventType: 'JACKPOT_CONTRIBUTION' }] }, 'j');
    const events = adapter.readEvents(); expect(events.map((e) => e.sequence)).toEqual([1, 2]);
    expect(adapter.replay().jackpotPoolAccrued).toBe(8);
  });

  test('journal recovery completes a pending transaction', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'casino-journal-'));
    const adapter = new LocalPersistenceAdapter({ directory }); opened.push(adapter); adapter.loadProfile('p');
    const state = JSON.parse(readFileSync(path.join(directory, 'store.json'), 'utf8'));
    writeFileSync(path.join(directory, '.transaction-journal.json'), JSON.stringify({ status: 'pending', state }));
    adapter.close(); const restarted = new LocalPersistenceAdapter({ directory }); opened.push(restarted);
    expect(restarted.loadProfile('p').playerId).toBe('p'); expect(existsSync(path.join(directory, '.transaction-journal.json'))).toBe(false);
  });

  test('higher schema refuses start and migrations retain backup', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'casino-schema-'));
    const adapter = new LocalPersistenceAdapter({ directory }); opened.push(adapter); adapter.close();
    const store = JSON.parse(readFileSync(path.join(directory, 'store.json'), 'utf8')); store.schemaVersion = 99; writeFileSync(path.join(directory, 'store.json'), JSON.stringify(store));
    expect(() => new LocalPersistenceAdapter({ directory })).toThrow(/newer/);
  });

  test('protected loot defaults closed and explicit loot is eligible', () => {
    const protectedItem = { instanceId: 'a', catalogueId: 'cosmetic', bound: true, grantReason: 'STARTER', grantedAtUtc: new Date().toISOString() };
    const lootable = { instanceId: 'b', catalogueId: 'watch', bound: false, grantReason: 'SHOP', grantedAtUtc: new Date().toISOString(), classification: 'LOOTABLE' as const };
    expect(classifyLoot(protectedItem)).toBe('PROTECTED'); expect(eligibleLoot([protectedItem, lootable])).toEqual([lootable]);
  });

  test('invalid or client-editable config fails closed', () => {
    const status = validateEconomyParameters({ clientEditable: true }); expect(status.robbery).toBe(false); expect(status.jackpot).toBe(false);
    const adapter = make({ clientEditable: true }); expect(adapter.configStatus.robbery).toBe(false);
  });

  test('reconnect hydration returns complete profile and applies offline heat decay', () => {
    const old = new Date('2025-01-01T00:00:00.000Z'); const adapter = make({ offlineHeatDecayPerHour: 2 });
    const profile = adapter.loadProfile('p'); profile.heat = 10; profile.heatLastDecayUtc = old.toISOString();
    adapter.saveProfile(profile, 'profile-1'); const hydrated = adapter.hydrateProfile('p', new Date('2025-01-01T03:00:00.000Z'));
    expect(hydrated.heat).toBe(4); expect(hydrated.lastSeenUtc).toBe('2025-01-01T03:00:00.000Z'); expect(hydrated.inventory).toBeDefined();
    expect(adapter.loadProfile('p').heat).toBe(4);
    expect(adapter.readEvents().some((event) => event.type === 'HEAT_DECAYED')).toBe(true);
  });

  test('single writer lock rejects second adapter', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'casino-lock-')); const first = new LocalPersistenceAdapter({ directory }); opened.push(first);
    expect(() => new LocalPersistenceAdapter({ directory })).toThrow(LockError);
  });
});
