// Polyfill Promise.withResolvers for Node.js < 22
if (typeof (Promise as any).withResolvers === "undefined") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import * as sdk from "matrix-js-sdk";

const MATRIX_HOMESERVER = "https://synapse.textrp.io";
const MATRIX_USER_ID = process.env.CHATBOT || "";
const MATRIX_ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";
const MATRIX_RECIPIENT = process.env.RECIPIENT || "";

let matrixClient: sdk.MatrixClient | null = null;

const joinedRooms = new Set<string>();

async function ensureInRoom(client: sdk.MatrixClient, roomId: string): Promise<void> {
  if (joinedRooms.has(roomId)) return;
  try {
    await client.joinRoom(roomId);
    joinedRooms.add(roomId);
  } catch (e: any) {
    if (e?.errcode === "M_ALREADY_JOINED" || e?.message?.includes("already")) {
      joinedRooms.add(roomId);
    }
  }
}

export async function getMatrixClient(): Promise<sdk.MatrixClient> {
  if (matrixClient) {
    return matrixClient;
  }

  matrixClient = sdk.createClient({
    baseUrl: MATRIX_HOMESERVER,
    accessToken: MATRIX_ACCESS_TOKEN,
    userId: MATRIX_USER_ID,
  });

  return matrixClient;
}

export async function createChatRoom(
  visitorName: string,
  visitorEmail?: string,
  recipientMatrixUserId?: string
): Promise<string> {
  const client = await getMatrixClient();

  const roomName = `Chat with ${visitorName}`;
  const recipient = recipientMatrixUserId || MATRIX_RECIPIENT;

  try {
    const response = await client.createRoom({
      name: roomName,
      topic: visitorEmail ? `Visitor email: ${visitorEmail}` : "Website visitor chat",
      visibility: sdk.Visibility.Private,
      preset: sdk.Preset.PrivateChat,
      invite: recipient ? [recipient] : [],
    });

    const roomId = response.room_id;
    joinedRooms.add(roomId);
    console.log(`Matrix room created: ${roomId}`);

    if (recipient) {
      console.log(`Invited ${recipient} to room ${roomId}`);
    }

    return roomId;
  } catch (error) {
    console.error("Failed to create Matrix room:", error);
    throw error;
  }
}

export async function sendMatrixMessage(roomId: string, content: string, isFromVisitor: boolean): Promise<void> {
  const client = await getMatrixClient();

  const messageContent = {
    msgtype: "m.text",
    body: isFromVisitor ? `[Visitor]: ${content}` : content,
  };

  try {
    await ensureInRoom(client, roomId);
    await client.sendMessage(roomId, messageContent);
    console.log(`Matrix message sent to room ${roomId}`);
  } catch (error) {
    console.error("Failed to send Matrix message:", error);
    throw error;
  }
}

export async function getMatrixMessages(roomId: string, since?: string): Promise<{ messages: Array<{ content: string; isFromVisitor: boolean; timestamp: number; eventId: string }>; nextBatch?: string }> {
  const client = await getMatrixClient();

  try {
    await ensureInRoom(client, roomId);

    const messages: Array<{ content: string; isFromVisitor: boolean; timestamp: number; eventId: string }> = [];

    const response = await client.createMessagesRequest(roomId, since || null, 50, "b");

    if (response.chunk) {
      for (const event of response.chunk) {
        if (event.type === "m.room.message" && event.content?.msgtype === "m.text") {
          const body = event.content.body as string;
          const isFromVisitor = body.startsWith("[Visitor]: ");
          messages.push({
            content: isFromVisitor ? body.replace("[Visitor]: ", "") : body,
            isFromVisitor,
            timestamp: event.origin_server_ts || Date.now(),
            eventId: event.event_id,
          });
        }
      }
    }

    return {
      messages: messages.sort((a, b) => a.timestamp - b.timestamp),
      nextBatch: response.end,
    };
  } catch (error) {
    console.error("Failed to get Matrix messages:", error);
    return { messages: [] };
  }
}

const processedEvents = new Set<string>();

export async function uploadMediaToMatrix(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const client = await getMatrixClient();

  try {
    const uploadResponse = await client.uploadContent(fileBuffer, {
      name: fileName,
      type: mimeType,
    });

    console.log(`Media uploaded to Matrix: ${fileName} -> ${uploadResponse.content_uri}`);
    return uploadResponse.content_uri;
  } catch (error) {
    console.error("Matrix media upload error:", error);
    throw new Error("Failed to upload media to Matrix");
  }
}

