#!/usr/bin/env bun
// Prints only the passages a ledger needs, so whole pages stay out of the agent's context.
//
//   bun passages.ts read <url> [<url> ...] [--add "<regex>"] [--pattern "<regex>"] [--width 200] [--dir pages]
//   <command> | bun passages.ts stdin <label> [--add ...]
//
// read: fetches every URL with plain HTTP (curl, at most 4 at a time), keeps the page text in --dir,
//       and prints about --width characters around each match of the pattern, cut at word or sentence ends.
// stdin: same filter on text piped in, for example `browse get markdown` from a browser session.
// Search with the host's own web search. Never call Browserbase Search or Fetch from here: they are billed
// per call and blocked by the guard described in ~/.agents/agents-services.md.

const DEFAULT_PATTERN =
  "headquarter|\\bHQ\\b|head office|offices?\\b|located in|based in|registered|(?<!e-?mail |IP )address|data controller|commercial regist|imprint|impressum|handelsregister|amtsgericht|(?<!\\p{L})(?-i:Inc|Ltd|LLC|GmbH|AG|SA|SE|OÜ|AB|Oy|ApS|AS|NV|KG|plc|Pty|SAS|SARL|Sàrl|SRL|S\\.p\\.A|B\\.V)(?!\\p{L})|sede|hauptsitz|firmensitz|siège|sitz\\b";

const TINY = 800;

const PARALLEL = 4;

type Opts = { width: number; dir: string; pattern: RegExp };

function parseArgs(argv: string[]) {
  const pos: string[] = [];
  let width = 200;
  let dir = "pages";
  let pattern = DEFAULT_PATTERN;
  let add = "";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--width") width = Number(argv[++i]);
    else if (a === "--dir") dir = argv[++i];
    else if (a === "--pattern") pattern = argv[++i];
    else if (a === "--add") add = argv[++i];
    else pos.push(a);
  }
  const source = add ? `${pattern}|${add}` : pattern;
  return { pos, opts: { width, dir, pattern: new RegExp(source, "giu") } as Opts };
}

async function run(cmd: string[]): Promise<{ ok: boolean; out: string }> {
  try {
    const p = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
    const out = await new Response(p.stdout).text();
    return { ok: (await p.exited) === 0, out };
  } catch {
    return { ok: false, out: "" };
  }
}

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };

// Page text as a reader sees it, so a quote copied from a passage is found verbatim on the page.
function plain(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, " ")
    .replace(/<\/?(a|span|b|i|em|strong|sup|sub|small|abbr|code|bdi|font|mark|u|s)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi, "")
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ""), /^#x/i.test(e) ? 16 : 10)) : (ENTITIES[e.toLowerCase()] ?? m),
    )
    .replace(/\[\\\[[^\]]*?\\\]\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\]\(([^)]*)\)(?=\[)/g, "]($1) ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\\(?=\n)/g, "")
    .replace(/\\([!-/:-@[-`{-~])/g, "$1")
    .replace(/[*`]+/g, "")
    .replace(/[#>|]+/g, " ")
    .replace(/(^|\s)_+|_+(?=\s|$|[.,;:!?])/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

// Widens [start, end) to the nearest sentence end within reach, otherwise to the nearest space.
function snap(text: string, start: number, end: number) {
  const reach = 120;
  const before = text.slice(Math.max(0, start - reach), start);
  const sentence = Math.max(before.lastIndexOf(". "), before.lastIndexOf("! "), before.lastIndexOf("? "));
  if (start > 0) start = sentence >= 0 ? start - before.length + sentence + 2 : Math.max(0, text.lastIndexOf(" ", start) + 1);
  const after = text.slice(end, end + reach).search(/[.!?](\s|$)/);
  if (end < text.length) end = after >= 0 ? end + after + 1 : (text.indexOf(" ", end) + 1 || text.length + 1) - 1;
  return [start, end] as const;
}

// Menus and footers repeat on every page of a site; each passage prints once per run.
const printed = new Set<string>();

function passages(text: string, opts: Opts) {
  const spans: [number, number][] = [];
  for (const m of text.matchAll(opts.pattern)) {
    const [start, end] = snap(
      text,
      Math.max(0, m.index! - opts.width / 2),
      Math.min(text.length, m.index! + m[0].length + opts.width / 2),
    );
    const last = spans.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else spans.push([start, end]);
  }
  return spans
    .map(([s, e]) => text.slice(s, e).trim())
    .filter((p) => !printed.has(p) && printed.add(p))
    .map((p) => `> ${p}`);
}

function report(label: string, raw: string, opts: Opts, file?: string) {
  const text = plain(raw);
  console.log(`## ${label} (${text.length} chars${file ? `, ${file}` : ""})`);
  if (text.length < TINY) {
    console.log(
      `tiny page (blocked, an error or rendered with JavaScript): ${text.slice(0, 160)}\nopen it with: browse open ${label} --local (--remote only for a 403 or captcha), then browse get markdown | bun passages.ts stdin ${label}`,
    );
    return;
  }
  const found = passages(text, opts);
  console.log(found.length ? found.join("\n") : "no new match");
}

function slug(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "_").slice(0, 120) + ".md";
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

async function fetchPage(url: string, file: string) {
  const curl = await run(["curl", "-sL", "--compressed", "--max-time", "30", "-A", UA, url]);
  await Bun.write(file, curl.out);
  return curl.out;
}

async function read(urls: string[], opts: Opts) {
  await Bun.$`mkdir -p ${opts.dir}`.quiet();
  const pages: { url: string; file: string; raw: string }[] = [];
  for (let i = 0; i < urls.length; i += PARALLEL) {
    const batch = urls.slice(i, i + PARALLEL);
    pages.push(
      ...(await Promise.all(
        batch.map(async (url) => {
          const file = `${opts.dir}/${slug(url)}`;
          return { url, file, raw: await fetchPage(url, file) };
        }),
      )),
    );
  }
  pages.forEach((p) => report(p.url, p.raw, opts, p.file));
}

const [mode, ...rest] = process.argv.slice(2);
const { pos, opts } = parseArgs(rest);
if (mode === "read" && pos.length) await read(pos, opts);
else if (mode === "stdin") report(pos[0] ?? "stdin", await Bun.stdin.text(), opts);
else {
  if (mode === "search") console.error("search: use the host's own web search, then pass the URLs to read.");
  console.error("usage: passages.ts read <url> ... | stdin <label>");
  process.exit(1);
}
