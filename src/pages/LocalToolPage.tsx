import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useParams } from 'react-router-dom';

import { toolRouteRepository } from '../app/routeRepositories';
import { CopyButton, Field, ResultPanel } from '../components/common/forms';
import type { ToolId } from '../config/schemas';
import NotFoundPage from './NotFoundPage';

function encodeBase64Unicode(value: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64Unicode(value: string): string {
  const binary = atob(value.trim());
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function createUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] ?? 0) & 0x0f | 0x40;
  bytes[8] = (bytes[8] ?? 0) & 0x3f | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type PromptFields = Readonly<{
  role: string;
  context: string;
  task: string;
  constraints: string;
  outputFormat: string;
}>;

function buildPrompt(fields: PromptFields): string {
  return [
    fields.role.trim() ? `## 角色\n${fields.role.trim()}` : '',
    fields.context.trim() ? `## 上下文\n${fields.context.trim()}` : '',
    fields.task.trim() ? `## 任务\n${fields.task.trim()}` : '',
    fields.constraints.trim() ? `## 约束\n${fields.constraints.trim()}` : '',
    fields.outputFormat.trim() ? `## 输出格式\n${fields.outputFormat.trim()}` : '',
  ].filter(Boolean).join('\n\n');
}

function countWords(value: string): number {
  const latin = value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const cjk = value.match(/[\u3040-\u30ff\u3400-\u9fff]/g)?.length ?? 0;
  return latin + cjk;
}

function ToolInput({
  label,
  value,
  onChange,
  rows = 8,
  placeholder,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string | undefined;
}>): React.JSX.Element {
  return (
    <Field label={label}>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </Field>
  );
}

