import * as sdk from "matrix-js-sdk";

const MATRIX_HOMESERVER = "https://synapse.textrp.io";
const MATRIX_USER_ID = process.env.USER || "";
const MATRIX_ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";
const MATRIX_RECIPIENT = process.env.RECIPIENT || "";

let matrixClient: sdk.MatrixClient | null = null;

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

export async function createChatRoom(visitorName: string, visitorEmail?: string): Promise<string> {
  const client = await getMatrixClient();
  
  const roomName = `Chat with ${visitorName}`;
  
  try {
    const response = await client.createRoom({
      name: roomName,
      topic: visitorEmail ? `Visitor email: ${visitorEmail}` : "Website visitor chat",
      visibility: sdk.Visibility.Private,
      preset: sdk.Preset.PrivateChat,
      invite: MATRIX_RECIPIENT ? [MATRIX_RECIPIENT] : [],
    });
    
    console.log(`Matrix room created: ${response.room_id}`);
    
    if (MATRIX_RECIPIENT) {
      console.log(`Invited ${MATRIX_RECIPIENT} to room ${response.room_id}`);
    }
    
    return response.room_id;
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
    // Ensure we're in the room before sending
    try {
      await client.joinRoom(roomId);
    } catch (joinError: any) {
      // Ignore if already in room or other join issues
      if (joinError?.errcode !== 'M_FORBIDDEN') {
        console.log(`Join attempt for ${roomId}: ${joinError?.message || 'OK'}`);
      }
    }
    
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
    // Ensure we're in the room
    try {
      await client.joinRoom(roomId);
    } catch (e) {
      // Ignore join errors
    }
    
    const messages: Array<{ content: string; isFromVisitor: boolean; timestamp: number; eventId: string }> = [];
    
    // Use messages endpoint to get room messages
    const response = await client.createMessagesRequest(roomId, since || null, 50, "b");
    
    if (response.chunk) {
      for (const event of response.chunk) {
        if (event.type === "m.room.message" && event.content?.msgtype === "m.text") {
          const body = event.content.body as string;
          // Messages starting with [Visitor]: are from visitors
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

// Track processed event IDs to avoid duplicates
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
    // Ensure we're in the room
    try {
      await client.joinRoom(roomId);
    } catch (e) {
      // Ignore join errors
    }
    
    // Upload the file to Matrix content repository
    const uploadResponse = await client.uploadContent(fileBuffer, {
      name: fileName,
      type: mimeType,
    });
    
    const mxcUrl = uploadResponse.content_uri;
    
    // Determine message type based on mime type
    const isImage = mimeType.startsWith("image/");
    const msgtype = isImage ? "m.image" : "m.file";
    
    // Send file message to room
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
    // Ensure we're in the room
    try {
      await client.joinRoom(roomId);
    } catch (e) {
      // Ignore join errors
    }
    
    const replies: Array<{ content: string; timestamp: number; eventId: string }> = [];
    
    // Get recent messages from the room
    const response = await client.createMessagesRequest(roomId, null, 20, "b");
    
    if (response.chunk) {
      for (const event of response.chunk) {
        if (event.type === "m.room.message" && event.content?.msgtype === "m.text") {
          const body = event.content.body as string;
          const eventId = event.event_id;
          
          // Skip visitor messages and already processed events
          if (body.startsWith("[Visitor]: ") || processedEvents.has(eventId)) {
            continue;
          }
          
          // This is a reply from the recipient
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
