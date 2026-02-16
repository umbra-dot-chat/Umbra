/**
 * Calling module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';

/**
 * Store a new call record
 */
export async function storeCallRecord(
  id: string,
  conversationId: string,
  callType: string,
  direction: string,
  participants: string[]
): Promise<{ id: string; startedAt: number }> {
  const json = JSON.stringify({
    id,
    conversation_id: conversationId,
    call_type: callType,
    direction,
    participants: JSON.stringify(participants),
  });
  const resultJson = wasm().umbra_wasm_calls_store(json);
  return await parseWasm<{ id: string; startedAt: number }>(resultJson);
}

/**
 * End a call record
 */
export async function endCallRecord(
  callId: string,
  status: string
): Promise<{ id: string; endedAt: number; durationMs: number }> {
  const json = JSON.stringify({ id: callId, status });
  const resultJson = wasm().umbra_wasm_calls_end(json);
  return await parseWasm<{ id: string; endedAt: number; durationMs: number }>(resultJson);
}

/**
 * Get call history for a conversation
 */
export async function getCallHistory(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<any[]> {
  const json = JSON.stringify({ conversation_id: conversationId, limit, offset });
  const resultJson = wasm().umbra_wasm_calls_get_history(json);
  return await parseWasm<any[]>(resultJson);
}

/**
 * Get all call history
 */
export async function getAllCallHistory(limit = 50, offset = 0): Promise<any[]> {
  const json = JSON.stringify({ limit, offset });
  const resultJson = wasm().umbra_wasm_calls_get_all_history(json);
  return await parseWasm<any[]>(resultJson);
}

/**
 * Call event listener type
 */
export type CallListenerCallback = (event: any) => void;