export function LocalToolPage(): React.JSX.Element {
  const { toolId } = useParams<{ toolId: string }>();
  const tool = toolId === undefined ? undefined : toolRouteRepository.findById(toolId);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [secondary, setSecondary] = useState('');
  const [mode, setMode] = useState('format');
  const [flags, setFlags] = useState('g');
  const [count, setCount] = useState('1');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [promptFields, setPromptFields] = useState({ role: '', context: '', task: '', constraints: '', outputFormat: '' });
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    let active = true;
    if (tool === undefined) {
      return () => { active = false; };
    }
    void tool.load().then(() => {
      if (active) setLoaded(true);
    });
    return () => { active = false; };
  }, [tool]);

  const updatePrompt = (key: keyof typeof promptFields, value: string) => {
    setPromptFields((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setInput('');
    setSecondary('');
    setMode(toolId === 'timestamp' ? 'iso' : 'format');
    setFlags('g');
    setCount('1');
    setOutput('');
    setError('');
    setPromptFields({ role: '', context: '', task: '', constraints: '', outputFormat: '' });
    setPreviewMode(false);
  };

  const run = async () => {
    if (toolId === undefined) return;
    setError('');
    try {
      let result = '';
      switch (toolId as ToolId) {
        case 'json': {
          const parsed: unknown = JSON.parse(input);
          result = mode === 'minify' ? JSON.stringify(parsed) : mode === 'validate' ? '有效 JSON' : JSON.stringify(parsed, null, 2);
          break;
        }
        case 'base64':
          result = mode === 'decode' ? decodeBase64Unicode(input) : encodeBase64Unicode(input);
          break;
        case 'url':
          result = mode === 'decode' ? decodeURIComponent(input) : encodeURIComponent(input);
          break;
        case 'timestamp': {
          const date = mode === 'seconds' ? new Date(Number(input) * 1000) : mode === 'milliseconds' ? new Date(Number(input)) : new Date(input);
          if (Number.isNaN(date.getTime())) throw new Error('请输入有效的时间、秒或毫秒时间戳。');
          result = [`ISO 8601: ${date.toISOString()}`, `Unix seconds: ${Math.floor(date.getTime() / 1000)}`, `Unix milliseconds: ${date.getTime()}`, `Local: ${date.toLocaleString()}`].join('\n');
          break;
        }
        case 'uuid': {
          const amount = Math.min(100, Math.max(1, Number.parseInt(count, 10) || 1));
          result = Array.from({ length: amount }, createUuid).join('\n');
          break;
        }
        case 'text-statistics': {
          const lines = input.length === 0 ? 0 : input.split(/\r?\n/).length;
          result = [`Characters: ${Array.from(input).length}`, `Non-whitespace: ${Array.from(input).filter((character) => !/\s/u.test(character)).length}`, `Word units: ${countWords(input)}`, `Lines: ${lines}`, `UTF-8 bytes: ${new TextEncoder().encode(input).length}`].join('\n');
          break;
        }
        case 'regex': {
          const expression = new RegExp(input, flags);
          const matches = [...secondary.matchAll(expression)];
          result = matches.length === 0 ? '没有匹配。' : matches.map((match, index) => `${index + 1}. ${match[0]} @ ${match.index ?? 0}`).join('\n');
          break;
        }
        case 'hash': {
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
          result = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
          break;
        }
        case 'diff': {
          const left = input.split(/\r?\n/);
          const right = secondary.split(/\r?\n/);
          const length = Math.max(left.length, right.length);
          result = Array.from({ length }, (_, index) => {
            const before = left[index];
            const after = right[index];
            return before === after ? `  ${before ?? ''}` : `- ${before ?? ''}\n+ ${after ?? ''}`;
          }).join('\n');
          break;
        }
        case 'prompt-composer':
          result = buildPrompt(promptFields);
          break;
        default:
          throw new Error('未知工具。');
      }
      setOutput(result);
    } catch (caught) {
      setOutput('');
      setError(caught instanceof Error ? caught.message : '操作失败，请检查输入。');
    }
  };

  const promptOutput = useMemo(() => buildPrompt(promptFields), [promptFields]);

  if (tool === undefined) return <NotFoundPage resource="tool" />;

  return (
    <section aria-labelledby="local-tool-title" className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOCAL TOOL / BROWSER ONLY</p>
          <h1 id="local-tool-title">{tool.name}</h1>
          <p className="lede">{tool.capability}</p>
        </div>
        <Link className="button button-ghost" to="/tools">返回工具目录</Link>
      </div>
      {!loaded ? <p aria-live="polite" role="status" className="notice">正在加载本地工具模块…</p> : null}
      <div className="tool-card stack-md">
        {toolId === 'prompt-composer' ? (
          <>
            <div className="tool-tabs" role="tablist" aria-label="Prompt Composer 模式">
              <button className={previewMode ? 'button button-ghost' : 'button button-primary'} onClick={() => setPreviewMode(false)} type="button">组合 Prompt</button>
              <button className={previewMode ? 'button button-primary' : 'button button-ghost'} onClick={() => setPreviewMode(true)} type="button">Markdown Preview</button>
            </div>
            {previewMode ? (
              <ToolInput label="Markdown" onChange={setInput} placeholder="输入 Markdown；HTML 会作为文本显示。" rows={14} value={input} />
            ) : (
              <div className="form-grid">
                {(['role', 'context', 'task', 'constraints', 'outputFormat'] as const).map((key) => (
                  <ToolInput key={key} label={key === 'outputFormat' ? '输出格式' : key === 'role' ? '角色' : key === 'context' ? '上下文' : key === 'task' ? '任务' : '约束'} onChange={(value) => updatePrompt(key, value)} rows={4} value={promptFields[key]} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="form-grid">
        <ToolInput label={toolId === 'regex' ? '正则表达式' : toolId === 'diff' ? '原文' : '输入'} onChange={setInput} {...(toolId === 'json' ? { placeholder: '{"hello":"world"}' } : {})} value={input} />
            {['regex', 'diff'].includes(toolId ?? '') ? <ToolInput label={toolId === 'regex' ? '测试文本' : '对比文本'} onChange={setSecondary} rows={8} value={secondary} /> : null}
          </div>
        )}
        <div className="inline-controls">
          {toolId === 'json' ? <label>模式<select onChange={(event) => setMode(event.target.value)} value={mode}><option value="format">格式化</option><option value="minify">压缩</option><option value="validate">验证</option></select></label> : null}
          {toolId === 'base64' ? <label>模式<select onChange={(event) => setMode(event.target.value)} value={mode}><option value="encode">编码</option><option value="decode">解码</option></select></label> : null}
          {toolId === 'url' ? <label>模式<select onChange={(event) => setMode(event.target.value)} value={mode}><option value="encode">编码</option><option value="decode">解码</option></select></label> : null}
          {toolId === 'timestamp' ? <label>输入类型<select onChange={(event) => setMode(event.target.value)} value={mode}><option value="iso">ISO / 本地时间</option><option value="seconds">Unix 秒</option><option value="milliseconds">Unix 毫秒</option></select></label> : null}
          {toolId === 'uuid' ? <label>数量<input min="1" max="100" onChange={(event) => setCount(event.target.value)} type="number" value={count} /></label> : null}
          {toolId === 'regex' ? <label>Flags<input onChange={(event) => setFlags(event.target.value)} value={flags} /></label> : null}
        </div>
        <div className="button-row">
          <button className="button button-primary" onClick={() => void run()} type="button">运行</button>
          <button className="button button-ghost" onClick={reset} type="button">重置</button>
        </div>
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>
      {toolId === 'prompt-composer' && previewMode ? (
        <ResultPanel label="Markdown Preview" actions={<CopyButton label="复制 Markdown" text={input} />}>
          <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{input}</ReactMarkdown></div>
        </ResultPanel>
      ) : (
        <ResultPanel label="结果" actions={<CopyButton label="复制结果" text={toolId === 'prompt-composer' ? promptOutput : output} />}>
          {toolId === 'prompt-composer' ? <pre>{promptOutput || '填写字段后运行。'}</pre> : <pre>{output || '运行工具后显示结果。'}</pre>}
        </ResultPanel>
      )}
      <p className="fine-print">所有处理仅在当前浏览器页面完成，不会 fetch、上传或写入 storage。</p>
    </section>
  );
}

export default LocalToolPage;
