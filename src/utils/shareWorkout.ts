import { Workout, Block, WorkBlock, RestBlock, SectionBlock } from '@/types/workout';

/**
 * Compact workout schema for sharing via Base64-encoded URLs
 * Reduces size by ~60-70% through:
 * - Short property names (n, b, r, c, etc.)
 * - Omitted IDs (regenerated on import)
 * - Omitted timestamps (set to current time on import)
 */

/**
 * Unicode-safe Base64 encoding
 * Handles Cyrillic (Russian) and other Unicode characters
 */
export function encodeBase64Unicode(str: string): string {
  // Convert string to UTF-8 bytes using TextEncoder
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  // Convert bytes to binary string
  const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');

  // Encode to Base64
  return btoa(binaryString);
}

/**
 * Unicode-safe Base64 decoding
 */
export function decodeBase64Unicode(base64: string): string {
  // Decode Base64 to binary string
  const binaryString = atob(base64);

  // Convert binary string to bytes
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decode UTF-8 bytes to string
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

export interface CompactBlock {
  t: 'w' | 'r' | 's';  // type: work/rest/section
  n: string;           // title
  d: number;           // duration (seconds)
  p?: number;          // preparationTime (sections only)
  l?: number;          // loops (sections only)
  b?: CompactBlock[];  // nested blocks (sections only)
}

export interface CompactWorkout {
  n: string;           // name
  b: CompactBlock[];   // blocks
  r: number;           // systemRestSec
  c: number;           // circles
}

/**
 * Convert a Block to compact format
 */
function compactBlock(block: Block): CompactBlock {
  if (block.type === 'section') {
    return {
      t: 's' as const,
      n: block.title,
      d: 0, // sections don't have duration in the current model
      p: block.preparationTime,
      l: block.loops,
      b: block.blocks.map(compactBlock)
    };
  }

  // Work or Rest block
  return {
    t: block.type === 'work' ? 'w' as const : 'r' as const,
    n: block.title,
    d: block.duration
  };
}

/**
 * Convert a compact block back to full Block format
 */
function expandBlock(compact: CompactBlock): Block {
  const type = compact.t === 'w' ? 'work' : compact.t === 'r' ? 'rest' : 'section';
  const base = {
    id: crypto.randomUUID(),
    title: compact.n,
    duration: compact.d
  };

  if (type === 'section') {
    return {
      ...base,
      type: 'section',
      preparationTime: compact.p ?? 0,
      loops: compact.l ?? 1,
      blocks: (compact.b ?? []).map(expandBlock) as Array<WorkBlock | RestBlock>
    } as SectionBlock;
  }

  if (type === 'work') {
    return {
      ...base,
      type: 'work'
    } as WorkBlock;
  }

  return {
    ...base,
    type: 'rest'
  } as RestBlock;
}

/**
 * Convert a full Workout to compact format for sharing
 */
export function compactWorkout(workout: Workout): CompactWorkout {
  return {
    n: workout.name,
    b: workout.blocks.map(compactBlock),
    r: workout.systemRestSec,
    c: workout.circles
  };
}

/**
 * Convert a compact workout back to full Workout format
 * Note: id, createdAt, and updatedAt are not included and should be set by the caller
 */
export function expandWorkout(compact: CompactWorkout): Omit<Workout, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: compact.n,
    blocks: compact.b.map(expandBlock),
    systemRestSec: compact.r,
    circles: compact.c
  };
}
