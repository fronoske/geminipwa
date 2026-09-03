#!/usr/bin/env node

import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const defaultSchemaPath = path.join(projectRoot, 'schemas', 'lorebook.schema.json');
const defaultModel = 'gpt-5.6-terra';
const defaultReasoningEffort = 'medium';
const defaultBaseUrl = 'https://api.openai.com/v1';
const defaultBatchSize = 3;
const defaultApiRetries = 4;
const defaultRetryBaseMs = 1_000;
const maxRetryDelayMs = 30_000;
const checkpointVersion = 1;
const reasoningEfforts = new Set(['none', 'low', 'medium', 'high', 'xhigh', 'max']);
const addressContexts = new Set(['spoken', 'innerThought', 'public', 'private']);
const genericAliases = new Set([
  '父', '母', '両親', '兄', '姉', '弟', '妹', '兄弟', '姉妹',
  'お父さん', 'お母さん', 'お兄ちゃん', 'お姉ちゃん',
  '先生', '教師', '担任', '教頭', '先輩', '後輩', '友人', '友達', '彼氏', '彼女', '相手',
]);
const characterEligibilityInstruction = `charactersには、原文で固有名または一意の固有呼称が明示された人物だけを含める。
「美咲の父」「兄」「先輩」「友人」「告白した人物」のように、親族関係、役職、説明だけで参照される無名人物をcharacter化してはならない。それらは該当人物の条件付き記憶のcontent内に保持する。
aliasesには同一人物を一意に指す実際の名前・愛称だけを含め、「父」「兄」「先生」「先輩」「お姉ちゃん」など他人にも該当する一般語を含めない。`;

const stringSchema = { type: 'string' };
const stringArraySchema = { type: 'array', items: stringSchema };
const nullableStringSchema = { anyOf: [stringSchema, { type: 'null' }] };
const strictObject = properties => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
const styleGuideOutputSchema = strictObject({
  narration: stringArraySchema,
  dialogue: stringArraySchema,
  formatting: stringArraySchema,
  avoid: stringArraySchema,
});
const characterOutputSchema = strictObject({
  id: stringSchema,
  name: stringSchema,
  aliases: stringArraySchema,
  core: stringSchema,
});
const addressFormOutputSchema = strictObject({
  context: { type: 'string', enum: [...addressContexts] },
  value: stringSchema,
});
const exactRuleOutputSchema = strictObject({
  speakerId: stringSchema,
  targetId: stringSchema,
  forms: { type: 'array', items: addressFormOutputSchema },
});
const fallbackRuleOutputSchema = strictObject({
  speakerId: stringSchema,
  targetDescription: stringSchema,
  context: { type: 'string', enum: [...addressContexts] },
  formTemplate: stringSchema,
});
const conditionalMemoryOutputSchema = strictObject({
  id: stringSchema,
  allCharacters: stringArraySchema,
  anyCharacters: stringArraySchema,
  keywords: stringArraySchema,
  priority: { type: 'integer' },
  content: stringSchema,
});
const planningOutputSchema = strictObject({
  characters: {
    type: 'array',
    items: strictObject({ id: stringSchema, name: stringSchema, aliases: stringArraySchema }),
  },
  memoryTopics: {
    type: 'array',
    items: strictObject({
      id: stringSchema,
      label: stringSchema,
      keywords: stringArraySchema,
      characterIds: stringArraySchema,
    }),
  },
});
const baseOutputSchema = strictObject({
  name: stringSchema,
  description: stringSchema,
  storyCore: stringSchema,
  styleGuide: styleGuideOutputSchema,
  addressingInstruction: stringSchema,
});
const charactersOutputSchema = strictObject({
  characters: { type: 'array', items: characterOutputSchema },
});
const addressingOutputSchema = strictObject({
  exactRules: { type: 'array', items: exactRuleOutputSchema },
  fallbackRules: { type: 'array', items: fallbackRuleOutputSchema },
});
const memoriesOutputSchema = strictObject({
  topicResults: {
    type: 'array',
    items: strictObject({
      topicId: stringSchema,
      memories: { type: 'array', items: conditionalMemoryOutputSchema },
    }),
  },
});
const characterCoverageOutputSchema = strictObject({
  characterId: stringSchema,
  additions: {
    type: 'array',
    items: strictObject({
      sourceExcerpt: stringSchema,
      destination: { type: 'string', enum: ['core', 'conditionalMemory'] },
      content: stringSchema,
      allCharacters: stringArraySchema,
      anyCharacters: stringArraySchema,
      keywords: stringArraySchema,
      priority: { type: 'integer' },
    }),
  },
});
const reviewReportOutputSchema = strictObject({
  warnings: stringArraySchema,
  unresolvedQuestions: stringArraySchema,
  sourceAddressingCount: { type: 'integer' },
  structuredAddressingCount: { type: 'integer' },
});
const correctionsOutputSchema = strictObject({
  name: nullableStringSchema,
  description: nullableStringSchema,
  storyCore: nullableStringSchema,
  styleGuide: { anyOf: [styleGuideOutputSchema, { type: 'null' }] },
  removeCharacterIds: stringArraySchema,
  characters: { type: 'array', items: characterOutputSchema },
  addressing: strictObject({
    instruction: nullableStringSchema,
    removeExactRules: {
      type: 'array',
      items: exactRuleOutputSchema,
    },
    exactRules: { type: 'array', items: exactRuleOutputSchema },
    removeFallbackRules: {
      type: 'array',
      items: fallbackRuleOutputSchema,
    },
    fallbackRules: { type: 'array', items: fallbackRuleOutputSchema },
  }),
  removeConditionalMemoryIds: stringArraySchema,
  conditionalMemories: { type: 'array', items: conditionalMemoryOutputSchema },
});
const auditOutputSchema = strictObject({
  reviewReport: reviewReportOutputSchema,
  corrections: correctionsOutputSchema,
});
const warningRepairOutputSchema = strictObject({
  issue: stringSchema,
  sourceExcerpt: stringSchema,
  storyCoreAddition: nullableStringSchema,
  styleGuideAdditions: styleGuideOutputSchema,
  coreAdditions: {
    type: 'array',
    items: strictObject({ characterId: stringSchema, content: stringSchema }),
  },
  addressing: strictObject({
    removeExactRules: {
      type: 'array',
      items: strictObject({ speakerId: stringSchema, targetId: stringSchema }),
    },
    exactRules: { type: 'array', items: exactRuleOutputSchema },
    removeFallbackRules: {
      type: 'array',
      items: strictObject({
        speakerId: stringSchema,
        targetDescription: stringSchema,
        context: { type: 'string', enum: [...addressContexts] },
      }),
    },
    fallbackRules: { type: 'array', items: fallbackRuleOutputSchema },
  }),
  removeConditionalMemoryIds: stringArraySchema,
  conditionalMemories: { type: 'array', items: conditionalMemoryOutputSchema },
});
const postAuditOutputSchema = strictObject({
  reviewReport: reviewReportOutputSchema,
  factualMemoryRepairs: {
    type: 'array',
    items: strictObject({
      memoryId: stringSchema,
      issue: stringSchema,
      sourceExcerpt: stringSchema,
      allCharacters: stringArraySchema,
      anyCharacters: stringArraySchema,
      keywords: stringArraySchema,
      priority: { type: 'integer' },
      content: stringSchema,
    }),
  },
  warningRepairs: { type: 'array', items: warningRepairOutputSchema },
  fatalErrors: stringArraySchema,
});

const responseFormat = (name, schema) => ({ name, schema });

function characterIsUnnamedReference(character) {
  const name = String(character?.name || '').trim();
  if (!name) return true;
  if (genericAliases.has(name) || /人物$|相手$/.test(name)) return true;
  return /の.*(?:父|母|両親|兄|姉|弟たち?|妹|友人|女友達|友達|先輩|後輩|先生|教師|相手)$/.test(name)
    || /(?:庇った|告白した|対立した|組みたい)人物?$/.test(name)
    || /(?:庇った|告白した|対立した|組みたい).*(?:後輩|先輩|相手)$/.test(name);
}

export function sanitizeCharacterAliases(aliases) {
  return [...new Set((Array.isArray(aliases) ? aliases : [])
    .map(String).map(alias => alias.trim())
    .filter(alias => alias && !genericAliases.has(alias)))];
}

export function validatePlanningGranularity(data) {
  if (!Array.isArray(data?.characters) || !Array.isArray(data?.memoryTopics)) {
    return 'charactersとmemoryTopicsの配列が必要です。';
  }
  const unnamedCharacter = data.characters.find(characterIsUnnamedReference);
  if (unnamedCharacter) {
    return `character「${unnamedCharacter.name}」は固有名のない人物参照です。該当人物の条件付き記憶へ移してください。`;
  }
  const characterIds = new Set(data.characters.map(character => character?.id));
  const invalidTopicReference = data.memoryTopics.find(topic => (
    !Array.isArray(topic?.characterIds)
    || topic.characterIds.some(characterId => !characterIds.has(characterId))
  ));
  if (invalidTopicReference) return `memoryTopic「${invalidTopicReference.label}」のcharacterIdsが不正です。`;
  return '';
}

function extractMarkdownSection(sourceText, headingPattern) {
  const lines = String(sourceText || '').split(/\r?\n/);
  let headingLevel = 0;
  const sectionLines = [];
  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      if (headingLevel > 0 && heading[1].length <= headingLevel) break;
      if (headingLevel === 0 && headingPattern.test(heading[2])) {
        headingLevel = heading[1].length;
      }
      continue;
    }
    if (headingLevel > 0) sectionLines.push(line);
  }
  return sectionLines.join('\n').trim();
}

export function extractCharacterSourceSection(sourceText, character) {
  const names = new Set([character?.name, ...(character?.aliases || [])]
    .map(value => String(value || '').trim()).filter(Boolean));
  const lines = String(sourceText || '').split(/\r?\n/);
  let startIndex = -1;
  let headingLevel = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[index]);
    if (!heading) continue;
    const headingName = heading[2].replace(/[（(].*$/, '').trim();
    if (names.has(headingName)) {
      startIndex = index;
      headingLevel = heading[1].length;
      break;
    }
  }
  if (startIndex < 0) return '';
  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const heading = /^(#{1,6})\s+/.exec(lines[index]);
    if (heading && heading[1].length <= headingLevel) {
      endIndex = index;
      break;
    }
  }
  return lines.slice(startIndex, endIndex).join('\n').trim();
}

