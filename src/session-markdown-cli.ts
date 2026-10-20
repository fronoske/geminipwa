import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, stderr } from 'node:process';
import { basename, dirname, extname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAnalysisClient, createTokenUsage, defaultAnalysisMaxOutputTokens,
  findContradictions, formatTokenUsage, insertHeadings,
  type TokenUsage } from './session-markdown-ai.js';

type Mode = 'novel' | 'chat';
type Message = {
  role: 'user' | 'model';
  content: string;
  isCascaded?: boolean;
  siblingGroupId?: string;
};
type Session = { title: string; messages: Message[] };
type Options = {
  input: string; mode: Mode; session?: number; all: boolean; output?: string;
  headings: boolean; verify: boolean; model: string; reasoningEffort: string;
  baseUrl: string; timeoutMs: number; maxOutputTokens: number;
};

const defaultModel = 'deepseek/deepseek-v4.1-flash';
const defaultReasoningEffort = 'medium';
const defaultBaseUrl = 'https://openrouter.ai/api/v1';

const usage = `使い方:
  npm run session:markdown -- <sessions.json> --mode novel|chat [--session 番号 | --all] [--output パス] [オプション]

オプション:
  --session 番号   1から始まるセッション番号。省略すると一覧から選択
  --all           全セッションを個別の Markdown ファイルに出力
  --output パス   1件なら出力ファイル、--all なら出力ディレクトリ
  --headings      小説本文を LLM で解析し、見出しを挿入（novel のみ）
  --verify
                  人物情報の矛盾候補を別の Markdown ファイルに報告（novel のみ）
  --model ID      モデル ID（既定: ${defaultModel}）
  --reasoning-effort 値
                  推論量（既定: ${defaultReasoningEffort}）
  --base-url URL  Responses API の URL（既定: ${defaultBaseUrl}）
  --max-output-tokens 数
                  1回の解析で許可する最大出力トークン数（既定: ${defaultAnalysisMaxOutputTokens}）
  --timeout-ms 数 1回の API 通信の制限時間（既定: 600000）
  --help          この説明を表示

LLM オプションでは、OpenRouter 接続時に OPENROUTER_API_KEY（または OPENAI_API_KEY）、
その他の接続先では OPENAI_API_KEY を使用します。
既存ファイルは上書きしません。
終了時に API が報告したトークン使用量を表示します。`;

export function parseArgs(args: string[]): Options | null {
  if (args.includes('--help') || args.includes('-h')) return null;
  let input: string | undefined;
  let mode: Mode | undefined;
  let session: number | undefined;
  let all = false;
  let output: string | undefined;
  let headings = false;
  let verify = false;
  let model = defaultModel;
  let reasoningEffort = defaultReasoningEffort;
  let baseUrl = defaultBaseUrl;
  let timeoutMs = 600_000;
  let maxOutputTokens = defaultAnalysisMaxOutputTokens;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode') {
      const value = args[++i];
      if (value !== 'novel' && value !== 'chat') throw new Error('--mode には novel または chat を指定してください。');
      mode = value;
    } else if (arg === '--session') {
      const value = args[++i];
      if (!value || !/^[1-9]\d*$/.test(value)) throw new Error('--session には1以上の番号を指定してください。');
      session = Number(value);
      if (!Number.isSafeInteger(session)) throw new Error('--session の番号が大きすぎます。');
    } else if (arg === '--all') {
      all = true;
    } else if (arg === '--headings') {
      headings = true;
    } else if (arg === '--verify') {
      verify = true;
    } else if (arg === '--output') {
      output = args[++i];
      if (!output) throw new Error('--output にパスを指定してください。');
    } else if (arg === '--model') {
      model = args[++i];
      if (!model || model.startsWith('-')) throw new Error('--model にモデル ID を指定してください。');
    } else if (arg === '--reasoning-effort') {
      reasoningEffort = args[++i];
      if (!['none', 'low', 'medium', 'high', 'xhigh', 'max'].includes(reasoningEffort)) {
        throw new Error('--reasoning-effort の値が不正です。');
      }
    } else if (arg === '--base-url') {
      baseUrl = args[++i];
      if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new Error('--base-url に URL を指定してください。');
    } else if (arg === '--timeout-ms') {
      const value = args[++i];
      timeoutMs = Number(value);
      if (!value || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
        throw new Error('--timeout-ms には1以上の整数を指定してください。');
      }
    } else if (arg === '--max-output-tokens') {
      const value = args[++i];
      maxOutputTokens = Number(value);
      if (!value || !Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1) {
        throw new Error('--max-output-tokens には1以上の整数を指定してください。');
      }
    } else if (arg.startsWith('-')) {
      throw new Error(`不明なオプション: ${arg}`);
    } else if (!input) {
      input = arg;
    } else {
      throw new Error(`余分な引数: ${arg}`);
    }
  }
  if (!input) throw new Error('セッション JSON ファイルを指定してください。');
  if (!mode) throw new Error('--mode novel または --mode chat を指定してください。');
  if (all && session !== undefined) throw new Error('--all と --session は同時に指定できません。');
  if (mode === 'chat' && (headings || verify)) {
    throw new Error('--headings と --verify は novel モード専用です。');
  }
  return { input, mode, session, all, output, headings, verify,
    model, reasoningEffort, baseUrl, timeoutMs, maxOutputTokens };
}

