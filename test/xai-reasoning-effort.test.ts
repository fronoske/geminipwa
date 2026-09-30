import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readSource = (name: string): string =>
  fs.readFileSync(path.join(projectRoot, 'src', name), 'utf8');

describe('xAI Reasoning Effort', () => {
  it('enables the selector only when the model and Include Thoughts allow the API parameter', () => {
    const elements = {
      xaiModelNameSelect: { value: 'grok-4-1-fast-reasoning' },
      xaiIncludeThoughtsToggle: { checked: false },
      xaiReasoningEffortSelect: { value: 'high', disabled: true },
    };
    const uiUtils = {} as { updateXaiReasoningEffortAvailability(): void };
    vm.runInNewContext(
      `${readSource('app-config.ts')}\n${readSource('ui-settings.ts')}`,
      { elements, uiUtils },
    );

    for (const model of ['grok-3-mini', 'grok-3-mini-fast']) {
      elements.xaiModelNameSelect.value = model;
      elements.xaiIncludeThoughtsToggle.checked = true;
      uiUtils.updateXaiReasoningEffortAvailability();
      expect(elements.xaiReasoningEffortSelect.disabled).toBe(false);
    }

    elements.xaiIncludeThoughtsToggle.checked = false;
    uiUtils.updateXaiReasoningEffortAvailability();
    expect(elements.xaiReasoningEffortSelect.disabled).toBe(true);

    elements.xaiIncludeThoughtsToggle.checked = true;
    elements.xaiModelNameSelect.value = 'grok-4-1-fast-reasoning';
    uiUtils.updateXaiReasoningEffortAvailability();
    expect(elements.xaiReasoningEffortSelect.disabled).toBe(true);
    expect(elements.xaiReasoningEffortSelect.value).toBe('high');
  });
});
