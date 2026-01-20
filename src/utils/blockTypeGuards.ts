import type { Block, SectionBlock, WorkBlock, RestBlock } from '@/types/workout';

export function isSectionBlock(block: Block): block is SectionBlock {
  return block.type === 'section';
}

export function isWorkBlock(block: Block): block is WorkBlock {
  return block.type === 'work';
}

export function isRestBlock(block: Block): block is RestBlock {
  return block.type === 'rest';
}

export function isBasicBlock(block: Block): block is WorkBlock | RestBlock {
  return block.type === 'work' || block.type === 'rest';
}

/**
 * Validates block structure to prevent nested sections and ensure data integrity.
 * Returns error message if invalid, null if valid.
 */
export function validateBlockStructure(blocks: Block[]): string | null {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Check if block has required fields
    if (!block.id || !block.type || !block.title) {
      return `Block at index ${i} is missing required fields (id, type, or title)`;
    }

    if (isSectionBlock(block)) {
      // Validate section-specific fields
      if (typeof block.preparationTime !== 'number' || block.preparationTime < 0) {
        return `Section "${block.title}" has invalid preparation time`;
      }

      if (typeof block.loops !== 'number' || block.loops < 1) {
        return `Section "${block.title}" must have at least 1 loop`;
      }

      if (!Array.isArray(block.blocks)) {
        return `Section "${block.title}" has invalid blocks array`;
      }

      // Check for nested sections (not allowed)
      for (let j = 0; j < block.blocks.length; j++) {
        const childBlock = block.blocks[j];

        if (!childBlock.id || !childBlock.type || !childBlock.title) {
          return `Block at index ${j} in section "${block.title}" is missing required fields`;
        }

        // Runtime check for nested sections (validates data from IndexedDB which isn't type-checked)
        if ((childBlock as Block).type === 'section') {
          return `Section "${block.title}" contains a nested section "${(childBlock as Block).title}". Nested sections are not allowed.`;
        }

        // Validate duration for work/rest blocks
        if (typeof childBlock.duration !== 'number' || childBlock.duration <= 0) {
          return `Block "${childBlock.title}" in section "${block.title}" has invalid duration`;
        }
      }
    } else if (isBasicBlock(block)) {
      // Validate basic block fields
      if (typeof block.duration !== 'number' || block.duration <= 0) {
        return `Block "${block.title}" has invalid duration`;
      }
    } else {
      return `Block at index ${i} has invalid type`;
    }
  }

  return null;
}
