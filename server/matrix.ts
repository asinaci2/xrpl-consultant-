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
    await client.sendMessage(roomId, messageContent);
    console.log(`Matrix message sent to room ${roomId}`);
  } catch (error) {
    console.error("Failed to send Matrix message:", error);
    throw error;
  }
}

export async function getMatrixMessages(roomId: string): Promise<Array<{ content: string; isFromVisitor: boolean; timestamp: number }>> {
  const client = await getMatrixClient();
  
  try {
    const response = await client.roomInitialSync(roomId, 50);
    const messages: Array<{ content: string; isFromVisitor: boolean; timestamp: number }> = [];
    
    if (response.messages?.chunk) {
      for (const event of response.messages.chunk) {
        if (event.type === "m.room.message" && event.content?.msgtype === "m.text") {
          const body = event.content.body as string;
          const isFromVisitor = body.startsWith("[Visitor]: ");
          messages.push({
            content: isFromVisitor ? body.replace("[Visitor]: ", "") : body,
            isFromVisitor,
            timestamp: event.origin_server_ts || Date.now(),
          });
        }
      }
    }
    
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Failed to get Matrix messages:", error);
    return [];
  }
}
