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

  it('shows the popup for blank input, or for any input when always visible is enabled', () => {
    const context = createPresetContext();

    expect(new vm.Script("inputPresetUtils.shouldShowPopup('  \\n', false)").runInContext(context)).toBe(true);
    expect(new vm.Script("inputPresetUtils.shouldShowPopup('入力済み', false)").runInContext(context)).toBe(false);
    expect(new vm.Script("inputPresetUtils.shouldShowPopup('入力済み', true)").runInContext(context)).toBe(true);
  });

  it('appends a preset without a cursor marker after the existing input', () => {
    const dispatchEvent = vi.fn();
    const setSelectionRange = vi.fn();
    const context = createPresetContext();
    Object.assign(context, {
      Event: class TestEvent {},
      textarea: { value: '入力済み', dispatchEvent, setSelectionRange },
    });

    new vm.Script("inputPresetUtils.insertPreset(textarea, 'プリセット')").runInContext(context);

    expect(context.textarea.value).toBe('入力済みプリセット');
    expect(setSelectionRange).toHaveBeenCalledWith(9, 9);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it('moves the existing input to the cursor marker in the preset', () => {
    const dispatchEvent = vi.fn();
    const setSelectionRange = vi.fn();
    const context = createPresetContext();
    Object.assign(context, {
      Event: class TestEvent {},
      textarea: { value: '入力済み', dispatchEvent, setSelectionRange },
    });

    new vm.Script("inputPresetUtils.insertPreset(textarea, '前文{|}後文')").runInContext(context);

    expect(context.textarea.value).toBe('前文入力済み後文');
    expect(setSelectionRange).toHaveBeenCalledWith(6, 6);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });
});
