import { getRoomMembers, getDisplayName } from "./matrix";
import type { IStorage } from "./storage";

const ADMIN_MATRIX_ROOM = process.env.ADMIN_MATRIX_ROOM || "!imueijCPGUZihXVrif:synapse.textrp.io";
const CONSULTANT_MATRIX_ROOM = process.env.CONSULTANT_MATRIX_ROOM || "";
const SYNC_INTERVAL_MS = 60_000;

const liveAdmins = new Set<string>();

let lastSyncAt: Date | null = null;
let lastAdminCount = 0;
let lastConsultantRoomCount = 0;
let lastConsultantsSynced = 0;

export function getLiveAdmins(): Set<string> {
  return liveAdmins;
}

export function getSyncStatus() {
  return {
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    adminCount: lastAdminCount,
    consultantRoomMembers: lastConsultantRoomCount,
    consultantsSynced: lastConsultantsSynced,
    adminRoomId: ADMIN_MATRIX_ROOM,
    consultantRoomId: CONSULTANT_MATRIX_ROOM || null,
  };
}

async function syncAdminRoom(): Promise<void> {
  const members = await getRoomMembers(ADMIN_MATRIX_ROOM);
  if (members === null) {
    console.warn("[sync] Admin room fetch failed — skipping admin sync (bot not in room or no token)");
    return;
  }
  liveAdmins.clear();
  for (const m of members) liveAdmins.add(m);
  lastAdminCount = members.length;
  console.log(`[sync] Admin room members: ${members.length}`);
}

async function syncConsultantRoom(storage: IStorage): Promise<void> {
  if (!CONSULTANT_MATRIX_ROOM) return;

  const members = await getRoomMembers(CONSULTANT_MATRIX_ROOM);
  if (members === null) {
    console.warn("[sync] Consultant room fetch failed — skipping consultant sync (bot not in room or no token)");
    return;
  }
  lastConsultantRoomCount = members.length;
  console.log(`[sync] Consultant room members: ${members.length}`);

  const existingConsultants = await storage.getConsultants();
  const existingByMatrixId = new Map(
    existingConsultants
      .filter(c => c.matrixUserId)
      .map(c => [c.matrixUserId!, c])
  );

  let synced = 0;

  for (const matrixUserId of members) {
    if (matrixUserId.startsWith("@bot") || !matrixUserId.includes(":")) continue;

    const existing = existingByMatrixId.get(matrixUserId);

    if (!existing) {
      const displayName = await getDisplayName(matrixUserId);
      const localpart = matrixUserId.split(":")[0].replace("@", "");
      const slug = localpart.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const slugExists = await storage.getConsultantBySlug(slug);
      const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

      try {
        await storage.createConsultant({
          slug: finalSlug,
          name: displayName,
          matrixUserId,
          isActive: true,
        });
        console.log(`[sync] Auto-created consultant: ${displayName} (${matrixUserId}) → slug: ${finalSlug}`);
        synced++;
      } catch (err) {
        console.error(`[sync] Failed to create consultant for ${matrixUserId}:`, err);
      }
    } else if (!existing.isActive) {
      await storage.updateConsultant(existing.slug, { isActive: true });
      console.log(`[sync] Re-activated consultant: ${existing.slug}`);
      synced++;
    }
  }

  const memberSet = new Set(members);
  for (const consultant of existingConsultants) {
    if (!consultant.matrixUserId) continue;
    if (!memberSet.has(consultant.matrixUserId) && consultant.isActive) {
      await storage.updateConsultant(consultant.slug, { isActive: false });
      console.log(`[sync] Deactivated consultant no longer in room: ${consultant.slug}`);
      synced++;
    }
  }

  lastConsultantsSynced = synced;
}

async function runSync(storage: IStorage): Promise<void> {
  try {
    await Promise.all([
      syncAdminRoom(),
      syncConsultantRoom(storage),
    ]);
    lastSyncAt = new Date();
  } catch (err) {
    console.error("[sync] Sync error:", err);
  }
}

export function startSyncLoop(storage: IStorage): void {
  console.log(`[sync] Starting background sync loop (interval: ${SYNC_INTERVAL_MS / 1000}s)`);
  console.log(`[sync] Admin room: ${ADMIN_MATRIX_ROOM}`);
  if (CONSULTANT_MATRIX_ROOM) {
    console.log(`[sync] Consultant room: ${CONSULTANT_MATRIX_ROOM}`);
  } else {
    console.log("[sync] No CONSULTANT_MATRIX_ROOM set — consultant auto-sync disabled");
  }

  runSync(storage);
  setInterval(() => runSync(storage), SYNC_INTERVAL_MS);
}