function cleanStoryCoreSection(section) {
  return String(section || '').split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:[-*+] |\d+\.\s+)/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .join('\n');
}

export function extractExplicitStoryCoreFacts(sourceText) {
  return cleanStoryCoreSection(extractMarkdownSection(sourceText, /^舞台設定$/));
}

export function ensureExplicitStoryCoreFacts(storyCore, sourceText) {
  const core = String(storyCore || '').trim();
  const facts = extractExplicitStoryCoreFacts(sourceText).split('\n').filter(Boolean);
  const missingFacts = facts.filter(fact => !core.includes(fact));
  if (missingFacts.length === 0) return core;
  return [core, `原文の舞台設定:\n${missingFacts.join('\n')}`].filter(Boolean).join('\n');
}

export function isStyleGuideTopic(topic) {
  if (Array.isArray(topic?.characterIds) && topic.characterIds.length > 0) return false;
  const text = `${topic?.label || ''} ${(topic?.keywords || []).join(' ')}`;
  return /文体|スタイル|視点|描写方針|設定の直接描写|遠回しな表現|匂わせ|台詞の扱い|セリフの扱い|表記(?:・|と|／|\/)?出力|出力形式|出力末尾|末尾.*(?:台詞|セリフ)/.test(text);
}

export function isStyleGuideMemory(memory) {
  const content = String(memory?.content || '');
  return /(?:文体|語り口).*(?:にする|とする|心がける|用いる)/.test(content)
    || /(?:主人公|視点人物).*(?:心の中|内心).*ツッコミ.*(?:入れる|用いる)/.test(content)
    || /キャラクター設定.*(?:直接描写しない|直接提示しない|匂わせる|推測できる余地)/.test(content)
    || /ユーザー.*(?:台詞|セリフ).*(?:そのまま.*含めず|アレンジ)/.test(content)
    || /(?:出力|回答).*(?:最後|末尾).*(?:台詞|セリフ)/.test(content);
}

export function validateBaseExtraction(data, { sourceText = '' } = {}) {
  const storyCore = String(data?.storyCore || '').trim();
  if (!storyCore) return 'storyCoreが必要です。';
  if (/制服|ブラウス|リボンタイ|スカート|ソックス|ワイシャツ|ネクタイ|スラックス|セーラー服|スカーフ|詰め襟/.test(storyCore)) {
    return 'storyCoreに制服・服装の詳細を含めてはいけません。条件付き記憶へ分類してください。';
  }
  const missingFacts = extractExplicitStoryCoreFacts(sourceText).split('\n')
    .filter(fact => fact && !storyCore.includes(fact));
  if (missingFacts.length > 0) {
    return `storyCoreに原文の舞台設定が不足しています: ${missingFacts.join(' / ')}`;
  }
  const styleGuide = data?.styleGuide || {};
  const styleSection = extractMarkdownSection(sourceText, /文体.*スタイル|スタイル.*文体/);
  const styleRules = [...(styleGuide.narration || []), ...(styleGuide.dialogue || []), ...(styleGuide.avoid || [])];
  if (styleSection && styleRules.length === 0) {
    return '原文の文体・スタイル規則をstyleGuideへ抽出してください。';
  }
  const formattingSection = extractMarkdownSection(sourceText, /表記.*出力形式|出力形式.*表記/);
  if (formattingSection && !(styleGuide.formatting || []).length) {
    return '原文の表記・出力形式規則をstyleGuide.formattingへ抽出してください。';
  }
  return '';
}

const usage = `Usage:
  npm run lorebook:json -- <source.txt> [output.json] [options]
  node scripts/lorebook-json-cli.mjs <source.txt> [output.json] [options]
  node scripts/lorebook-json-cli.mjs --validate-only <lorebook.json>

Options:
  --model <id>           OpenAI model (default: ${defaultModel})
  --reasoning-effort <level>
                         Reasoning effort: none, low, medium, high, xhigh, or max
                         (default: ${defaultReasoningEffort})
  --id <id>              Final Lorebook ID (default: generated from name or filename)
  --source-label <text>  analysis.sourceLabel (default: input filename)
  --base-url <url>       Responses API base URL (default: ${defaultBaseUrl})
  --max-repairs <count>  Validation repair attempts (default: 2)
  --max-warning-repairs <count>
                         Grounded warning repair rounds (default: 1)
  --api-retries <count>  Transient API retries (default: ${defaultApiRetries})
  --timeout-ms <ms>      Timeout for each API request (default: 600000)
  --no-resume            Ignore an existing checkpoint and start a fresh run
  --validate-only        Validate an existing Lorebook without calling the API
  -h, --help             Show this help

Environment:
  OPENAI_API_KEY         Required unless --validate-only is used`;

function parsePositiveInteger(value, optionName, { allowZero = false } = {}) {
  const parsed = Number.parseInt(value, 10);
  const minimum = allowZero ? 0 : 1;
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`${optionName} must be an integer greater than or equal to ${minimum}.`);
  }
  return parsed;
}

