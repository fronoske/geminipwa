import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'acorn';
import { readBaselineIndex, SPEC_BASELINE_COMMIT } from './spec-baseline.mjs';

const baselineHtml = readBaselineIndex(process.argv[2]);
const generatedHtml = fs.readFileSync(process.argv[3] ?? 'index.html', 'utf8');

const extractInlineScripts = (html) =>
  [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc=/i.test(match[1]))
    .map((match) => match[2]);

function collectTopLevelIifes(source) {
  const file = parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  return file.body
    .filter(
      (statement) =>
        statement.type === 'ExpressionStatement' &&
        statement.expression.type === 'CallExpression' &&
        (statement.expression.callee.type === 'FunctionExpression' ||
          statement.expression.callee.type === 'ArrowFunctionExpression'),
    )
    .map((statement) => canonicalizeFunctionBody(statement.expression.callee.body));
}

function canonicalizeAst(value, key = '') {
  if (Array.isArray(value)) return value.map((item) => canonicalizeAst(item));
  if (typeof value === 'string' && key === 'cooked') return value.replace(/\s+/g, ' ');
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([entryKey]) => !['start', 'end', 'loc', 'raw'].includes(entryKey))
      .map(([entryKey, entryValue]) => [entryKey, canonicalizeAst(entryValue, entryKey)]),
  );
}

const canonicalizeFunctionBody = (body) => JSON.stringify(canonicalizeAst(body));

function collectObjectFunctions(source, filename) {
  const file = parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const functions = new Map();

  const collectProperties = (rootName, objectLiteral) => {
    for (const property of objectLiteral.properties) {
      if (property.type !== 'Property') continue;
      const propertyName = property.computed
        ? source.slice(property.key.start, property.key.end)
        : String(property.key.name ?? property.key.value);
      const key = `${rootName}.${propertyName}`;
      if (
        (property.value.type === 'FunctionExpression' || property.value.type === 'ArrowFunctionExpression') &&
        property.value.body
      ) {
        functions.set(key, canonicalizeFunctionBody(property.value.body));
      }
    }
  };

  for (const statement of file.body) {
    if (statement.type === 'VariableDeclaration') {
      for (const declaration of statement.declarations) {
        if (declaration.id.type !== 'Identifier' || !declaration.init) continue;
        if (declaration.init.type === 'ObjectExpression') {
          collectProperties(declaration.id.name, declaration.init);
        } else if (
          (declaration.init.type === 'ArrowFunctionExpression' ||
            declaration.init.type === 'FunctionExpression') &&
          declaration.init.body
        ) {
          functions.set(
            declaration.id.name,
            canonicalizeFunctionBody(declaration.init.body),
          );
        }
      }
    } else if (statement.type === 'FunctionDeclaration' && statement.id && statement.body) {
      functions.set(statement.id.name, canonicalizeFunctionBody(statement.body));
    } else if (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'CallExpression' &&
      statement.expression.callee.type === 'MemberExpression' &&
      statement.expression.callee.object.type === 'Identifier' &&
      statement.expression.callee.object.name === 'Object' &&
      statement.expression.callee.property.type === 'Identifier' &&
      statement.expression.callee.property.name === 'assign'
    ) {
      const [target, sourceObject] = statement.expression.arguments;
      if (target?.type === 'Identifier' && sourceObject?.type === 'ObjectExpression') {
        collectProperties(target.name, sourceObject);
      }
    }
  }
  return functions;
}

function collectAllFunctionBodies(source) {
  const file = parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const bodies = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (
      (value.type === 'FunctionDeclaration' ||
        value.type === 'FunctionExpression' ||
        value.type === 'ArrowFunctionExpression') &&
      value.body
    ) {
      bodies.push(canonicalizeFunctionBody(value.body));
    }
    Object.entries(value)
      .filter(([key]) => !['start', 'end', 'loc'].includes(key))
      .forEach(([, child]) => visit(child));
  };
  visit(file);
  return bodies;
}

function subtractMultiset(left, right) {
  const remaining = [...right];
  return left.filter((item) => {
    const index = remaining.indexOf(item);
    if (index === -1) return true;
    remaining.splice(index, 1);
    return false;
  });
}

const baselineInlineScripts = extractInlineScripts(baselineHtml);
const generatedInlineScripts = extractInlineScripts(generatedHtml);
const baselineSource = baselineInlineScripts.slice(1).join('\n');
const generatedSource = generatedInlineScripts.slice(1).join('\n');
const baselineFunctions = collectObjectFunctions(baselineSource, 'baseline.js');
const generatedFunctions = collectObjectFunctions(generatedSource, 'generated.js');
const allNames = [...new Set([...baselineFunctions.keys(), ...generatedFunctions.keys()])].sort();
const missing = allNames.filter((name) => !generatedFunctions.has(name));
const added = allNames.filter((name) => !baselineFunctions.has(name));
const changed = allNames.filter(
  (name) =>
    baselineFunctions.has(name) &&
    generatedFunctions.has(name) &&
    baselineFunctions.get(name) !== generatedFunctions.get(name),
);
const unchanged = allNames.filter(
  (name) =>
    baselineFunctions.has(name) &&
    generatedFunctions.has(name) &&
    baselineFunctions.get(name) === generatedFunctions.get(name),
);
const baselineAllFunctions = collectAllFunctionBodies(baselineInlineScripts.join('\n'));
const generatedAllFunctions = collectAllFunctionBodies(generatedInlineScripts.join('\n'));
const missingFunctionBodies = subtractMultiset(baselineAllFunctions, generatedAllFunctions);
const addedFunctionBodies = subtractMultiset(generatedAllFunctions, baselineAllFunctions);

console.log(`Baseline functions: ${baselineFunctions.size}`);
console.log(`Generated functions: ${generatedFunctions.size}`);
console.log(`Unchanged: ${unchanged.length}`);
console.log(`Changed: ${changed.length}`);
changed.forEach((name) => {
  console.log(`  changed ${name}`);
});
console.log(`Missing: ${missing.length}`);
missing.forEach((name) => console.log(`  missing ${name}`));
console.log(`Added: ${added.length}`);
added.forEach((name) => console.log(`  added ${name}`));
console.log(
  `All function bodies: ${baselineAllFunctions.length} baseline / ${generatedAllFunctions.length} generated`,
);
console.log(
  `All function body differences: ${missingFunctionBodies.length} missing / ${addedFunctionBodies.length} added`,
);

assert.deepEqual(missing, [], 'Pre-migration runtime functions are missing');
assert.deepEqual(changed, [], 'Pre-migration runtime function behavior changed');
assert.deepEqual(added, ['getRequiredDomElement'], 'Unexpected runtime functions were added');
assert.equal(missingFunctionBodies.length, 0, 'Pre-migration anonymous or nested functions are missing');
assert.equal(addedFunctionBodies.length, 1, 'Unexpected anonymous or nested functions were added');
assert.deepEqual(
  collectTopLevelIifes(generatedInlineScripts[0]),
  collectTopLevelIifes(baselineInlineScripts[0]),
  'Recovery startup behavior changed',
);
assert.deepEqual(
  collectTopLevelIifes(generatedInlineScripts[1]),
  collectTopLevelIifes(baselineInlineScripts[2]),
  'Input preset behavior changed',
);
console.log(`Runtime AST equivalence audit passed against ${SPEC_BASELINE_COMMIT}`);
