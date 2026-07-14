import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readRuntime = (name: string): string =>
  fs.readFileSync(path.join(projectRoot, `.build/runtime/${name}.js`), 'utf8');

const createNavigationContext = () => {
  const context = vm.createContext({ appLogic: {} });
  new vm.Script(readRuntime('app-navigation-panels')).runInContext(context);
  return context;
};

describe('message navigation', () => {
  it('finds the previous input end above the viewport end', () => {
    const context = createNavigationContext();
    const target = new vm.Script(
      "appLogic.findAdjacentInputEnd([100, 240, 380], 392, 'up')",
    ).runInContext(context);

    expect(target).toBe(240);
  });

  it('finds the next input end below the viewport end', () => {
    const context = createNavigationContext();
    const target = new vm.Script(
      "appLogic.findAdjacentInputEnd([100, 240, 380], 228, 'down')",
    ).runInContext(context);

    expect(target).toBe(380);
  });

  it('returns null when no adjacent input exists', () => {
    const context = createNavigationContext();
    expect(
      new vm.Script("appLogic.findAdjacentInputEnd([100, 240], 270, 'down')").runInContext(context),
    ).toBeNull();
    expect(
      new vm.Script("appLogic.findAdjacentInputEnd([100, 240], 90, 'up')").runInContext(context),
    ).toBeNull();
  });
});