export function parseArgs(argv) {
  const options = {
    model: defaultModel,
    reasoningEffort: defaultReasoningEffort,
    baseUrl: defaultBaseUrl,
    maxRepairs: 2,
    maxWarningRepairs: 1,
    apiRetries: defaultApiRetries,
    timeoutMs: 600_000,
    resume: true,
    validateOnly: false,
    help: false,
    id: '',
    sourceLabel: '',
    positionals: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '-h' || argument === '--help') {
      options.help = true;
    } else if (argument === '--validate-only') {
      options.validateOnly = true;
    } else if (argument === '--no-resume') {
      options.resume = false;
    } else if (['--model', '--reasoning-effort', '--id', '--source-label', '--base-url', '--max-repairs', '--max-warning-repairs', '--api-retries', '--timeout-ms'].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value.`);
      index += 1;
      if (argument === '--model') options.model = value;
      if (argument === '--reasoning-effort') options.reasoningEffort = value;
      if (argument === '--id') options.id = value;
      if (argument === '--source-label') options.sourceLabel = value;
      if (argument === '--base-url') options.baseUrl = value;
      if (argument === '--max-repairs') options.maxRepairs = parsePositiveInteger(value, argument, { allowZero: true });
      if (argument === '--max-warning-repairs') options.maxWarningRepairs = parsePositiveInteger(value, argument, { allowZero: true });
      if (argument === '--api-retries') options.apiRetries = parsePositiveInteger(value, argument, { allowZero: true });
      if (argument === '--timeout-ms') options.timeoutMs = parsePositiveInteger(value, argument);
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      options.positionals.push(argument);
    }
  }

  if (options.reasoningEffort && !reasoningEfforts.has(options.reasoningEffort)) {
    throw new Error('--reasoning-effort must be one of: none, low, medium, high, xhigh, max.');
  }

  return options;
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function loadLorebookRuntime() {
  const [configSource, managerSource] = await Promise.all([
    fs.readFile(path.join(projectRoot, 'src', 'app-config.ts'), 'utf8'),
    fs.readFile(path.join(projectRoot, 'src', 'lorebook-manager.ts'), 'utf8'),
  ]);
  const context = vm.createContext({});
  const exposeRuntime = `
globalThis.__lorebookCliRuntime = {
  manager: lorebookManager,
  schemaVersion: LOREBOOK_SCHEMA_VERSION,
  analysisMethodVersion: LOREBOOK_ANALYSIS_METHOD_VERSION,
  sourceMaxCharacters: LOREBOOK_SOURCE_MAX_CHARACTERS,
  defaultRetrieval: DEFAULT_LOREBOOK_RETRIEVAL
};`;
  new vm.Script(`${configSource}\n${managerSource}\n${exposeRuntime}`, {
    filename: 'geminipwa-lorebook-runtime.js',
  }).runInContext(context);
  return context.__lorebookCliRuntime;
}

function resolveSchemaReference(rootSchema, reference) {
  if (!reference.startsWith('#/')) throw new Error(`External JSON Schema reference is not supported: ${reference}`);
  return reference.slice(2).split('/').reduce((value, key) => value?.[key], rootSchema);
}

export function validateJsonSchema(value, rootSchema) {
  const errors = [];
  const visit = (currentValue, schema, valuePath) => {
    if (!schema || typeof schema !== 'object') return;
    if (schema.$ref) {
      visit(currentValue, resolveSchemaReference(rootSchema, schema.$ref), valuePath);
      return;
    }
    if (schema.const !== undefined && currentValue !== schema.const) {
      errors.push(`${valuePath}: ${JSON.stringify(schema.const)} と一致する必要があります。`);
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(currentValue)) {
      errors.push(`${valuePath}: 許可値は ${schema.enum.join(', ')} です。`);
    }

    if (schema.type) {
      const matchesType = schema.type === 'object'
        ? currentValue !== null && typeof currentValue === 'object' && !Array.isArray(currentValue)
        : schema.type === 'array'
          ? Array.isArray(currentValue)
          : schema.type === 'integer'
            ? Number.isInteger(currentValue)
            : typeof currentValue === schema.type;
      if (!matchesType) {
        errors.push(`${valuePath}: ${schema.type} である必要があります。`);
        return;
      }
    }

    if (typeof currentValue === 'string') {
      if (schema.minLength !== undefined && currentValue.length < schema.minLength) {
        errors.push(`${valuePath}: ${schema.minLength}文字以上である必要があります。`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(currentValue)) {
        errors.push(`${valuePath}: パターン ${schema.pattern} に一致しません。`);
      }
    }
    if (typeof currentValue === 'number') {
      if (schema.minimum !== undefined && currentValue < schema.minimum) {
        errors.push(`${valuePath}: ${schema.minimum}以上である必要があります。`);
      }
      if (schema.maximum !== undefined && currentValue > schema.maximum) {
        errors.push(`${valuePath}: ${schema.maximum}以下である必要があります。`);
      }
    }
    if (Array.isArray(currentValue)) {
      if (schema.minItems !== undefined && currentValue.length < schema.minItems) {
        errors.push(`${valuePath}: ${schema.minItems}件以上必要です。`);
      }
      if (schema.uniqueItems) {
        const serialized = currentValue.map(item => JSON.stringify(item));
        if (new Set(serialized).size !== serialized.length) errors.push(`${valuePath}: 重複項目があります。`);
      }
      if (schema.items) currentValue.forEach((item, index) => visit(item, schema.items, `${valuePath}[${index}]`));
    }
    if (currentValue !== null && typeof currentValue === 'object' && !Array.isArray(currentValue)) {
      for (const requiredKey of schema.required || []) {
        if (!(requiredKey in currentValue)) errors.push(`${valuePath}.${requiredKey}: 必須項目です。`);
      }
      if (schema.additionalProperties === false && schema.properties) {
        for (const key of Object.keys(currentValue)) {
          if (!(key in schema.properties)) errors.push(`${valuePath}.${key}: 許可されていない項目です。`);
        }
      }
      for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
        if (key in currentValue) visit(currentValue[key], propertySchema, `${valuePath}.${key}`);
      }
    }
  };
  visit(value, rootSchema, '$');
  return errors;
}

export function validateReferences(lorebook) {
  const errors = [];
  const characterIds = new Set((lorebook.characters || []).map(character => character?.id));
  const addressingKeys = new Map();

  (lorebook.addressing?.exactRules || []).forEach((rule, ruleIndex) => {
    if (!characterIds.has(rule?.speakerId)) errors.push(`exactRules[${ruleIndex}].speakerId の参照先がありません。`);
    if (!characterIds.has(rule?.targetId)) errors.push(`exactRules[${ruleIndex}].targetId の参照先がありません。`);
    (rule?.forms || []).forEach((form, formIndex) => {
      const key = `${rule?.speakerId}|${rule?.targetId}|${form?.context}`;
      if (addressingKeys.has(key)) {
        const previous = addressingKeys.get(key);
        errors.push(`exactRules[${ruleIndex}].forms[${formIndex}] は ${previous === form?.value ? '重複' : '衝突'}しています: ${key}`);
      }
      addressingKeys.set(key, form?.value);
    });
  });
  (lorebook.addressing?.fallbackRules || []).forEach((rule, index) => {
    if (!characterIds.has(rule?.speakerId)) errors.push(`fallbackRules[${index}].speakerId の参照先がありません。`);
  });
  (lorebook.conditionalMemories || []).forEach((memory, memoryIndex) => {
    for (const key of ['allCharacters', 'anyCharacters']) {
      for (const characterId of memory?.[key] || []) {
        if (!characterIds.has(characterId)) {
          errors.push(`conditionalMemories[${memoryIndex}].${key} の参照先 ${characterId} がありません。`);
        }
      }
    }
  });
  return errors;
}

export function collectValidationErrors(lorebook, schema, manager) {
  const schemaErrors = validateJsonSchema(lorebook, schema).map(error => `[JSON Schema] ${error}`);
  const implementationErrors = toPlain(manager.validateLorebook(lorebook))
    .map(error => `[実装バリデーター] ${error}`);
  const referenceErrors = validateReferences(lorebook).map(error => `[参照整合性] ${error}`);
  return [...new Set([...schemaErrors, ...implementationErrors, ...referenceErrors])];
}

function coerceAddressContext(context) {
  if (addressContexts.has(context)) return context;
  const normalized = String(context || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (/innerthought|thought|internal|monologue|心の中|内心|心内|独白/.test(normalized)) return 'innerThought';
  if (/private|二人きり|ふたりきり|非公開|親しい|個人/.test(normalized)) return 'private';
  if (/public|人前|公の場|公開|クラス内|教室内/.test(normalized)) return 'public';
  if (/spoken|speech|dialogue|conversation|発話|会話|通常/.test(normalized)) return 'spoken';
  return 'spoken';
}

export function normalizeAddressContexts(lorebook) {
  const normalized = toPlain(lorebook);
  let changes = 0;

  for (const rule of normalized.addressing?.exactRules || []) {
    if (!Array.isArray(rule?.forms)) continue;
    const formsByContext = new Map();
    for (const form of rule.forms) {
      const context = coerceAddressContext(form?.context);
      if (context !== form?.context) changes += 1;
      const normalizedForm = { ...form, context };
      if (!formsByContext.has(context) || addressContexts.has(form?.context)) {
        if (formsByContext.has(context)) changes += 1;
        formsByContext.set(context, normalizedForm);
      } else {
        changes += 1;
      }
    }
    rule.forms = [...formsByContext.values()];
  }

  for (const rule of normalized.addressing?.fallbackRules || []) {
    if (!rule || typeof rule !== 'object') continue;
    const context = coerceAddressContext(rule?.context);
    if (context !== rule?.context) changes += 1;
    rule.context = context;
  }

  return { lorebook: normalized, changes };
}

function normalizedCharacterCondition(memory) {
  const normalizeIds = value => [...new Set(Array.isArray(value) ? value.map(String) : [])].sort();
  return JSON.stringify({
    allCharacters: normalizeIds(memory?.allCharacters),
    anyCharacters: normalizeIds(memory?.anyCharacters),
  });
}

function memoryPriority(memory) {
  return Number.isFinite(memory?.priority) ? memory.priority : 0;
}

function deduplicateConditionalMemoryList(memories) {
  const result = [];
  let changes = 0;
  for (const memory of memories) {
    const normalizedMemory = toPlain(memory);
    for (const key of ['allCharacters', 'anyCharacters', 'keywords']) {
      const values = [...new Set((Array.isArray(normalizedMemory[key]) ? normalizedMemory[key] : [])
        .map(String).map(value => value.trim()).filter(Boolean))];
      if (values.length > 0) normalizedMemory[key] = values;
      else delete normalizedMemory[key];
    }
    const condition = normalizedCharacterCondition(normalizedMemory);
    const duplicate = result.find(candidate => (
      normalizedCharacterCondition(candidate) === condition
      && String(candidate?.content || '').trim() === String(normalizedMemory?.content || '').trim()
    ));
    if (!duplicate) {
      result.push(normalizedMemory);
      continue;
    }
    const keywords = [...new Set([...(duplicate.keywords || []), ...(normalizedMemory?.keywords || [])]
      .map(String).map(keyword => keyword.trim()).filter(Boolean))];
    if (keywords.length > 0) duplicate.keywords = keywords;
    duplicate.priority = Math.max(memoryPriority(duplicate), memoryPriority(normalizedMemory));
    changes += 1;
  }
  return { memories: result, changes };
}

export function normalizeConditionalMemories(lorebook) {
  const normalized = toPlain(lorebook);
  const original = Array.isArray(normalized.conditionalMemories) ? normalized.conditionalMemories : [];
  const deduplicated = deduplicateConditionalMemoryList(original);
  normalized.conditionalMemories = deduplicated.memories;
  return {
    lorebook: normalized,
    changes: deduplicated.changes,
  };
}

function textAlreadyContains(existingText, addition) {
  const normalize = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const existing = normalize(existingText);
  const added = normalize(addition);
  return !added || existing.includes(added);
}

function normalizeSourceEvidence(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line
      .replace(/^\s{0,3}(?:#{1,6}|>|[-+])\s*/, '')
      .replace(/[*_`]/g, '')
      .trim())
    .join('')
    .replace(/\s+/g, '');
}

export function filterCharacterCoverageAdditions(sourceSection, additions) {
  const source = String(sourceSection || '');
  const accepted = [];
  const rejected = [];
  for (const addition of Array.isArray(additions) ? additions : []) {
    const excerpt = String(addition?.sourceExcerpt || '').trim();
    (sourceContainsExcerpt(source, excerpt) ? accepted : rejected).push(addition);
  }
  return { additions: accepted, rejected };
}

export function sourceContainsExcerpt(sourceText, sourceExcerpt) {
  const source = String(sourceText || '');
  const excerpt = String(sourceExcerpt || '').trim();
  if (!excerpt) return false;
  if (source.includes(excerpt)) return true;
  const normalizedSource = normalizeSourceEvidence(source);
  const normalizedExcerpt = normalizeSourceEvidence(excerpt);
  return normalizedExcerpt.length >= 4 && normalizedSource.includes(normalizedExcerpt);
}

export function applyGroundedMemoryRepairs(candidateLorebook, sourceText, repairs) {
  const candidate = toPlain(candidateLorebook);
  const memories = Array.isArray(candidate.conditionalMemories) ? candidate.conditionalMemories : [];
  const knownCharacterIds = new Set((candidate.characters || []).map(character => character.id));
  let applied = 0;
  const rejected = [];

  for (const repair of Array.isArray(repairs) ? repairs : []) {
    const memoryId = String(repair?.memoryId || '').trim();
    const memoryIndex = memories.findIndex(memory => memory.id === memoryId);
    const referencedIds = [...(repair?.allCharacters || []), ...(repair?.anyCharacters || [])];
    const content = String(repair?.content || '').trim();
    const original = memoryIndex >= 0 ? memories[memoryIndex] : null;
    const originalHasTrigger = Boolean(
      (original?.allCharacters || []).length
      || (original?.anyCharacters || []).length
      || (original?.keywords || []).length
    );
    const replacementHasTrigger = Boolean(
      referencedIds.length || (repair?.keywords || []).length
    );
    const valid = original
      && sourceContainsExcerpt(sourceText, repair?.sourceExcerpt)
      && content
      && Number.isInteger(repair?.priority)
      && repair.priority >= 0
      && repair.priority <= 100
      && referencedIds.every(characterId => knownCharacterIds.has(characterId))
      && (!originalHasTrigger || replacementHasTrigger);
    if (!valid) {
      rejected.push(memoryId || '(IDなし)');
      continue;
    }
    const replacement = normalizeConditionalMemories({
      conditionalMemories: [{
        id: memoryId,
        allCharacters: repair.allCharacters,
        anyCharacters: repair.anyCharacters,
        keywords: repair.keywords,
        priority: repair.priority,
        content,
      }],
    }).lorebook.conditionalMemories[0];
    memories[memoryIndex] = replacement;
    applied += 1;
  }
  candidate.conditionalMemories = memories;
  return { candidate, applied, rejected };
}