export async function uploadFileToMatrix(
  roomId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ mxcUrl: string; eventId: string }> {
  const client = await getMatrixClient();

  try {
    await ensureInRoom(client, roomId);

    const uploadResponse = await client.uploadContent(fileBuffer, {
      name: fileName,
      type: mimeType,
    });

    const mxcUrl = uploadResponse.content_uri;

    const isImage = mimeType.startsWith("image/");
    const msgtype = isImage ? "m.image" : "m.file";

    const messageContent: any = {
      msgtype,
      body: `[Visitor]: ${fileName}`,
      filename: fileName,
      url: mxcUrl,
      info: {
        mimetype: mimeType,
        size: fileBuffer.length,
      },
    };

    const sendResponse = await client.sendMessage(roomId, messageContent);

    console.log(`File uploaded to Matrix: ${fileName} -> ${mxcUrl}`);

    return {
      mxcUrl,
      eventId: sendResponse.event_id,
    };
  } catch (error) {
    console.error("Failed to upload file to Matrix:", error);
    throw error;
  }
}

export async function getNewReplies(roomId: string): Promise<Array<{ content: string; timestamp: number; eventId: string }>> {
  const client = await getMatrixClient();

  try {
    await ensureInRoom(client, roomId);

    const replies: Array<{ content: string; timestamp: number; eventId: string }> = [];

    const response = await client.createMessagesRequest(roomId, null, 20, "b");

    if (response.chunk) {
      for (const event of response.chunk) {
        if (event.type === "m.room.message" && event.content?.msgtype === "m.text") {
          const body = event.content.body as string;
          const eventId = event.event_id;

          if (body.startsWith("[Visitor]: ") || processedEvents.has(eventId)) {
            continue;
          }

          processedEvents.add(eventId);
          replies.push({
            content: body,
            timestamp: event.origin_server_ts || Date.now(),
            eventId,
          });
        }
      }
    }

    return replies.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Failed to get Matrix replies:", error);
    return [];
  }
}

export async function getRoomMembers(roomId: string): Promise<string[] | null> {
  const botToken = process.env.ACCESS_TOKEN;
  if (!botToken) {
    console.warn("[matrix] getRoomMembers: no ACCESS_TOKEN set");
    return null;
  }
  try {
    const res = await fetch(
      `${MATRIX_HOMESERVER}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/joined_members`,
      { headers: { Authorization: `Bearer ${botToken}` } }
    );
    if (!res.ok) {
      console.warn(`[matrix] getRoomMembers failed for ${roomId}: HTTP ${res.status} — bot may not be a member of this room`);
      return null;
    }
    const data = await res.json() as { joined: Record<string, unknown> };
    return Object.keys(data.joined);
  } catch (err) {
    console.warn("[matrix] getRoomMembers error:", err);
    return null;
  }
}

export async function getBotJoinedRooms(): Promise<string[]> {
  const botToken = process.env.ACCESS_TOKEN;
  if (!botToken) return [];
  try {
    const res = await fetch(
      `${MATRIX_HOMESERVER}/_matrix/client/v3/joined_rooms`,
      { headers: { Authorization: `Bearer ${botToken}` } }
    );
    if (!res.ok) {
      console.warn(`[matrix] getBotJoinedRooms failed: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json() as { joined_rooms: string[] };
    return data.joined_rooms ?? [];
  } catch (err) {
    console.warn("[matrix] getBotJoinedRooms error:", err);
    return [];
  }
}

function mxcToHttps(mxcUrl: string): string {
  const without = mxcUrl.replace("mxc://", "");
  const [server, mediaId] = without.split("/");
  return `${MATRIX_HOMESERVER}/_matrix/media/v3/download/${server}/${mediaId}`;
}

export async function getRoomProfile(roomId: string): Promise<{ name: string | null; avatarUrl: string | null; topic: string | null }> {
  const botToken = process.env.ACCESS_TOKEN;
  if (!botToken) return { name: null, avatarUrl: null, topic: null };

  async function getStateEvent(type: string): Promise<any> {
    try {
      const res = await fetch(
        `${MATRIX_HOMESERVER}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state/${encodeURIComponent(type)}`,
        { headers: { Authorization: `Bearer ${botToken}` } }
      );
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  const [nameEvent, avatarEvent, topicEvent] = await Promise.all([
    getStateEvent("m.room.name"),
    getStateEvent("m.room.avatar"),
    getStateEvent("m.room.topic"),
  ]);

  const name = nameEvent?.name ?? null;
  const rawAvatar = avatarEvent?.url ?? null;
  const avatarUrl = rawAvatar?.startsWith("mxc://") ? mxcToHttps(rawAvatar) : rawAvatar;
  const topic = topicEvent?.topic ?? null;

  return { name, avatarUrl, topic };
}

export async function getDisplayName(userId: string): Promise<string> {
  const botToken = process.env.ACCESS_TOKEN;
  try {
    const res = await fetch(
      `${MATRIX_HOMESERVER}/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`,
      botToken ? { headers: { Authorization: `Bearer ${botToken}` } } : {}
    );
    if (res.ok) {
      const data = await res.json() as { displayname?: string };
      return data.displayname || userId;
    }
  } catch {
  }
  return userId;
}
