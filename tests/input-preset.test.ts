import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readRuntime = (name: string): string =>
  fs.readFileSync(path.join(projectRoot, `.build/runtime/${name}.js`), 'utf8');

const createPresetContext = () => {
  const context = vm.createContext({});
  new vm.Script(readRuntime('input-preset')).runInContext(context);
  return context;
};

describe('input presets', () => {
  it('removes cursor markers and returns the first marker position across newlines', () => {
    const context = createPresetContext();
    const result = new vm.Script(
      "inputPresetUtils.parseTemplate('first\\n{|}second\\n{|}third')",
    ).runInContext(context);

    expect(result).toEqual({
      text: 'first\nsecond\nthird',
      cursorOffset: 'first\n'.length,
    });
  });

  it('places the cursor at the end when the marker is omitted', () => {
    const context = createPresetContext();
    const result = new vm.Script(
      "inputPresetUtils.parseTemplate('line 1\\nline 2')",
    ).runInContext(context);

    expect(result).toEqual({ text: 'line 1\nline 2', cursorOffset: 13 });
  });

  it('inserts multiline text at the current selection and moves the cursor', () => {
    const dispatchEvent = vi.fn();
    const setSelectionRange = vi.fn();
    const context = createPresetContext();
    Object.assign(context, {
      Event: class TestEvent {},
      textarea: {
        value: 'before-after',
        selectionStart: 7,
        selectionEnd: 7,
        dispatchEvent,
        setSelectionRange,
      },
    });

    new vm.Script(
      "inputPresetUtils.insertAtCursor(textarea, 'line 1\\nline 2', 7)",
    ).runInContext(context);

    expect(context.textarea.value).toBe('before-line 1\nline 2after');
    expect(setSelectionRange).toHaveBeenCalledWith(14, 14);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });
});