export function applyGroundedWarningRepairs(candidateLorebook, sourceText, repairs) {
  const candidate = toPlain(candidateLorebook);
  const knownCharacterIds = new Set((candidate.characters || []).map(character => character.id));
  let applied = 0;
  let operations = 0;
  const rejected = [];

  for (const repair of Array.isArray(repairs) ? repairs : []) {
    const issue = String(repair?.issue || '').trim();
    const addressing = repair?.addressing || {};
    const removeExactRules = Array.isArray(addressing.removeExactRules) ? addressing.removeExactRules : [];
    const exactRules = Array.isArray(addressing.exactRules) ? addressing.exactRules : [];
    const removeFallbackRules = Array.isArray(addressing.removeFallbackRules) ? addressing.removeFallbackRules : [];
    const fallbackRules = Array.isArray(addressing.fallbackRules) ? addressing.fallbackRules : [];
    const coreAdditions = Array.isArray(repair?.coreAdditions) ? repair.coreAdditions : [];
    const removeMemoryIds = Array.isArray(repair?.removeConditionalMemoryIds)
      ? repair.removeConditionalMemoryIds.map(String)
      : [];
    const conditionalMemories = Array.isArray(repair?.conditionalMemories) ? repair.conditionalMemories : [];
    const styleGuideAdditions = repair?.styleGuideAdditions || {};
    const storyCoreAddition = String(repair?.storyCoreAddition || '').trim();
    const styleOperations = ['narration', 'dialogue', 'formatting', 'avoid']
      .reduce((total, key) => total + (Array.isArray(styleGuideAdditions[key]) ? styleGuideAdditions[key].length : 0), 0);
    const operationCount = Number(Boolean(storyCoreAddition)) + styleOperations + coreAdditions.length
      + removeExactRules.length + exactRules.length + removeFallbackRules.length + fallbackRules.length
      + removeMemoryIds.length + conditionalMemories.length;
    const exactRuleSelectorKey = rule => JSON.stringify({
      speakerId: String(rule?.speakerId || '').trim(),
      targetId: String(rule?.targetId || '').trim(),
    });
    const fallbackRuleSelectorKey = rule => JSON.stringify({
      speakerId: String(rule?.speakerId || '').trim(),
      targetDescription: String(rule?.targetDescription || '').trim(),
      context: String(rule?.context || '').trim(),
    });
    const countBySelector = (rules, selectorKey) => rules.reduce((counts, rule) => {
      const key = selectorKey(rule);
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map());
    const exactRemovalSelectorKeys = removeExactRules.map(exactRuleSelectorKey);
    const fallbackRemovalSelectorKeys = removeFallbackRules.map(fallbackRuleSelectorKey);
    const existingExactRuleCounts = countBySelector(
      candidate.addressing?.exactRules || [],
      exactRuleSelectorKey,
    );
    const existingFallbackRuleCounts = countBySelector(
      candidate.addressing?.fallbackRules || [],
      fallbackRuleSelectorKey,
    );
    const exactRemovalsExist = new Set(exactRemovalSelectorKeys).size === exactRemovalSelectorKeys.length
      && exactRemovalSelectorKeys.every(key => existingExactRuleCounts.get(key) === 1);
    const fallbackRemovalsExist = new Set(fallbackRemovalSelectorKeys).size === fallbackRemovalSelectorKeys.length
      && fallbackRemovalSelectorKeys.every(key => existingFallbackRuleCounts.get(key) === 1);
    const pairedFallbackRemovals = removeFallbackRules.every(removal => fallbackRules.some(rule => (
      fallbackRuleSelectorKey(rule) === fallbackRuleSelectorKey(removal)
    )));
    const pairedMemoryRemovals = removeMemoryIds.every(memoryId => (
      conditionalMemories.some(memory => memory.id === memoryId)
    ));
    const coreAdditionsValid = coreAdditions.every(addition => (
      String(addition?.content || '').trim()
    ));
    const conditionalMemoriesValid = conditionalMemories.every(memory => {
      const memoryReferencedIds = [...(memory?.allCharacters || []), ...(memory?.anyCharacters || [])];
      return String(memory?.content || '').trim()
        && (memoryReferencedIds.length > 0 || (memory?.keywords || []).length > 0)
        && Number.isInteger(memory?.priority)
        && memory.priority >= 0
        && memory.priority <= 100;
    });
    const referencedIds = [
      ...coreAdditions.map(addition => addition.characterId),
      ...exactRules.flatMap(rule => [rule.speakerId, rule.targetId]),
      ...fallbackRules.map(rule => rule.speakerId),
      ...conditionalMemories.flatMap(memory => [
        ...(memory.allCharacters || []),
        ...(memory.anyCharacters || []),
      ]),
    ];
    const valid = issue
      && sourceContainsExcerpt(sourceText, repair?.sourceExcerpt)
      && operationCount > 0
      && exactRemovalsExist
      && fallbackRemovalsExist
      && pairedFallbackRemovals
      && pairedMemoryRemovals
      && coreAdditionsValid
      && conditionalMemoriesValid
      && referencedIds.every(characterId => knownCharacterIds.has(characterId));
    if (!valid) {
      rejected.push(issue || '(issueなし)');
      continue;
    }

    if (storyCoreAddition && !textAlreadyContains(candidate.storyCore, storyCoreAddition)) {
      candidate.storyCore = [String(candidate.storyCore || '').trim(), storyCoreAddition].filter(Boolean).join(' ');
    }
    candidate.styleGuide ||= { narration: [], dialogue: [], formatting: [], avoid: [] };
    for (const key of ['narration', 'dialogue', 'formatting', 'avoid']) {
      candidate.styleGuide[key] = [...new Set([
        ...(candidate.styleGuide[key] || []),
        ...(styleGuideAdditions[key] || []).map(String).map(value => value.trim()).filter(Boolean),
      ])];
    }
    for (const addition of coreAdditions) {
      const character = candidate.characters.find(item => item.id === addition.characterId);
      const content = String(addition.content || '').trim();
      if (character && content && !textAlreadyContains(character.core, content)) {
        character.core = [String(character.core || '').trim(), content].filter(Boolean).join('\n');
      }
    }

    candidate.addressing ||= { instruction: '', exactRules: [], fallbackRules: [] };
    const exactRemovalKeys = new Set(exactRemovalSelectorKeys);
    candidate.addressing.exactRules = (candidate.addressing.exactRules || []).filter(rule => (
      !exactRemovalKeys.has(exactRuleSelectorKey(rule))
    ));
    candidate.addressing.exactRules.push(...toPlain(exactRules));
    const fallbackRemovalKeys = new Set(fallbackRemovalSelectorKeys);
    candidate.addressing.fallbackRules = (candidate.addressing.fallbackRules || []).filter(rule => (
      !fallbackRemovalKeys.has(fallbackRuleSelectorKey(rule))
    ));
    candidate.addressing.fallbackRules.push(...toPlain(fallbackRules));

    candidate.conditionalMemories = (candidate.conditionalMemories || [])
      .filter(memory => !removeMemoryIds.includes(memory.id));
    candidate.conditionalMemories.push(...toPlain(conditionalMemories));
    applied += 1;
    operations += operationCount;
  }

  return { candidate, applied, operations, rejected };
}

export function applyCharacterCoverageAdditions(candidateLorebook, characterId, additions) {
  const candidate = toPlain(candidateLorebook);
  const character = (candidate.characters || []).find(item => item.id === characterId);
  if (!character) throw new Error(`網羅性監査の対象人物が見つかりません: ${characterId}`);
  if (!Array.isArray(candidate.conditionalMemories)) candidate.conditionalMemories = [];
  const existingMemoryIds = new Set((candidate.conditionalMemories || []).map(memory => memory.id));
  let coreAdditions = 0;
  let memoryAdditions = 0;

  for (const addition of Array.isArray(additions) ? additions : []) {
    const content = String(addition?.content || '').trim();
    if (!content) continue;
    if (addition.destination === 'core') {
      if (textAlreadyContains(character.core, content)) continue;
      character.core = [String(character.core || '').trim(), content].filter(Boolean).join('\n');
      coreAdditions += 1;
      continue;
    }
    if (addition.destination !== 'conditionalMemory') continue;
    const existingMemoryText = (candidate.conditionalMemories || []).map(memory => memory.content).join('\n');
    if (textAlreadyContains(existingMemoryText, content)) continue;
    let sequence = memoryAdditions + 1;
    let id = `coverage-${characterId}-${sequence}`;
    while (existingMemoryIds.has(id)) {
      sequence += 1;
      id = `coverage-${characterId}-${sequence}`;
    }
    existingMemoryIds.add(id);
    const normalized = normalizeConditionalMemories({
      conditionalMemories: [{
        id,
        allCharacters: addition.allCharacters,
        anyCharacters: addition.anyCharacters,
        keywords: addition.keywords,
        priority: addition.priority,
        content,
      }],
    }).lorebook.conditionalMemories[0];
    candidate.conditionalMemories.push(normalized);
    memoryAdditions += 1;
  }

  return { candidate, coreAdditions, memoryAdditions };
}

export function parseModelJson(text) {
  const trimmed = String(text || '').trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('モデル応答にJSONオブジェクトがありません。');
  return JSON.parse(trimmed.slice(start, end + 1));
}

export function extractResponseText(response) {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) return response.output_text;
  const fragments = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') fragments.push(content.text);
      if (content?.type === 'refusal' && typeof content.refusal === 'string') {
        throw new Error(`モデルが応答を拒否しました: ${content.refusal}`);
      }
    }
  }
  if (fragments.length === 0) throw new Error('Responses APIの応答にテキストがありません。');
  return fragments.join('');
}

function hashValue(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

export function createCheckpointPath(outputPath) {
  const parsed = path.parse(outputPath);
  return path.join(parsed.dir, `${parsed.name}.checkpoint.json`);
}

export async function createCheckpointStore({ filePath, metadata, resume = true, log = () => {} }) {
  let responses = {};
  if (resume) {
    try {
      const saved = JSON.parse(await fs.readFile(filePath, 'utf8'));
      if (saved?.version === checkpointVersion
        && hashValue(saved.metadata) === hashValue(metadata)
        && saved.responses && typeof saved.responses === 'object') {
        responses = saved.responses;
        log(`チェックポイント再開: 検証済みAPI応答${Object.keys(responses).length}件`);
      } else {
        log('既存チェックポイントは実行条件が異なるため使用しません。');
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') log('既存チェックポイントを読み込めないため新規作成します。');
    }
  }

  const persist = async () => writeJsonAtomically(filePath, {
    version: checkpointVersion,
    metadata,
    responses,
  });
  if (!resume) await persist();

  return {
    createKey(request) {
      return hashValue(request);
    },
    get(key) {
      return responses[key] ? toPlain(responses[key]) : undefined;
    },
    async delete(key) {
      if (!responses[key]) return;
      delete responses[key];
      await persist();
    },
    async put(key, value) {
      responses[key] = toPlain(value);
      await persist();
    },
    size() {
      return Object.keys(responses).length;
    },
  };
}

function parseRetryAfter(value, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1_000);
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now) : 0;
}

