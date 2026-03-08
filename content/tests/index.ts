import type { BlockDefinition, QuestionResponse, ScaleDefinition } from "@/types/assessment";

import { BIG_FIVE_BLOCK } from "@/content/tests/big-five";
import { CONFLICT_PROFILE_BLOCK } from "@/content/tests/conflict-profile";
import { IPIP_IPC_BLOCK } from "@/content/tests/ipip-ipc";

export const TEST_BLOCKS: BlockDefinition[] = [
  BIG_FIVE_BLOCK,
  IPIP_IPC_BLOCK,
  CONFLICT_PROFILE_BLOCK,
];

export const TEST_BLOCKS_BY_ID = Object.fromEntries(
  TEST_BLOCKS.map((block) => [block.id, block]),
) as Record<BlockDefinition["id"], BlockDefinition>;

export const ALL_SCALE_DEFINITIONS: ScaleDefinition[] = TEST_BLOCKS.flatMap(
  (block) => block.scales,
);

export function createInitialResponses(block: BlockDefinition): QuestionResponse[] {
  return block.questions.map((question) => ({
    ...question,
    answer: null,
    answeredAt: null,
  }));
}