export function parseSessions(data: unknown): Session[] {
  const sessions = Array.isArray(data) ? data : [data];
  if (sessions.length === 0) throw new Error('セッションがありません。');
  return sessions.map((session, sessionIndex) => {
    if (!session || typeof session !== 'object' || typeof session.title !== 'string' || !Array.isArray(session.messages)) {
      throw new Error(`${sessionIndex + 1}件目のセッション形式が不正です。`);
    }
    const messages = session.messages.map((message: unknown, messageIndex: number) => {
      if (!message || typeof message !== 'object') throw new Error(`${sessionIndex + 1}件目の${messageIndex + 1}番目のメッセージ形式が不正です。`);
      const value = message as Record<string, unknown>;
      if ((value.role !== 'user' && value.role !== 'model') || typeof value.content !== 'string') {
        throw new Error(`${sessionIndex + 1}件目の${messageIndex + 1}番目のメッセージ形式が不正です。`);
      }
      return value as Message;
    });
    return { title: session.title, messages };
  });
}

function visibleMessages(session: Session): Message[] {
  const latestByGroup = new Map<string, number>();
  session.messages.forEach((message, index) => {
    if (message.role === 'model' && message.isCascaded && message.siblingGroupId) {
      latestByGroup.set(message.siblingGroupId, index);
    }
  });
  return session.messages.filter((message, index) => !(message.role === 'model'
    && message.isCascaded && message.siblingGroupId
    && latestByGroup.get(message.siblingGroupId) !== index));
}

export function modelCharacterCount(session: Session): number {
  return visibleMessages(session)
    .filter(message => message.role === 'model')
    .reduce((total, message) => total + Array.from(message.content.trim()).length, 0);
}

export function renderSession(session: Session, mode: Mode): string {
  const parts: string[] = [];
  visibleMessages(session).forEach(message => {
    if (mode === 'novel' && message.role !== 'model') return;
    const content = message.content.trim();
    if (!content) return;
    parts.push(mode === 'chat' ? `## ${message.role === 'user' ? 'ユーザー' : 'LLM'}\n\n${content}` : content);
  });
  return parts.length ? `${parts.join('\n\n')}\n` : '';
}

async function chooseSession(sessions: Session[]): Promise<number | 'all'> {
  stdout.write('セッションを選択してください:\n');
  sessions.forEach((session, index) => {
    stdout.write(`  ${index + 1}. ${session.title.replace(/\s+/g, ' ').trim() || '(無題)'}（${modelCharacterCount(session).toLocaleString('ja-JP')} 文字）\n`);
  });
  stdout.write('  a. 全て\n');
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (await rl.question('番号または a: ')).trim();
    if (/^(a|all|全て)$/i.test(answer)) return 'all';
    if (/^[1-9]\d*$/.test(answer)) {
      const index = Number(answer) - 1;
      if (index < sessions.length) return index;
    }
    throw new Error('有効なセッション番号または a を指定してください。');
  } finally {
    rl.close();
  }
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function outputName(session: Session, index: number, width: number, mode: Mode, headings = false): string {
  const title = session.title.normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '')
    .slice(0, 60).trim();
  return `${String(index + 1).padStart(width, '0')}-${title || '無題'}-${mode}${headings ? '-headings' : ''}.md`;
}

