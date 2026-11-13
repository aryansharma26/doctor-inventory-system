import type { RealtimeClientOptions } from "@supabase/realtime-js";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "./env.js";

const websocketTransport = WebSocket as unknown as NonNullable<RealtimeClientOptions["transport"]>;

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: websocketTransport }
});