function isRetryableApiError(error) {
  if (error?.retryable === true) return true;
  return ['AbortError', 'TimeoutError'].includes(error?.name)
    || (error instanceof TypeError && !Number.isInteger(error?.status));
}

function formatRetryReason(error) {
  const message = String(error?.message || '一時的なAPIエラー')
    .replace(/^Responses APIエラー:\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return message.length > 160 ? `${message.slice(0, 157)}...` : message;
}

function addResponseUsage(total, usage) {
  if (!usage || typeof usage !== 'object') return;
  total.inputTokens += Number(usage.input_tokens) || 0;
  total.outputTokens += Number(usage.output_tokens) || 0;
  total.reasoningTokens += Number(usage.output_tokens_details?.reasoning_tokens) || 0;
  total.totalTokens += Number(usage.total_tokens) || 0;
}

export function formatApiUsage(usage) {
  return `API要求${usage.requests}回（再試行${usage.retries}回）、` +
    `input ${usage.inputTokens}、output ${usage.outputTokens}` +
    `${usage.reasoningTokens ? `（reasoning ${usage.reasoningTokens}）` : ''}、total ${usage.totalTokens} tokens`;
}

export function createOpenAIClient({
  apiKey,
  model,
  reasoningEffort,
  baseUrl,
  timeoutMs,
  maxApiRetries = defaultApiRetries,
  retryBaseMs = defaultRetryBaseMs,
  fetchImplementation = fetch,
  sleepImplementation = delay => new Promise(resolve => setTimeout(resolve, delay)),
  randomImplementation = Math.random,
  onRetry = () => {},
}) {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/responses`;
  const usage = {
    requests: 0,
    retries: 0,
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
  };
  const client = async ({ instructions, input, maxOutputTokens, outputFormat }) => {
    for (let apiAttempt = 0; apiAttempt <= maxApiRetries; apiAttempt += 1) {
      usage.requests += 1;
      try {
        const response = await fetchImplementation(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
            ...(outputFormat ? {
              text: {
                format: {
                  type: 'json_schema',
                  name: outputFormat.name,
                  strict: true,
                  schema: outputFormat.schema,
                },
              },
            } : {}),
            instructions,
            input,
            max_output_tokens: maxOutputTokens,
            store: false,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          const error = new Error(`Responses APIがJSON以外を返しました（HTTP ${response.status}）。`);
          error.code = 'API_ERROR';
          error.status = response.status;
          error.retryable = response.status === 429 || response.status >= 500;
          error.retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
          throw error;
        }
        if (!response.ok) {
          const message = data?.error?.message || `HTTP ${response.status}`;
          const error = new Error(`Responses APIエラー: ${message}`);
          error.code = 'API_ERROR';
          error.status = response.status;
          error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
          error.retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
          throw error;
        }
        if (data.status === 'incomplete') {
          const reason = data.incomplete_details?.reason || 'unknown';
          const error = new Error(`モデル応答が未完了です: ${reason}`);
          error.code = 'INCOMPLETE_RESPONSE';
          throw error;
        }
        addResponseUsage(usage, data.usage);
        return { data, text: extractResponseText(data) };
      } catch (error) {
        if (!isRetryableApiError(error) || apiAttempt >= maxApiRetries) {
          if (isRetryableApiError(error)) error.code = 'TRANSIENT_API_ERROR';
          throw error;
        }
        usage.retries += 1;
        const exponentialDelay = Math.min(maxRetryDelayMs, retryBaseMs * (2 ** apiAttempt));
        const jitteredDelay = Math.round(exponentialDelay * (0.75 + randomImplementation() * 0.5));
        const delay = Math.max(Number(error?.retryAfterMs) || 0, jitteredDelay);
        onRetry({
          attempt: apiAttempt + 1,
          maxRetries: maxApiRetries,
          delay,
          reason: formatRetryReason(error),
        });
        await sleepImplementation(delay);
      }
    }
    throw new Error('Responses APIの再試行処理が予期せず終了しました。');
  };
  client.getUsage = () => ({ ...usage });
  return client;
}

export async function requestAnalysisJson({
  stage,
  systemPrompt,
  payload,
  maxOutputTokens,
  outputFormat,
  validate,
  client,
  checkpointStore,
  log,
}) {
  const startedAt = Date.now();
  const checkpointKey = checkpointStore?.createKey({ stage, systemPrompt, payload, outputFormat });
  const cached = checkpointKey ? checkpointStore.get(checkpointKey) : undefined;
  if (cached) {
    const validationMessage = validate ? validate(cached.data) : '';
    if (!validationMessage) {
      log(`${stage}（チェックポイント再開） (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);
      return { data: cached.data, response: cached.response || { status: 'checkpoint' } };
    }
    await checkpointStore.delete(checkpointKey);
  }
  let lastError;
  let firstJsonError = '';
  let outputLimit = maxOutputTokens;
  for (let jsonAttempt = 1; jsonAttempt <= 2; jsonAttempt += 1) {
    const retryInstruction = jsonAttempt === 1
      ? ''
      : `\n前回はJSONとして解析または検証できませんでした。問題: ${lastError?.message || '不明'}。構文、必須項目、指摘内容を修正し、指定されたJSONだけを最初から返してください。`;
    for (let truncationAttempt = 0; truncationAttempt <= 1; truncationAttempt += 1) {
      try {
        const response = await client({
          instructions: systemPrompt,
          input: `${JSON.stringify(payload)}${retryInstruction}`,
          maxOutputTokens: outputLimit,
          outputFormat,
        });
        const parsed = parseModelJson(response.text);
        const validationMessage = validate ? validate(parsed) : '';
        if (validationMessage) throw new Error(validationMessage);
        if (checkpointKey) {
          await checkpointStore.put(checkpointKey, {
            stage,
            data: parsed,
            response: { status: response.data?.status || 'completed' },
          });
        }
        const retryReason = jsonAttempt > 1 && firstJsonError
          ? `: ${formatRetryReason({ message: firstJsonError })}`
          : '';
        const completionNote = `${jsonAttempt > 1 ? `（JSON再試行${retryReason}）` : ''}${truncationAttempt > 0 ? '（出力上限拡張）' : ''}`;
        log(`${stage}${completionNote} (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);
        return { data: parsed, response: response.data };
      } catch (error) {
        lastError = error;
        if (['API_ERROR', 'TRANSIENT_API_ERROR'].includes(error?.code)) {
          throw new Error(`${stage}のJSONを取得できませんでした: ${error.message}`, { cause: error });
        }
        if (!firstJsonError && error?.code !== 'INCOMPLETE_RESPONSE') firstJsonError = error?.message || '不明';
        if (error?.code === 'INCOMPLETE_RESPONSE' && truncationAttempt === 0 && outputLimit < 32_768) {
          outputLimit = Math.min(32_768, outputLimit * 2);
          continue;
        }
        break;
      }
    }
  }
  throw new Error(`${stage}のJSONを取得できませんでした: ${lastError?.message || '不明なエラー'}`);
}

function batches(values, batchSize = defaultBatchSize) {
  const result = [];
  for (let index = 0; index < values.length; index += batchSize) result.push(values.slice(index, index + batchSize));
  return result;
}

export function formatBatchStage(label, start, end, total, details = '') {
  const progress = start === end ? `${start}/${total}` : `${start}-${end}/${total}`;
  return `${label}[${progress}]${details ? `: ${details}` : ''}`;
}

function indexedBatches(values, batchSize = defaultBatchSize) {
  return batches(values, batchSize).map((items, index) => {
    const start = index * batchSize + 1;
    return { items, start, end: start + items.length - 1, total: values.length };
  });
}

function summarizeLorebookContent(lorebook) {
  return {
    characters: lorebook?.characters?.length || 0,
    coreCharacters: (lorebook?.characters || [])
      .reduce((total, character) => total + String(character?.core || '').length, 0),
    exactRules: lorebook?.addressing?.exactRules?.length || 0,
    fallbackRules: lorebook?.addressing?.fallbackRules?.length || 0,
    conditionalMemories: lorebook?.conditionalMemories?.length || 0,
  };
}

function formatLorebookSummary(summary) {
  return `人物${summary.characters}名、core合計${summary.coreCharacters}文字、` +
    `呼称${summary.exactRules + summary.fallbackRules}件、条件付き記憶${summary.conditionalMemories}件`;
}

function normalizeRootId(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function createDefaultId(name, inputPath) {
  const fromName = normalizeRootId(name);
  if (fromName) return fromName;
  const fromFilename = normalizeRootId(path.basename(inputPath, path.extname(inputPath)));
  if (fromFilename) return fromFilename;
  return `lorebook-${Date.now().toString(36)}`;
}

export async function analyzeLorebook({
  sourceText,
  inputPath,
  requestedId,
  sourceLabel,
  schema,
  runtime,
  client,
  checkpointStore,
  maxRepairs = 2,
  maxWarningRepairs = 1,
  log = message => console.error(`[Lorebook] ${message}`),
}) {
  const manager = runtime.manager;
  const analysisStartedAt = Date.now();
  const planning = await requestAnalysisJson({
    stage: '解析計画',
    systemPrompt: `${manager.buildPlanningPrompt()}
${characterEligibilityInstruction}
各memoryTopicに、その話題が直接関係するcharactersのidをcharacterIdsとして付ける。人物に依存しない話題は空配列にする。
人物登場時に常に必要な安定情報はcharactersの担当なのでmemoryTopicにしない。同一人物・同一原文章節の関連する条件付き情報を過度に細分化せず、一つの話題にまとめる。ただし件数上限を理由に情報を省略してはならない。`,
    payload: { sourceText },
    maxOutputTokens: 16384,
    outputFormat: responseFormat('lorebook_plan', planningOutputSchema),
    validate: data => validatePlanningGranularity(data),
    client,
    checkpointStore,
    log,
  });
  const planningData = toPlain(planning.data);
  const styleGuideTopics = planningData.memoryTopics.filter(isStyleGuideTopic);
  if (styleGuideTopics.length > 0) {
    log(`styleGuide専用トピックを条件付き記憶の計画から${styleGuideTopics.length}件除外しました。`);
  }
  planningData.memoryTopics = planningData.memoryTopics.filter(topic => !isStyleGuideTopic(topic));
  const plan = toPlain(manager.normalizeAnalysisPlan(planningData));
  const rawTopics = planningData.memoryTopics.filter(topic => String(topic?.label || '').trim());
  plan.memoryTopics.forEach((topic, index) => {
    topic.characterIds = [...new Set((rawTopics[index]?.characterIds || []).map(String))];
  });
  plan.characters.forEach(character => {
    character.aliases = sanitizeCharacterAliases(character.aliases);
    if (!character.aliases.includes(character.name)) character.aliases.unshift(character.name);
  });
  log(`解析対象: 人物${plan.characters.length}名、条件付き記憶トピック${plan.memoryTopics.length}件`);

  const baseResult = await requestAnalysisJson({
    stage: '舞台・世界観・文体',
    systemPrompt: manager.buildBaseExtractionPrompt(),
    payload: { sourceText },
    maxOutputTokens: 8192,
    outputFormat: responseFormat('lorebook_base', baseOutputSchema),
    validate: data => validateBaseExtraction({
      ...data,
      storyCore: ensureExplicitStoryCoreFacts(data?.storyCore, sourceText),
    }, { sourceText }),
    client,
    checkpointStore,
    log,
  });
  const base = baseResult.data;
  const candidate = {
    name: String(base.name || '').trim(),
    description: String(base.description || '').trim(),
    storyCore: ensureExplicitStoryCoreFacts(base.storyCore, sourceText),
    styleGuide: toPlain(manager.normalizeStyleGuide(base.styleGuide)),
    characters: [],
    addressing: {
      instruction: String(base.addressingInstruction || '原文に明記された個別呼称を優先する。').trim(),
      exactRules: [],
      fallbackRules: [],
    },
    conditionalMemories: [],
  };
  log(`舞台・世界観・文体: storyCore ${candidate.storyCore.length}文字`);
  const characterIndex = plan.characters.map(({ id, name, aliases }) => ({ id, name, aliases }));

  for (const { items: targets, start, end, total } of indexedBatches(plan.characters)) {
    const names = targets.map(target => target.name).join('／');
    const result = await requestAnalysisJson({
      stage: formatBatchStage('人物設定', start, end, total, names),
      systemPrompt: `${manager.buildCharacterExtractionPrompt()}
基本情報、外見、性格、好き嫌い、趣味・特技、口癖・話し方、家族・生い立ち、関係性、日常、秘密・内面など、原文で人物登場時に常に必要な明示情報を省略・圧縮せず保持する。条件付き場面だけで必要な出来事や秘密はconditionalMemoriesの担当なので重複させない。`,
      payload: { sourceText, targetCharacters: targets, characterIndex },
      maxOutputTokens: 12288,
      outputFormat: responseFormat('lorebook_characters', charactersOutputSchema),
      validate: data => {
        if (!Array.isArray(data?.characters)) return 'charactersの配列が必要です。';
        const returned = new Map(data.characters.map(character => [character?.id, character]));
        const missing = targets.find(target => typeof returned.get(target.id)?.core !== 'string' || !returned.get(target.id).core.trim());
        return missing ? '指定された全人物のidとcoreが必要です。' : '';
      },
      client,
      checkpointStore,
      log,
    });
    const returnedCharacters = new Map(result.data.characters.map(character => [character.id, character]));
    for (const target of targets) {
      const character = returnedCharacters.get(target.id);
      candidate.characters.push({
        id: target.id,
        name: String(character.name || target.name).trim(),
        aliases: sanitizeCharacterAliases([
          ...target.aliases,
          ...(Array.isArray(character.aliases) ? character.aliases : []),
        ]),
        core: String(character.core || '').trim(),
      });
    }
  }
  log(`人物設定抽出: ${candidate.characters.length}名、core合計${summarizeLorebookContent(candidate).coreCharacters}文字`);

  for (const { items: speakers, start, end, total } of indexedBatches(plan.characters)) {
    const names = speakers.map(speaker => speaker.name).join('／');
    const speakerIds = new Set(speakers.map(speaker => speaker.id));
    const result = await requestAnalysisJson({
      stage: formatBatchStage('呼称・人間関係', start, end, total, names),
      systemPrompt: manager.buildAddressingExtractionPrompt(),
      payload: { sourceText, speakers, characterIndex },
      maxOutputTokens: 6144,
      outputFormat: responseFormat('lorebook_addressing', addressingOutputSchema),
      validate: data => {
        if (!Array.isArray(data?.exactRules) || !Array.isArray(data?.fallbackRules)) {
          return 'exactRulesとfallbackRulesの配列が必要です。';
        }
        return [...data.exactRules, ...data.fallbackRules].every(rule => speakerIds.has(rule?.speakerId))
          ? ''
          : 'speakerIdは指定話者IDのいずれかである必要があります。';
      },
      client,
      checkpointStore,
      log,
    });
    candidate.addressing.exactRules.push(...result.data.exactRules);
    candidate.addressing.fallbackRules.push(...result.data.fallbackRules);
  }
  log(`呼称・人間関係抽出: exact ${candidate.addressing.exactRules.length}件、fallback ${candidate.addressing.fallbackRules.length}件`);

  for (const { items: topics, start, end, total } of indexedBatches(plan.memoryTopics)) {
    const labels = topics.map(topic => topic.label).join('／');
    const result = await requestAnalysisJson({
      stage: formatBatchStage('条件付き記憶', start, end, total, labels),
      systemPrompt: manager.buildMemoryExtractionPrompt(),
      payload: { sourceText, topics, characterIndex },
      maxOutputTokens: 12288,
      outputFormat: responseFormat('lorebook_memories', memoriesOutputSchema),
      validate: data => {
        if (!Array.isArray(data?.topicResults)) return 'topicResultsの配列が必要です。';
        const returnedIds = new Set(data.topicResults
          .filter(topicResult => Array.isArray(topicResult?.memories))
          .map(topicResult => topicResult.topicId));
        return topics.every(topic => returnedIds.has(topic.id))
          ? ''
          : '指定された全topicIdとmemoriesの配列が必要です。';
      },
      client,
      checkpointStore,
      log,
    });
    const topicResults = new Map(result.data.topicResults.map(topicResult => [topicResult.topicId, topicResult]));
    for (const topic of topics) {
      const rawMemories = topicResults.get(topic.id).memories;
      const normalizedMemories = normalizeConditionalMemories({ conditionalMemories: rawMemories });
      const memories = normalizedMemories.lorebook.conditionalMemories;
      if (normalizedMemories.changes > 0) {
        log(`条件付き記憶「${topic.label}」を${rawMemories.length}件から${memories.length}件に整理しました。`);
      }
      memories.forEach((memory, index) => candidate.conditionalMemories.push({
        ...memory,
        id: memories.length === 1 ? topic.id : `${topic.id}-${index + 1}`,
      }));
    }
  }
  log(`条件付き記憶抽出: ${candidate.conditionalMemories.length}件`);

  let mergedCandidate = toPlain(manager.normalizeCandidateIds(candidate));
  const beforeCoverageAudit = summarizeLorebookContent(mergedCandidate);
  const knownCharacterIds = new Set(characterIndex.map(character => character.id));
  let auditedCharacters = 0;
  let coverageCoreAdditions = 0;
  let coverageMemoryAdditions = 0;
  const coverageTargets = plan.characters
    .map(target => ({ target, sourceSection: extractCharacterSourceSection(sourceText, target) }))
    .filter(item => item.sourceSection);
  for (let coverageIndex = 0; coverageIndex < coverageTargets.length; coverageIndex += 1) {
    const { target, sourceSection } = coverageTargets[coverageIndex];
    const names = [target.name, ...(target.aliases || [])].filter(Boolean);
    const currentCharacter = mergedCandidate.characters.find(character => character.id === target.id);
    const currentMemories = mergedCandidate.conditionalMemories.filter(memory => (
      [...(memory.allCharacters || []), ...(memory.anyCharacters || [])].includes(target.id)
      || names.some(name => String(memory.content || '').includes(name)
        || (memory.keywords || []).some(keyword => String(keyword).includes(name)))
    ));
    const currentAddressing = {
      exactRules: mergedCandidate.addressing.exactRules.filter(rule => (
        rule.speakerId === target.id || rule.targetId === target.id
      )),
      fallbackRules: mergedCandidate.addressing.fallbackRules.filter(rule => rule.speakerId === target.id),
    };
    const coverage = await requestAnalysisJson({
      stage: formatBatchStage(
        '人物網羅性監査',
        coverageIndex + 1,
        coverageIndex + 1,
        coverageTargets.length,
        target.name,
      ),
      systemPrompt: manager.buildCharacterCoverageAuditPrompt(),
      payload: {
        sourceSection,
        targetCharacter: target,
        currentCharacter,
        currentMemories,
        currentAddressing,
        characterIndex,
      },
      maxOutputTokens: 12288,
      outputFormat: responseFormat('lorebook_character_coverage', characterCoverageOutputSchema),
      validate: data => {
        if (data?.characterId !== target.id || !Array.isArray(data?.additions)) {
          return '指定されたcharacterIdとadditionsの配列が必要です。';
        }
        for (const addition of data.additions) {
          if (!String(addition?.content || '').trim()) return '各additionにcontentが必要です。';
          if (!['core', 'conditionalMemory'].includes(addition?.destination)) {
            return '各additionのdestinationはcoreまたはconditionalMemoryである必要があります。';
          }
          const referencedIds = [...(addition.allCharacters || []), ...(addition.anyCharacters || [])];
          if (referencedIds.some(characterId => !knownCharacterIds.has(characterId))) {
            return 'additionの人物条件に存在しないcharacterIdがあります。';
          }
          if (addition.destination === 'core'
            && (referencedIds.length > 0 || (addition.keywords || []).length > 0)) {
            return 'coreへのadditionに人物条件やkeywordsを付けてはいけません。';
          }
          if (addition.destination === 'conditionalMemory'
            && referencedIds.length === 0 && (addition.keywords || []).length === 0) {
            return 'conditionalMemoryへのadditionには人物条件またはkeywordsが必要です。';
          }
          if (!Number.isInteger(addition.priority) || addition.priority < 0 || addition.priority > 100) {
            return 'additionのpriorityは0〜100の整数である必要があります。';
          }
        }
        return '';
      },
      client,
      checkpointStore,
      log,
    });
    const evidence = filterCharacterCoverageAdditions(sourceSection, coverage.data.additions);
    if (evidence.rejected.length > 0) {
      log(`人物網羅性監査補正除外: ${target.name} 根拠を原文照合できない補正${evidence.rejected.length}件`);
    }
    const applied = applyCharacterCoverageAdditions(mergedCandidate, target.id, evidence.additions);
    mergedCandidate = toPlain(manager.normalizeCandidateIds(applied.candidate));
    auditedCharacters += 1;
    coverageCoreAdditions += applied.coreAdditions;
    coverageMemoryAdditions += applied.memoryAdditions;
    log(`人物網羅性補正: ${target.name} core +${applied.coreAdditions}、条件付き記憶 +${applied.memoryAdditions}`);
  }
  log(`人物網羅性監査: ${auditedCharacters}名、core +${coverageCoreAdditions}、条件付き記憶 +${coverageMemoryAdditions}`);
  log(`人物網羅性補正後: ${formatLorebookSummary(beforeCoverageAudit)} → ${formatLorebookSummary(summarizeLorebookContent(mergedCandidate))}`);
  let reviewReport = toPlain(manager.normalizeReviewReport());

  const targetId = requestedId || createDefaultId(mergedCandidate.name, inputPath);
  const excludedStyleTopicIds = new Set(styleGuideTopics.map(topic => String(topic?.id || '').trim()).filter(Boolean));
  const applyDeterministicRepairs = candidateLorebook => {
    const aliasesNormalized = toPlain(candidateLorebook);
    aliasesNormalized.storyCore = ensureExplicitStoryCoreFacts(aliasesNormalized.storyCore, sourceText);
    const memoryCountBeforeStyleFilter = aliasesNormalized.conditionalMemories?.length || 0;
    aliasesNormalized.conditionalMemories = (aliasesNormalized.conditionalMemories || []).filter(memory => (
      !isStyleGuideMemory(memory)
      && ![...excludedStyleTopicIds].some(topicId => (
          memory?.id === topicId || String(memory?.id || '').startsWith(`${topicId}-`)
        ))
    ));
    const removedStyleMemories = memoryCountBeforeStyleFilter - aliasesNormalized.conditionalMemories.length;
    if (removedStyleMemories > 0) {
      log(`styleGuide専用の条件付き記憶を${removedStyleMemories}件除外しました。`);
    }
    let aliasChanges = 0;
    for (const character of aliasesNormalized.characters || []) {
      const aliases = sanitizeCharacterAliases(character?.aliases);
      aliasChanges += (character?.aliases || []).length - aliases.length;
      character.aliases = aliases;
      if (character?.name && !character.aliases.includes(character.name)) character.aliases.unshift(character.name);
    }
    if (aliasChanges > 0) log(`汎用的な人物aliasを${aliasChanges}件除去しました。`);
    const addressing = normalizeAddressContexts(aliasesNormalized);
    if (addressing.changes > 0) log(`呼称contextを${addressing.changes}件正規化しました。`);
    const memories = normalizeConditionalMemories(addressing.lorebook);
    if (memories.changes > 0) {
      log(`条件付き記憶を${addressing.lorebook.conditionalMemories.length}件から${memories.lorebook.conditionalMemories.length}件に整理しました。`);
    }
    return memories.lorebook;
  };
  let lorebook = applyDeterministicRepairs(
    toPlain(manager.prepareLorebook(mergedCandidate, { id: targetId, sourceLabel })),
  );
  const collectAllValidationErrors = value => {
    const structuralErrors = collectValidationErrors(value, schema, manager);
    const classificationError = validateBaseExtraction(value, { sourceText });
    return classificationError ? [...structuralErrors, `[分類] ${classificationError}`] : structuralErrors;
  };
  let errors = collectAllValidationErrors(lorebook);

  for (let repairAttempt = 1; errors.length > 0 && repairAttempt <= maxRepairs; repairAttempt += 1) {
    log(`検証エラー${errors.length}件を修復します（${repairAttempt}/${maxRepairs}）。`);
    const repaired = await requestAnalysisJson({
      stage: `構造修復 ${repairAttempt}`,
      systemPrompt: `${manager.buildAuditPrompt()}
${characterEligibilityInstruction}
validationErrorsに示された構造エラーだけを修正する。`,
      payload: { sourceText, candidate: lorebook, validationErrors: errors },
      maxOutputTokens: 8192,
      outputFormat: responseFormat('lorebook_repair', auditOutputSchema),
      validate: data => data?.corrections ? '' : 'correctionsが必要です。',
      client,
      checkpointStore,
      log,
    });
    mergedCandidate = toPlain(manager.normalizeCandidateIds(
      manager.applyAnalysisCorrections(lorebook, repaired.data.corrections),
    ));
    lorebook = applyDeterministicRepairs(
      toPlain(manager.prepareLorebook(mergedCandidate, { id: targetId, sourceLabel })),
    );
    errors = collectAllValidationErrors(lorebook);
  }

  if (errors.length > 0) {
    throw new Error(`Lorebookの検証に失敗しました:\n${errors.join('\n')}`);
  }

  const previousReviewReport = reviewReport;
  let factualRepairAttempt = 0;
  let warningRepairAttempt = 0;
  let postAuditRound = 0;
  const deferredWarningIssues = new Set();
  while (true) {
    const warningRepairAllowed = warningRepairAttempt < maxWarningRepairs;
    const postAudit = await requestAnalysisJson({
      stage: postAuditRound === 0
        ? '修正後監査'
        : `修正後再監査[${postAuditRound}]`,
      systemPrompt: `${manager.buildAnalysisCommonPrompt()}
原文と、すべての修正・正規化・構造検証が完了したfinalLorebookを照合する最終監査である。
warningsには、finalLorebookに現在も残っている情報の欠落、過剰な要約、構造化不足だけを記録する。すでに修正された過去の問題を記録してはならない。
retrieval.maxCharacterCores、maxConditionalMemories、maxAddressingRulesは執筆時の一回の取得上限であり、登録総数の上限ではない。characters、conditionalMemories、addressingの総数がこれらを超えていてもwarningにしてはならない。JSON Schema、実装バリデーター、参照整合性は別工程で検証済みなので再判定しない。
原文と矛盾するconditionalMemory（主体・対象・関係・数値・時系列などの取り違え）はwarningsへ入れず、factualMemoryRepairsへ入れる。一件だけ見つけて止めず、この応答で検出できる矛盾をすべて列挙する。memoryIdには既存記憶の正確なID、issueには何がどう矛盾しているか、sourceExcerptには根拠となる原文中の一つの連続文字列、残りのフィールドには原文に忠実な置換後の記憶全体を返す。単なる欠落にはfactualMemoryRepairsを使わない。
${warningRepairAllowed ? `warningsのうち、原文から一意に訂正できるものはwarningRepairsにも修正案を返す。警告一件ごとにissueと根拠となる原文の連続文字列sourceExcerptを付ける。欠落は追加する。storyCoreAdditionは舞台、中心構図、主要テーマ・葛藤、継続的関係、秘密の知識範囲、セッション継続原則という常設の物語運用コアに限り、服装・外見・嗜好・細かな日課を入れない。styleGuideAdditionsは原文の文体・表記・出力規則だけに使う。coreAdditionsは人物の常時必要な基礎設定、conditionalMemoriesは場面や人物や語句に応じて取得する詳細に使う。原文にない、または一般fallbackと重複する個別exactRuleは削除だけで修復してよい。その場合、removeExactRulesには削除対象を特定するspeakerIdとtargetIdだけを返す。formsは返さない。CLIが現在のexactRuleを検索し、その組み合わせが一意に存在する場合だけ現在のformsを含む規則全体を削除する。fallbackRuleを削除する場合もremoveFallbackRulesにはspeakerId、targetDescription、contextだけを返す。CLIが一意な現在値を検索するが、削除には原文に忠実な完全な置換fallbackRuleを同じrepairへ必ず含める。条件付き記憶の削除にも同じIDの完全な置換記憶が必要である。曖昧さ、原文自体の矛盾、推測が必要な事項は修正せず、warningsまたはunresolvedQuestionsに残す。` : 'warning修復の上限に達しているため、warningRepairsは空配列にする。残存問題はwarningsへ返す。'}
条件付き記憶以外に修復不能な創作や事実矛盾が残る場合はfatalErrorsへ入れる。原文自体の矛盾はfatalErrorsではなくunresolvedQuestionsへ入れる。
unresolvedQuestionsには、原文自体の矛盾や情報不足により決定できない事項だけを記録する。previousReviewReportの未解決事項も再確認し、現在も未解決なら維持する。
次の形だけを返す:
{"reviewReport":{"warnings":["最終結果に残存する欠落"],"unresolvedQuestions":["原文自体の未解決事項"],"sourceAddressingCount":0,"structuredAddressingCount":0},"factualMemoryRepairs":[{"memoryId":"既存記憶ID","issue":"主体が原文と逆転している","sourceExcerpt":"原文の連続した抜粋","allCharacters":["人物ID"],"anyCharacters":[],"keywords":["検索語"],"priority":50,"content":"原文に忠実な置換内容"}],"warningRepairs":[{"issue":"明示情報が未収録","sourceExcerpt":"原文の連続した抜粋","storyCoreAddition":null,"styleGuideAdditions":{"narration":[],"dialogue":[],"formatting":[],"avoid":[]},"coreAdditions":[{"characterId":"人物ID","content":"追加情報"}],"addressing":{"removeExactRules":[],"exactRules":[],"removeFallbackRules":[],"fallbackRules":[]},"removeConditionalMemoryIds":[],"conditionalMemories":[]}],"fatalErrors":["修復不能な事実矛盾"]}`,
      payload: { sourceText, finalLorebook: lorebook, previousReviewReport, warningRepairAllowed },
      maxOutputTokens: 8192,
      outputFormat: responseFormat('lorebook_post_audit', postAuditOutputSchema),
      validate: data => {
        if (!data?.reviewReport || !Array.isArray(data?.factualMemoryRepairs)
          || !Array.isArray(data?.warningRepairs) || !Array.isArray(data?.fatalErrors)) {
          return 'reviewReport、factualMemoryRepairs、warningRepairs、fatalErrorsが必要です。';
        }
        const knownMemoryIds = new Set((lorebook.conditionalMemories || []).map(memory => memory.id));
        const knownIds = new Set((lorebook.characters || []).map(character => character.id));
        for (const repair of data.factualMemoryRepairs) {
          const referencedIds = [...(repair.allCharacters || []), ...(repair.anyCharacters || [])];
          if (!knownMemoryIds.has(repair.memoryId)) return `修復対象の条件付き記憶が存在しません: ${repair.memoryId}`;
          if (!String(repair.issue || '').trim()) return `修復対象のissueが空です: ${repair.memoryId}`;
          if (!sourceContainsExcerpt(sourceText, repair.sourceExcerpt)) {
            return `修復根拠のsourceExcerptが原文に存在しません: ${repair.memoryId}`;
          }
          if (referencedIds.some(characterId => !knownIds.has(characterId))) {
            return `修復後の人物条件に存在しないcharacterIdがあります: ${repair.memoryId}`;
          }
          if (!String(repair.content || '').trim()) return `修復後のcontentが空です: ${repair.memoryId}`;
          if (!Number.isInteger(repair.priority) || repair.priority < 0 || repair.priority > 100) {
            return `修復後のpriorityが不正です: ${repair.memoryId}`;
          }
        }
        return '';
      },
      client,
      checkpointStore,
      log,
    });
    const postAuditReport = toPlain(manager.normalizeReviewReport(postAudit.data.reviewReport));
    const repairs = postAudit.data.factualMemoryRepairs;
    const proposedWarningRepairs = postAudit.data.warningRepairs;
    const warningRepairs = warningRepairAllowed ? proposedWarningRepairs : [];
    if (!warningRepairAllowed) {
      for (const repair of proposedWarningRepairs) {
        const issue = String(repair?.issue || '').trim();
        if (issue) deferredWarningIssues.add(issue);
      }
    }
    const fatalErrors = postAudit.data.fatalErrors.map(String).map(message => message.trim()).filter(Boolean);
    let repairedCandidate = lorebook;
    let factualRepairsApplied = 0;
    let warningRepairsApplied = 0;
    let warningOperationsApplied = 0;

    if (repairs.length > 0) {
      if (factualRepairAttempt >= maxRepairs) {
        const error = new Error(`事実矛盾を${maxRepairs}回修復しましたが、さらに${repairs.length}件の修復が必要です。`);
        error.lorebook = lorebook;
        throw error;
      }
      for (const repair of repairs) {
        log(`事実矛盾修復対象: ${repair.memoryId} — ${String(repair.issue).trim()}`);
      }
      const repaired = applyGroundedMemoryRepairs(repairedCandidate, sourceText, repairs);
      if (repaired.rejected.length > 0 || repaired.applied !== repairs.length) {
        const error = new Error(`事実矛盾の修復を安全に適用できませんでした: ${repaired.rejected.join('、')}`);
        error.lorebook = lorebook;
        throw error;
      }
      repairedCandidate = repaired.candidate;
      factualRepairsApplied = repaired.applied;
      factualRepairAttempt += 1;
    }

    if (warningRepairs.length > 0) {
      for (const repair of warningRepairs) {
        log(`warning修復対象: ${String(repair.issue).trim()}`);
      }
      const repaired = applyGroundedWarningRepairs(repairedCandidate, sourceText, warningRepairs);
      const rejectedIssues = new Set(repaired.rejected);
      for (const issue of rejectedIssues) {
        deferredWarningIssues.add(issue);
        log(`warning修復見送り: ${issue}`);
      }
      for (const repair of warningRepairs) {
        const issue = String(repair?.issue || '').trim();
        if (issue && !rejectedIssues.has(issue)) deferredWarningIssues.delete(issue);
      }
      repairedCandidate = repaired.candidate;
      warningRepairsApplied = repaired.applied;
      warningOperationsApplied = repaired.operations;
      warningRepairAttempt += 1;
    }

    if (factualRepairsApplied > 0 || warningRepairsApplied > 0) {
      const repairedLorebook = applyDeterministicRepairs(
        toPlain(manager.prepareLorebook(repairedCandidate, { id: targetId, sourceLabel })),
      );
      const repairErrors = collectAllValidationErrors(repairedLorebook);
      if (repairErrors.length > 0) {
        const error = new Error(`最終監査の修復で構造エラーが発生しました:\n${repairErrors.join('\n')}`);
        error.lorebook = lorebook;
        throw error;
      }
      lorebook = repairedLorebook;
      if (factualRepairsApplied > 0) {
        log(`事実矛盾修復[${factualRepairAttempt}/${maxRepairs}]: 条件付き記憶${factualRepairsApplied}件を置換`);
      }
      if (warningRepairsApplied > 0) {
        log(`warning修復[${warningRepairAttempt}/${maxWarningRepairs}]: ${warningRepairsApplied}件、操作${warningOperationsApplied}項目を適用`);
      }
      postAuditRound += 1;
      continue;
    }

    if (fatalErrors.length > 0) {
      const error = new Error(`修復不能な事実矛盾が残っています:\n${fatalErrors.join('\n')}`);
      error.lorebook = lorebook;
      throw error;
    }
    reviewReport = {
      ...postAuditReport,
      warnings: [...new Set([
        ...postAuditReport.warnings,
        ...deferredWarningIssues,
      ])],
      unresolvedQuestions: [...new Set([
        ...previousReviewReport.unresolvedQuestions,
        ...postAuditReport.unresolvedQuestions,
      ])],
    };
    break;
  }

  log(`最終構造: ${formatLorebookSummary(summarizeLorebookContent(lorebook))}`);
  log(`総所要時間 (${((Date.now() - analysisStartedAt) / 1000).toFixed(1)}s)`);
  return { lorebook, reviewReport };
}

async function writeJsonAtomically(outputPath, value) {
  const directory = path.dirname(outputPath);
  await fs.mkdir(directory, { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, outputPath);
}

export function createInvalidOutputPath(outputPath) {
  const parsed = path.parse(outputPath);
  return path.join(parsed.dir, `${parsed.name}.invalid${parsed.ext || '.json'}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    return;
  }
  if (options.positionals.length === 0) throw new Error(`入力ファイルが必要です。\n\n${usage}`);

  const inputPath = path.resolve(options.positionals[0]);
  const [schemaText, runtime, scriptText] = await Promise.all([
    fs.readFile(defaultSchemaPath, 'utf8'),
    loadLorebookRuntime(),
    fs.readFile(fileURLToPath(import.meta.url), 'utf8'),
  ]);
  const schema = JSON.parse(schemaText);

  if (options.validateOnly) {
    if (options.positionals.length !== 1) throw new Error('--validate-onlyではLorebook JSONを1ファイルだけ指定してください。');
    const lorebook = JSON.parse(await fs.readFile(inputPath, 'utf8'));
    const errors = collectValidationErrors(lorebook, schema, runtime.manager);
    if (errors.length > 0) throw new Error(`検証エラー:\n${errors.join('\n')}`);
    console.log(`PASS: JSON Schema / 実装バリデーター / 参照整合性: ${inputPath}`);
    return;
  }

  if (options.positionals.length > 2) throw new Error('位置引数が多すぎます。入力ファイルと出力ファイルだけを指定してください。');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEYが設定されていません。');
  const sourceText = (await fs.readFile(inputPath, 'utf8')).trim();
  if (!sourceText) throw new Error('入力ファイルが空です。');
  if (sourceText.length > runtime.sourceMaxCharacters) {
    throw new Error(`入力は${runtime.sourceMaxCharacters.toLocaleString()}文字以内にしてください。`);
  }

  const defaultOutput = path.join(
    path.dirname(inputPath),
    `${path.basename(inputPath, path.extname(inputPath))}.lorebook.json`,
  );
  const outputPath = path.resolve(options.positionals[1] || defaultOutput);
  if (outputPath === inputPath) throw new Error('入力ファイルと出力ファイルには別のパスを指定してください。');

  const checkpointPath = createCheckpointPath(outputPath);
  const checkpointStore = await createCheckpointStore({
    filePath: checkpointPath,
    metadata: {
      sourceHash: hashValue(sourceText),
      schemaHash: hashValue(schemaText),
      scriptHash: hashValue(scriptText),
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      baseUrl: options.baseUrl,
    },
    resume: options.resume,
    log: message => console.error(`[Lorebook] ${message}`),
  });

  const client = createOpenAIClient({
    apiKey,
    model: options.model,
    reasoningEffort: options.reasoningEffort,
    baseUrl: options.baseUrl,
    timeoutMs: options.timeoutMs,
    maxApiRetries: options.apiRetries,
    onRetry: ({ attempt, maxRetries, delay, reason }) => {
      console.error(`[Lorebook] API再試行[${attempt}/${maxRetries}]: ${reason} (${(delay / 1000).toFixed(1)}s後)`);
    },
  });
  console.error(`[Lorebook] model=${options.model} reasoning-effort=${options.reasoningEffort || 'model-default'}`);
  let result;
  try {
    result = await analyzeLorebook({
      sourceText,
      inputPath,
      requestedId: options.id,
      sourceLabel: options.sourceLabel || path.basename(inputPath),
      schema,
      runtime,
      client,
      checkpointStore,
      maxRepairs: options.maxRepairs,
      maxWarningRepairs: options.maxWarningRepairs,
    });
  } catch (error) {
    if (error?.lorebook) {
      const invalidPath = createInvalidOutputPath(outputPath);
      await writeJsonAtomically(invalidPath, error.lorebook);
      console.error(`[Lorebook] 未解決の候補JSONを保存しました: ${invalidPath}`);
    }
    if (checkpointStore.size() > 0) {
      console.error(`[Lorebook] 再開用チェックポイントを保持しました: ${checkpointPath}`);
    }
    throw error;
  } finally {
    console.error(`[Lorebook] ${formatApiUsage(client.getUsage())}`);
  }
  await writeJsonAtomically(outputPath, result.lorebook);
  await fs.rm(checkpointPath, { force: true });
  console.error('[Lorebook] JSON Schema: PASS');
  console.error('[Lorebook] 実装バリデーター: PASS');
  console.error('[Lorebook] 参照整合性: PASS');
  for (const warning of result.reviewReport.warnings) console.error(`[Lorebook] warning: ${warning}`);
  for (const question of result.reviewReport.unresolvedQuestions) console.error(`[Lorebook] unresolved: ${question}`);
  console.log(outputPath);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