async function main(tokenUsage: TokenUsage): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) { stdout.write(`${usage}\n`); return; }
  const inputPath = resolve(options.input);
  const sessions = parseSessions(JSON.parse(await readFile(inputPath, 'utf8')));
  const selection = options.all ? 'all' : options.session !== undefined
    ? options.session - 1 : await chooseSession(sessions);
  if (selection !== 'all' && (selection < 0 || selection >= sessions.length)) {
    throw new Error(`セッション番号は1から${sessions.length}の範囲で指定してください。`);
  }
  const stem = basename(inputPath, extname(inputPath));
  const width = String(sessions.length).length;
  const indices = selection === 'all' ? sessions.map((_, index) => index) : [selection];
  const basePath = resolve(options.output || (selection === 'all'
    ? join(dirname(inputPath), `${stem}-${options.mode}${options.headings ? '-headings' : ''}`)
    : join(dirname(inputPath), `${stem}-${outputName(sessions[selection], selection, width, options.mode, options.headings)}`)));
  const outputs = indices.map(index => ({
    path: selection === 'all'
      ? join(basePath, outputName(sessions[index], index, width, options.mode, options.headings))
      : basePath,
    index,
  }));
  for (const output of outputs) {
    if (await exists(output.path)) throw new Error(`出力先が既に存在します: ${output.path}`);
    if (options.verify && await exists(reportPath(output.path))) {
      throw new Error(`出力先が既に存在します: ${reportPath(output.path)}`);
    }
  }
  const needsAi = options.headings || options.verify;
  const isOpenRouter = needsAi && new URL(options.baseUrl).hostname === 'openrouter.ai';
  const apiKey = isOpenRouter
    ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    : process.env.OPENAI_API_KEY;
  if (needsAi && !apiKey) throw new Error(isOpenRouter
    ? 'LLM オプションには OPENROUTER_API_KEY または OPENAI_API_KEY が必要です。'
    : 'LLM オプションには OPENAI_API_KEY が必要です。');
  const baseAsk = needsAi ? createAnalysisClient({ apiKey: apiKey!, model: options.model,
    reasoningEffort: options.reasoningEffort, baseUrl: options.baseUrl, timeoutMs: options.timeoutMs,
    usage: tokenUsage }) : null;
  const ask = baseAsk ? async (...args: Parameters<typeof baseAsk>) => {
    stderr.write(`LLM 解析: ${args[0]}\n`);
    return baseAsk(...args);
  } : null;
  for (const output of outputs) {
    const session = sessions[output.index];
    if (needsAi) stderr.write(`セッション ${output.index + 1}/${sessions.length}: ${session.title.replace(/\s+/g, ' ').trim()}\n`);
    const original = renderSession(session, options.mode);
    const report = options.verify
      ? await findContradictions(original, session.title, ask!, options.maxOutputTokens) : null;
    const content = options.headings
      ? await insertHeadings(original, ask!, options.maxOutputTokens) : original;
    await mkdir(dirname(output.path), { recursive: true });
    await writeFile(output.path, content, { encoding: 'utf8', flag: 'wx' });
    stdout.write(`${output.path}\n`);
    if (report !== null) {
      const path = reportPath(output.path);
      await writeFile(path, report, { encoding: 'utf8', flag: 'wx' });
      stdout.write(`${path}\n`);
    }
  }
}

function reportPath(novelPath: string): string {
  const extension = extname(novelPath);
  return `${extension ? novelPath.slice(0, -extension.length) : novelPath}-contradictions.md`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const tokenUsage = createTokenUsage();
  main(tokenUsage).catch(error => {
    stderr.write(`エラー: ${error.message || error}\n`);
    process.exitCode = 1;
  }).finally(() => {
    stderr.write(`${formatTokenUsage(tokenUsage)}\n`);
  });
}
