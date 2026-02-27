import { getRoomMembers, getDisplayName, getMatrixClient, getBotJoinedRooms, getRoomProfile } from "./matrix";
import type { IStorage } from "./storage";

const ADMIN_MATRIX_ROOM = process.env.ADMIN_MATRIX_ROOM || "!imueijCPGUZihXVrif:synapse.textrp.io";
const CONSULTANT_MATRIX_ROOM = process.env.CONSULTANT_MATRIX_ROOM || "";
const SYNC_INTERVAL_MS = 60_000;

const EXCLUDED_IDS: Set<string> = new Set(
  (process.env.SYNC_EXCLUDE_MATRIX_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
);

const liveAdmins = new Set<string>();
const liveConsultantRoomMembers = new Set<string>();

let lastSyncAt: Date | null = null;
let lastAdminCount = 0;
let lastConsultantRoomCount = 0;
let lastConsultantsSynced = 0;

export function getLiveAdmins(): Set<string> {
  return liveAdmins;
}

export function isConsultantRoomMember(matrixUserId: string): boolean {
  return liveConsultantRoomMembers.has(matrixUserId);
}

export function getSyncStatus() {
  return {
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    adminCount: lastAdminCount,
    consultantRoomMembers: lastConsultantRoomCount,
    consultantsSynced: lastConsultantsSynced,
    adminRoomId: ADMIN_MATRIX_ROOM,
    consultantRoomId: CONSULTANT_MATRIX_ROOM || null,
    excludedIds: Array.from(EXCLUDED_IDS),
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

  liveConsultantRoomMembers.clear();
  for (const m of members) liveConsultantRoomMembers.add(m);

  const existingConsultants = await storage.getConsultants();
  const existingByMatrixId = new Map(
    existingConsultants
      .filter(c => c.matrixUserId)
      .map(c => [c.matrixUserId!, c])
  );

  let synced = 0;

  for (const matrixUserId of members) {
    if (matrixUserId.startsWith("@bot") || !matrixUserId.includes(":")) continue;

    if (EXCLUDED_IDS.has(matrixUserId)) {
      console.log(`[sync] Skipping excluded ID: ${matrixUserId} (has room access, no auto-create)`);
      continue;
    }

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
    if (EXCLUDED_IDS.has(consultant.matrixUserId)) continue;
    if (!memberSet.has(consultant.matrixUserId) && consultant.isActive) {
      await storage.updateConsultant(consultant.slug, { isActive: false });
      console.log(`[sync] Deactivated consultant no longer in room: ${consultant.slug}`);
      synced++;
    }
  }

  lastConsultantsSynced = synced;
}

async function syncProfileRooms(storage: IStorage): Promise<void> {
  const existingConsultants = await storage.getConsultants();
  const visitorRoomIds = new Set(await storage.getVisitorChatRoomIds());
  const managementRooms = new Set([ADMIN_MATRIX_ROOM, CONSULTANT_MATRIX_ROOM].filter(Boolean));

  const syncedSlugs = new Set<string>();

  for (const consultant of existingConsultants) {
    if (consultant.profileRoomId) {
      const roomProfile = await getRoomProfile(consultant.profileRoomId);
      if (roomProfile.name && !roomProfile.name.startsWith("Chat with ")) {
        await storage.upsertChatHostConfigBySlug(consultant.slug, {
          displayName: roomProfile.name,
          avatarUrl: roomProfile.avatarUrl ?? consultant.avatarUrl ?? undefined,
          statusMessage: roomProfile.topic ?? undefined,
        });
        console.log(`[sync] Updated chat profile for ${consultant.slug} from linked room ${consultant.profileRoomId}`);
      }
      syncedSlugs.add(consultant.slug);
    }
  }

  const unlinkedConsultants = existingConsultants.filter(c => !syncedSlugs.has(c.slug));
  if (!unlinkedConsultants.length) return;

  const allJoinedRooms = await getBotJoinedRooms();
  const candidateRooms = allJoinedRooms.filter(
    r => !managementRooms.has(r) && !visitorRoomIds.has(r)
  );

  for (const roomId of candidateRooms) {
    const unlinkedByMatrixId = new Map(
      unlinkedConsultants.filter(c => c.matrixUserId && !syncedSlugs.has(c.slug)).map(c => [c.matrixUserId!, c])
    );
    if (!unlinkedByMatrixId.size) break;

    const roomProfile = await getRoomProfile(roomId);
    if (roomProfile.name?.startsWith("Chat with ") || !roomProfile.name) continue;

    const members = await getRoomMembers(roomId);
    if (!members) continue;

    let matchedConsultant: typeof existingConsultants[number] | undefined;
    for (const memberId of members) {
      const c = unlinkedByMatrixId.get(memberId);
      if (c) { matchedConsultant = c; break; }
    }
    if (!matchedConsultant) continue;

    await storage.updateConsultant(matchedConsultant.slug, { profileRoomId: roomId });
    await storage.upsertChatHostConfigBySlug(matchedConsultant.slug, {
      displayName: roomProfile.name,
      avatarUrl: roomProfile.avatarUrl ?? matchedConsultant.avatarUrl ?? undefined,
      statusMessage: roomProfile.topic ?? undefined,
    });
    syncedSlugs.add(matchedConsultant.slug);
    console.log(`[sync] Auto-linked profile room ${roomId} → consultant: ${matchedConsultant.slug}`);
    console.log(`[sync] Updated chat profile for ${matchedConsultant.slug} from room ${roomId}`);
  }
}

async function runSync(storage: IStorage): Promise<void> {
  try {
    await Promise.all([
      syncAdminRoom(),
      syncConsultantRoom(storage),
      syncProfileRooms(storage),
    ]);
    lastSyncAt = new Date();
  } catch (err) {
    console.error("[sync] Sync error:", err);
  }
}

async function joinSyncRooms(): Promise<void> {
  const rooms = [ADMIN_MATRIX_ROOM, CONSULTANT_MATRIX_ROOM].filter(Boolean);
  if (!rooms.length) return;
  try {
    const client = await getMatrixClient();
    for (const roomId of rooms) {
      try {
        await client.joinRoom(roomId);
        console.log(`[sync] Bot joined room: ${roomId}`);
      } catch (e: any) {
        if (e?.errcode === "M_ALREADY_JOINED" || e?.message?.includes("already")) {
          console.log(`[sync] Bot already in room: ${roomId}`);
        } else {
          console.warn(`[sync] Could not join room ${roomId}:`, e?.message ?? e);
        }
      }
    }
  } catch (err) {
    console.warn("[sync] joinSyncRooms error:", err);
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

  joinSyncRooms().then(() => runSync(storage));
  setInterval(() => runSync(storage), SYNC_INTERVAL_MS);
}
