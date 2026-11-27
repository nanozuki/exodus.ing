// contract-diff.ts extracts every exported declaration (signature and doc comment) of TS modules and Svelte
// components, and the tests linked to it, from one or two snapshots of the repository, compares them by
// `path#symbol`, and writes `<name>.json` (the source of truth, also the review agent's input) and `<name>.html` (the
// human review page) to the output directory. Run it from the repository root; README.md beside it records the
// extraction rules and page design.
//
// Usage: tsx .agents/skills/contracts/scripts/contract-diff.ts [--mode diff|snapshot] [--comments doc|loose]
//          [--base git:main] [--head .] [--dir <dir>[,<dir>]] [--out .contracts] [--name contracts]
// ../config.json names the directories and their roles: `sourceDirs` hold declarations and their paired unit tests,
// `testDirs` hold scenario tests; the deepest listed directory decides a path's role, `sourceDirs` winning a tie.
// `--dir` narrows the report to the given directories without changing any role. `--name` sets the basename of the two output files, so
// several reports can sit side by side. A snapshot is either `git:<ref>` or the path of a checkout root; a checkout
// includes uncommitted and untracked files that git does not ignore. `--mode snapshot` reads only `--head` and lists
// every contract in it instead of comparing two snapshots.
//
// With `--comments doc` (the default) only doc comments count as contracts: `/** */` in TS and `<!-- @component -->`
// in Svelte. `--comments loose` also counts a run of `//` or `/* */` comments with no blank line between it and the
// exported declaration. A unit test is linked to a declaration by a `// Covers: a, b` line above it, or by an
// enclosing `describe('<declaration name>')`; a component's declaration name is its file name, such as `Dialog`.
// Scenario tests link to nothing.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseSvelte } from 'svelte/compiler';
import ts from 'typescript';

// Where a contract's doc comment came from: the language's doc comment (`/** */`, `<!-- @component -->`), a plain
// comment accepted by `--comments loose`, or nothing.
type DocStyle = 'doc' | 'plain' | 'none';

type Contract = { signature: string; doc: string; docStyle: DocStyle; body: string };

type CommentMode = 'doc' | 'loose';

type Declaration = Contract & {
  key: string;
  path: string;
  symbol: string;
  // The keyword the declaration is introduced with; a `const` holding a function expression counts as a function.
  // Public class members are declarations of their own, keyed `Class.member`. A Svelte file is one `component`.
  kind:
    | 'function'
    | 'type'
    | 'interface'
    | 'class'
    | 'enum'
    | 'const'
    | 'let'
    | 'var'
    | 'method'
    | 'getter'
    | 'setter'
    | 'component';
  // The enclosing class of a member declaration.
  parent?: string;
  signatureKey: string;
  bodyKey: string;
};

// Only executable declarations can be tested, so only they show a test section without linked tests, marked N/A;
// types, interfaces, enums and plain values show one only when a test does name them. Whether a declaration needs
// tests is the project's decision, so a missing one is shown, not warned about.
const testableKinds = new Set<Declaration['kind']>(['function', 'method', 'getter', 'setter', 'component']);

// A test's name is the titles of its enclosing `describe` blocks followed by its own, outermost first.
type RawTest = {
  name: string[];
  describe?: string;
  coversNames?: string[];
  identifiers: Set<string>;
  bodyKey: string;
};

type Test = { file: string; name: string[]; covers: string[]; bodyKey: string };

// Findings of the tool's own checks. `file` is a test file, `test` a test name as in Test, `key` a declaration key,
// and `symbol` a name written in a `Covers:` line.
type Warning =
  | { kind: 'test-file-without-source'; file: string; source: string }
  | { kind: 'test-unlinked'; file: string; test: string[] }
  | { kind: 'covers-unknown'; file: string; test: string[]; symbol: string }
  | { kind: 'covers-unreferenced'; file: string; test: string[]; key: string }
  | { kind: 'test-removed'; file: string; test: string[] };

// A source file's overview comment, taken from the head snapshot. In a diff report `before` holds the base
// overview when it differs from head ('' when the base had none); it is absent when nothing changed.
type FileDoc = { path: string; doc: string; docStyle: DocStyle; before?: string };

type Snapshot = {
  declarations: Map<string, Declaration>;
  files: FileDoc[];
  tests: Test[];
  warnings: Warning[];
  paths: Set<string>;
};

// A directory's description, read from the snapshot. `source` names the file it came from, or is empty when the
// directory has none. `before` works as in FileDoc.
type DirDoc = { path: string; doc: string; source: string; before?: string };

type Change = 'added' | 'removed' | 'signature' | 'doc' | 'impl' | 'unchanged';

type TestChange = 'added' | 'removed' | 'modified' | 'unchanged';

type Entry = {
  key: string;
  path: string;
  symbol: string;
  kind: Declaration['kind'];
  parent?: string;
  change: Change;
  before?: Contract;
  after?: Contract;
  tests: { file: string; name: string[]; change: TestChange }[];
};

type Report = {
  mode: 'diff' | 'snapshot';
  comments: CommentMode;
  base?: string;
  head: string;
  dir: string;
  directories: DirDoc[];
  files: FileDoc[];
  declarations: Entry[];
  warnings: Warning[];
};

// `paths` lists every file in the snapshot so a test file can look for its source among all of them; `files` holds
// only the TS, Svelte and CSS sources the extractor reads.
type SourceTree = { files: Map<string, string>; paths: Set<string> };

function readFiles(source: string, dirs: string[]): SourceTree {
  const files = new Map<string, string>();
  const paths = new Set<string>();
  // `Foo.test.svelte` is a harness that renders a component for its test, not a component of its own.
  const isSource = (path: string) =>
    (path.endsWith('.ts') && !path.endsWith('.d.ts')) ||
    (path.endsWith('.svelte') && !path.endsWith('.test.svelte')) ||
    path.endsWith('.css');
  if (source.startsWith('git:')) {
    const ref = source.slice(4);
    const listing = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', ...dirs], { encoding: 'utf8' });
    for (const path of listing.split('\n').filter(Boolean)) {
      paths.add(path);
      if (isSource(path)) files.set(path, execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' }));
    }
    return { files, paths };
  }
  // A working tree is read through git so ignored and generated files stay out, matching the `git:` form.
  const listing = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...dirs], {
    cwd: source,
    encoding: 'utf8',
  });
  for (const path of listing.split('\n').filter(Boolean)) {
    paths.add(path);
    if (isSource(path)) files.set(path, readFileSync(join(source, path), 'utf8'));
  }
  return { files, paths };
}

function readText(source: string, path: string): string | undefined {
  try {
    if (source.startsWith('git:'))
      return execFileSync('git', ['show', `${source.slice(4)}:${path}`], { encoding: 'utf8', stdio: 'pipe' });
    return readFileSync(join(source, path), 'utf8');
  } catch {
    return undefined;
  }
}

// A directory's description is its README.md, the place TS has for directory documentation. The leading
// `# title` line is dropped because the page already shows the directory path.
function readDirDocs(source: string, roots: string[], paths: Set<string>): DirDoc[] {
  const dirs = new Set<string>(roots);
  // Every ancestor up to its root counts, including directories that hold only subdirectories.
  for (const path of paths) {
    const root = roots.find((candidate) => path.startsWith(`${candidate}/`));
    if (!root) continue;
    for (let dir = parentDir(path); dir !== root && !dirs.has(dir); dir = parentDir(dir)) dirs.add(dir);
  }
  return [...dirs].sort().map((path) => {
    const candidate = `${path}/README.md`;
    const text = readText(source, candidate);
    if (text === undefined) return { path, doc: '', source: '' };
    return { path, doc: text.replace(/^# .*\n/, '').trim(), source: candidate };
  });
}

// The directory holding a path; top-level paths sit under `.`, the root of a report over several directories.
function parentDir(path: string): string {
  const index = path.lastIndexOf('/');
  return index < 0 ? '.' : path.slice(0, index);
}

// Leaf tokens compare code independently of formatting and comments.
function tokenKey(node: ts.Node, sourceFile: ts.SourceFile, skip: ReadonlySet<ts.Node> = new Set()): string {
  const tokens: string[] = [];
  const visit = (current: ts.Node) => {
    if (skip.has(current) || ts.isJSDoc(current)) return;
    const children = current.getChildren(sourceFile);
    if (children.length) children.forEach(visit);
    else tokens.push(current.getText(sourceFile));
  };
  visit(node);
  return tokens.join(' ');
}

function leadingComments(text: string, node: ts.Node): string[] {
  return (ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []).map((range) => text.slice(range.pos, range.end));
}

// A `/** */` comment counts even across a blank line, as it does in the TS language service. A plain comment counts
// only in loose mode, and only as part of the run that touches the declaration, so a file header or a commented-out
// block separated by a blank line stays out.
function docComment(
  text: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  mode: CommentMode,
  overview: ts.CommentRange[] = [],
): Pick<Contract, 'doc' | 'docStyle'> {
  const ranges = (ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []).filter(
    (range) => !overview.some((taken) => taken.pos === range.pos),
  );
  const last = ranges.at(-1);
  if (!last) return { doc: '', docStyle: 'none' };
  const lastText = text.slice(last.pos, last.end);
  if (lastText.startsWith('/**') && !lastText.startsWith('/**/'))
    return { doc: cleanComment(lastText, last.kind), docStyle: 'doc' };
  if (mode !== 'loose') return { doc: '', docStyle: 'none' };

  const isAdjacent = (end: number, next: number) => (text.slice(end, next).match(/\n/g)?.length ?? 0) <= 1;
  const run: ts.CommentRange[] = [];
  let next = node.getStart(sourceFile);
  for (let index = ranges.length - 1; index >= 0 && isAdjacent(ranges[index].end, next); index--) {
    run.unshift(ranges[index]);
    next = ranges[index].pos;
  }
  const doc = run
    .map((range) => cleanComment(text.slice(range.pos, range.end), range.kind))
    .join('\n')
    .trim();
  return doc ? { doc, docStyle: 'plain' } : { doc: '', docStyle: 'none' };
}

function cleanComment(comment: string, kind: ts.CommentKind): string {
  if (kind === ts.SyntaxKind.SingleLineCommentTrivia) return comment.replace(/^\/\/\s?/, '').trimEnd();
  return comment
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*? ?/, '').trimEnd())
    .join('\n')
    .trim();
}

const newlines = (text: string) => text.match(/\n/g)?.length ?? 0;

// Whether a comment's text opens with the file's own name, such as `article.ts implements …`.
function namesFile(doc: string, path: string): boolean {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return doc.startsWith(name) && /^(\s|[:,.]|$)/.test(doc.slice(name.length));
}

// A file overview is a top-level run of comments that opens with the file's name and is followed by a blank line
// (docs/code-style.md). Naming the file, rather than taking whatever comment opens it, keeps the overview apart from
// each language's own placement rules, such as a Go package comment or a `/** */` that the TS language service
// attaches to the next declaration across a blank line. In loose mode a run that opens the file and is followed by
// a blank line also counts, as a plain comment, for files written before the convention. `ranges` are the comments
// the overview took, so declaration extraction never reads them again.
function fileOverview(
  text: string,
  sourceFile: ts.SourceFile,
  mode: CommentMode,
): FileDoc & { ranges: ts.CommentRange[] } {
  const path = sourceFile.fileName;
  const runs: { ranges: ts.CommentRange[]; next: number }[] = [];
  for (const node of [...sourceFile.statements, sourceFile.endOfFileToken]) {
    const next = node.getStart(sourceFile);
    for (const range of ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []) {
      const current = runs.at(-1);
      if (current?.next === next && newlines(text.slice(current.ranges.at(-1)!.end, range.pos)) <= 1)
        current.ranges.push(range);
      else runs.push({ ranges: [range], next });
    }
  }
  const textOf = (ranges: ts.CommentRange[]) =>
    ranges
      .map((range) => cleanComment(text.slice(range.pos, range.end), range.kind))
      .join('\n')
      .trim();
  // A run that touches the next token is that token's comment, not a standalone overview.
  const standalone = runs.filter(
    (run) => run.next === text.length || newlines(text.slice(run.ranges.at(-1)!.end, run.next)) >= 2,
  );

  const named = standalone.find((run) => namesFile(textOf(run.ranges), path));
  if (named) return { path, doc: textOf(named.ranges), docStyle: 'doc', ranges: named.ranges };
  const opening = standalone[0];
  if (mode === 'loose' && opening && !text.slice(0, opening.ranges[0].pos).trim())
    return { path, doc: textOf(opening.ranges), docStyle: 'plain', ranges: opening.ranges };
  return { path, doc: '', docStyle: 'none', ranges: [] };
}

type TextEdit = { pos: number; end: number; replacement: string };

// The outermost function bodies in a node, its own included: those of functions, methods, accessors, constructors and function
// expressions, without descending into a body already collected.
function functionBodies(node: ts.Node): ts.Node[] {
  const bodies: ts.Node[] = [];
  const visit = (current: ts.Node) => {
    if (ts.isFunctionLike(current) && 'body' in current && current.body) {
      bodies.push(current.body as ts.Node);
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return bodies;
}

// Removes a body together with the whitespace before it, so `f(): T {…}` reads `f(): T`.
function dropEdit(body: ts.Node): TextEdit {
  return { pos: body.getFullStart(), end: body.end, replacement: '' };
}

// Replaces a body with an ellipsis that keeps its shape: `{ … }` for a block, `…` for an expression.
function elideEdit(body: ts.Node, sourceFile: ts.SourceFile): TextEdit {
  return { pos: body.getStart(sourceFile), end: body.end, replacement: ts.isBlock(body) ? '{ … }' : '…' };
}

// Applies non-overlapping edits to text[start, end) and tidies what removals leave behind: trailing spaces, and
// runs of blank lines.
function applyEdits(text: string, start: number, end: number, edits: TextEdit[]): string {
  let result = '';
  let cursor = start;
  for (const edit of [...edits].sort((x, y) => x.pos - y.pos)) {
    result += text.slice(cursor, Math.max(cursor, edit.pos)) + edit.replacement;
    cursor = Math.max(cursor, edit.end);
  }
  result += text.slice(cursor, end);
  return result
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\{\n\n/g, '{\n')
    .replace(/\n\n(\s*)\}/g, '\n$1}')
    .trim();
}

function isPrivateMember(member: ts.ClassElement): boolean {
  return (
    (member.name !== undefined && ts.isPrivateIdentifier(member.name)) ||
    (ts.canHaveModifiers(member) &&
      (ts.getModifiers(member) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword))
  );
}

// A class becomes a container and its public methods and accessors become declarations of their own, because a
// class written out in full is mostly implementation. The class signature keeps its heading, constructor
// signature and public fields; private members and every body count as its implementation.
function extractClass(
  path: string,
  statement: ts.ClassDeclaration,
  className: string,
  doc: Pick<Contract, 'doc' | 'docStyle'>,
  sourceFile: ts.SourceFile,
  mode: CommentMode,
): Declaration[] {
  const text = sourceFile.text;
  const members: Declaration[] = [];
  const edits: TextEdit[] = [];
  const hidden = new Set<ts.Node>();
  const implementation: ts.Node[] = [];

  for (const member of statement.members) {
    const isFunctionProperty =
      ts.isPropertyDeclaration(member) &&
      member.initializer !== undefined &&
      (ts.isArrowFunction(member.initializer) || ts.isFunctionExpression(member.initializer));
    const isCallable =
      ts.isMethodDeclaration(member) ||
      ts.isGetAccessorDeclaration(member) ||
      ts.isSetAccessorDeclaration(member) ||
      isFunctionProperty;

    if (isPrivateMember(member)) {
      edits.push({ pos: member.getFullStart(), end: member.end, replacement: '' });
      hidden.add(member);
      implementation.push(member);
      continue;
    }
    if (ts.isConstructorDeclaration(member) && member.body) {
      edits.push(dropEdit(member.body));
      hidden.add(member.body);
      implementation.push(member.body);
      continue;
    }
    if (!isCallable || !member.name) continue;

    edits.push({ pos: member.getFullStart(), end: member.end, replacement: '' });
    hidden.add(member);
    const memberName = member.name.getText(sourceFile);
    const ownBody = isFunctionProperty
      ? (member.initializer as ts.ArrowFunction | ts.FunctionExpression).body
      : (member as ts.MethodDeclaration | ts.AccessorDeclaration).body;
    const bodies = functionBodies(member);
    const memberEdits = bodies.map((body) => (body === ownBody ? dropEdit(body) : elideEdit(body, sourceFile)));
    members.push({
      key: `${path}#${className}.${memberName}`,
      path,
      symbol: `${className}.${memberName}`,
      kind: ts.isGetAccessorDeclaration(member) ? 'getter' : ts.isSetAccessorDeclaration(member) ? 'setter' : 'method',
      parent: className,
      signature: applyEdits(text, member.getStart(sourceFile), member.end, memberEdits),
      ...docComment(text, member, sourceFile, mode),
      body: bodies.map((body) => body.getText(sourceFile)).join('\n\n'),
      signatureKey: tokenKey(member, sourceFile, new Set(bodies)),
      bodyKey: bodies.map((body) => tokenKey(body, sourceFile)).join(' | '),
    });
  }

  const container: Declaration = {
    key: `${path}#${className}`,
    path,
    symbol: className,
    kind: 'class',
    signature: applyEdits(text, statement.getStart(sourceFile), statement.end, edits),
    ...doc,
    body: implementation.map((node) => node.getText(sourceFile)).join('\n\n'),
    signatureKey: tokenKey(statement, sourceFile, hidden),
    bodyKey: implementation.map((node) => tokenKey(node, sourceFile)).join(' | '),
  };
  return [container, ...members];
}

function extractFile(
  path: string,
  text: string,
  mode: CommentMode,
): { overview: FileDoc; declarations: Declaration[] } {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const { ranges: overviewRanges, ...overview } = fileOverview(text, sourceFile, mode);
  const declarations: Declaration[] = [];
  for (const statement of sourceFile.statements) {
    const exported =
      ts.canHaveModifiers(statement) &&
      ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    const doc = docComment(text, statement, sourceFile, mode, overviewRanges);

    if (ts.isClassDeclaration(statement)) {
      if (statement.name)
        declarations.push(...extractClass(path, statement, statement.name.text, doc, sourceFile, mode));
      continue;
    }

    let name: ts.Node | undefined;
    // The declaration's own function body is dropped from the signature; any other function body inside it, such
    // as a method in an exported object literal, is elided in place.
    let ownBody: ts.Node | undefined;
    let kind: Declaration['kind'];
    if (ts.isFunctionDeclaration(statement)) {
      name = statement.name;
      ownBody = statement.body;
      kind = 'function';
    } else if (ts.isVariableStatement(statement)) {
      const [declaration] = statement.declarationList.declarations;
      const initializer = declaration.initializer;
      const flags = statement.declarationList.flags;
      name = declaration.name;
      kind = flags & ts.NodeFlags.Const ? 'const' : flags & ts.NodeFlags.Let ? 'let' : 'var';
      if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
        ownBody = initializer.body;
        kind = 'function';
      }
    } else if (ts.isTypeAliasDeclaration(statement)) {
      name = statement.name;
      kind = 'type';
    } else if (ts.isInterfaceDeclaration(statement)) {
      name = statement.name;
      kind = 'interface';
    } else if (ts.isEnumDeclaration(statement)) {
      name = statement.name;
      kind = 'enum';
    } else {
      continue;
    }
    if (!name || !ts.isIdentifier(name)) continue;

    const bodies = functionBodies(statement);
    const edits = bodies.map((body) => (body === ownBody ? dropEdit(body) : elideEdit(body, sourceFile)));
    declarations.push({
      key: `${path}#${name.text}`,
      path,
      symbol: name.text,
      kind,
      signature: applyEdits(text, statement.getStart(sourceFile), statement.end, edits),
      ...doc,
      body: bodies.map((body) => body.getText(sourceFile)).join('\n\n'),
      signatureKey: tokenKey(statement, sourceFile, new Set(bodies)),
      bodyKey: bodies.map((body) => tokenKey(body, sourceFile)).join(' | '),
    });
  }
  return { overview, declarations };
}

// Removes the indentation a statement inherits from its `<script>` block, so it reads as it would at the top level
// of a module. `column` is the statement's own column; continuation lines lose up to that much leading space.
function dedent(text: string, column: number): string {
  const prefix = new RegExp(`^ {0,${column}}`);
  return text
    .split('\n')
    .map((line, index) => (index === 0 ? line : line.replace(prefix, '')))
    .join('\n');
}

// Svelte's own convention for a component's documentation, the one its language tools show on hover.
function componentDoc(comment: string): string {
  const lines = comment.replace(/^\s*@component\b/, '').split('\n');
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)![0].length));
  return lines
    .map((line) => line.slice(Number.isFinite(indent) ? indent : 0).trimEnd())
    .join('\n')
    .trim();
}

type SvelteNode = { type: string; start: number; end: number; data?: string };
type SvelteScript = {
  start: number;
  end: number;
  content: { start: number; end: number };
  attributes: { name: string; start: number; end: number }[];
};

// A Svelte component is one declaration named after its file, the name consumers import it by. Its contract is the
// `<!-- @component -->` comment, the `generics` attribute, and its type written as
// `declare const Name: Component<Props, {}, Bindings>` after the local types the props annotation reaches; the
// instance script, including the `$props()` statement, the markup and the styles are its implementation.
// Exports of `<script module>` are extracted as a TS module's are, under the same file.
function extractComponent(
  path: string,
  text: string,
  mode: CommentMode,
): { overview: FileDoc; declarations: Declaration[] } {
  const ast = parseSvelte(text, { modern: true }) as unknown as {
    fragment: { nodes: SvelteNode[] };
    instance: SvelteScript | null;
    module: SvelteScript | null;
  };
  const declarations: Declaration[] = [];
  if (ast.module) {
    const { start, end } = ast.module.content;
    declarations.push(...extractFile(path, text.slice(start, end), mode).declarations);
  }

  const docNode = ast.fragment.nodes.find((node) => node.type === 'Comment' && /^\s*@component\b/.test(node.data!));
  const script = ast.instance ? text.slice(ast.instance.content.start, ast.instance.content.end) : '';
  const sourceFile = ts.createSourceFile(path, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const generics = ast.instance?.attributes.find((attribute) => attribute.name === 'generics');
  const genericsText = generics ? text.slice(generics.start, generics.end) : '';

  const isPropsCall = (expression: ts.Expression | undefined) =>
    expression !== undefined &&
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === '$props';
  const isBindable = (expression: ts.Expression | undefined) =>
    expression !== undefined &&
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === '$bindable';
  const sliceOf = (node: ts.Node, edits: TextEdit[] = []) => {
    const start = node.getStart(sourceFile);
    return dedent(applyEdits(script, start, node.end, edits), start - script.lastIndexOf('\n', start - 1) - 1);
  };

  const localTypes = new Map<string, ts.Statement>();
  for (const statement of sourceFile.statements)
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement))
      localTypes.set(statement.name.text, statement);
  // Every local type named from the props annotation, directly or through another local type, is part of the
  // contract; imported types keep their own contracts in their own files.
  const contract = new Set<ts.Statement>();
  const reach = (node: ts.Node) => {
    const local = ts.isIdentifier(node) ? localTypes.get(node.text) : undefined;
    if (local && !contract.has(local)) {
      contract.add(local);
      ts.forEachChild(local, reach);
    }
    ts.forEachChild(node, reach);
  };
  // The component's type is what consumers see, as Svelte's language tools derive it: the props annotation, and
  // the props declared with `$bindable()`. The `$props()` statement itself stays implementation, so local names and
  // default values in its destructuring change no contract.
  let propsType = 'Record<string, never>';
  const bindings: string[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const props = statement.declarationList.declarations.find((declaration) => isPropsCall(declaration.initializer));
    if (!props) continue;
    propsType = props.type ? sliceOf(props.type) : 'Record<string, any>';
    if (props.type) reach(props.type);
    if (ts.isObjectBindingPattern(props.name))
      for (const element of props.name.elements)
        if (isBindable(element.initializer)) bindings.push((element.propertyName ?? element.name).getText(sourceFile));
  }

  const symbol = path.slice(path.lastIndexOf('/') + 1).replace(/\.svelte$/, '');
  const typeArguments = bindings.length
    ? `${propsType}, {}, ${bindings.map((name) => `'${name}'`).join(' | ')}`
    : propsType;
  const typeText = [
    ...sourceFile.statements
      .filter((statement) => contract.has(statement))
      .map((statement) =>
        sliceOf(
          statement,
          functionBodies(statement).map((body) => elideEdit(body, sourceFile)),
        ),
      ),
    `declare const ${symbol}: Component<${typeArguments}>;`,
  ].join('\n\n');
  const implementation = sourceFile.statements.filter((statement) => !contract.has(statement));
  // Markup and styles reach the implementation as text; comments and whitespace in them carry no behavior.
  const cuts = [ast.instance, ast.module, docNode]
    .filter((node): node is SvelteNode | SvelteScript => !!node)
    .sort((a, b) => a.start - b.start);
  let markup = '';
  let cursor = 0;
  for (const cut of cuts) {
    markup += text.slice(cursor, cut.start);
    cursor = cut.end;
  }
  markup = (markup + text.slice(cursor)).trim();

  const typeFile = ts.createSourceFile(path, typeText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  declarations.unshift({
    key: `${path}#${symbol}`,
    path,
    symbol,
    kind: 'component',
    signature: [genericsText, typeText].filter(Boolean).join('\n\n'),
    ...(docNode ? { doc: componentDoc(docNode.data!), docStyle: 'doc' } : { doc: '', docStyle: 'none' }),
    body: [...implementation.map((statement) => statement.getText(sourceFile)), markup].filter(Boolean).join('\n\n'),
    signatureKey: [genericsText, tokenKey(typeFile, typeFile)].join(' | '),
    bodyKey: [
      ...implementation.map((statement) => tokenKey(statement, sourceFile)),
      markup.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' '),
    ].join(' | '),
  });
  return { overview: { path, doc: '', docStyle: 'none' }, declarations };
}

// A stylesheet declares nothing to extract, but its importers depend on what it styles, so its file overview is
// kept: a top-level comment opening with the file's name, or in loose mode the comment that opens the file and is
// followed by a blank line, as for TS files.
function extractStylesheet(
  path: string,
  text: string,
  mode: CommentMode,
): { overview: FileDoc; declarations: Declaration[] } {
  const comments = [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((match) =>
    cleanComment(match[0], ts.SyntaxKind.MultiLineCommentTrivia),
  );
  const named = comments.find((doc) => namesFile(doc, path));
  if (named) return { overview: { path, doc: named, docStyle: 'doc' }, declarations: [] };
  const opening = text.match(/^\s*(\/\*[\s\S]*?\*\/)[ \t]*\n[ \t]*\n/)?.[1];
  const doc = mode === 'loose' && opening ? cleanComment(opening, ts.SyntaxKind.MultiLineCommentTrivia) : '';
  return { overview: { path, doc, docStyle: doc ? 'plain' : 'none' }, declarations: [] };
}

// Resolves `it.each(...)(...)`, `describe.skip(...)`, and similar forms to the runner function they start from.
function runnerName(callee: ts.Expression): string | undefined {
  let current = callee;
  while (ts.isPropertyAccessExpression(current) || ts.isCallExpression(current)) current = current.expression;
  return ts.isIdentifier(current) ? current.text : undefined;
}

function extractTests(path: string, text: string): RawTest[] {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const tests: RawTest[] = [];
  const visit = (node: ts.Node, describes: string[]) => {
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const call = node.expression;
      const runner = runnerName(call.expression);
      const [title, callback] = call.arguments;
      if (title && ts.isStringLiteralLike(title) && runner === 'describe') {
        if (callback) ts.forEachChild(callback, (child) => visit(child, [...describes, title.text]));
        return;
      }
      if (title && ts.isStringLiteralLike(title) && (runner === 'it' || runner === 'test')) {
        const identifiers = new Set<string>();
        const collect = (child: ts.Node) => {
          if (ts.isIdentifier(child)) identifiers.add(child.text);
          ts.forEachChild(child, collect);
        };
        collect(call);

        const covers = leadingComments(text, node)
          .join('\n')
          .match(/Covers:\s*([^\n*]+)/);
        tests.push({
          name: [...describes, title.text],
          describe: describes.at(-1),
          coversNames: covers?.[1].split(',').map((name) => name.trim()),
          identifiers,
          bodyKey: tokenKey(call, sourceFile),
        });
        return;
      }
    }
    ts.forEachChild(node, (child) => visit(child, describes));
  };
  visit(sourceFile, []);
  return tests;
}

const testFilePattern = /\.(type-)?test\.ts$/;

// Which directories a report reads and what each path in them is: `roots` are the top-level directories to list, and
// `roleOf` names a path's role, or undefined outside every configured directory.
type Layout = { roots: string[]; roleOf: (path: string) => 'source' | 'test' | undefined };

const within = (path: string, dir: string) => path === dir || path.startsWith(`${dir}/`);

function readLayout(scope: string[]): Layout {
  const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8')) as {
    sourceDirs: string[];
    testDirs: string[];
  };
  const roles = [
    ...config.sourceDirs.map((dir) => ({ dir, role: 'source' as const })),
    ...config.testDirs.map((dir) => ({ dir, role: 'test' as const })),
  ];
  // A scope directory inside a configured one is read on its own; a configured one inside the scope is read whole.
  const candidates = roles.flatMap(({ dir }) =>
    scope.length ? scope.flatMap((part) => (within(part, dir) ? [part] : within(dir, part) ? [dir] : [])) : [dir],
  );
  const roots = [...new Set(candidates)].filter(
    (dir, _, all) => !all.some((other) => other !== dir && within(dir, other)),
  );
  const roleOf = (path: string) => {
    const matches = roles.filter(({ dir }) => within(path, dir));
    // Deepest directory first; at equal depth a source directory wins.
    matches.sort((a, b) => b.dir.length - a.dir.length || (a.role === 'source' ? -1 : 1));
    return matches[0]?.role;
  };
  return { roots: roots.sort(), roleOf };
}

function takeSnapshot(source: string, layout: Layout, mode: CommentMode): Snapshot {
  const { files, paths } = readFiles(source, layout.roots);
  const isTestFile = (path: string) => testFilePattern.test(path);
  const declarations = new Map<string, Declaration>();
  const overviews: FileDoc[] = [];
  for (const [path, text] of files) {
    if (isTestFile(path) || layout.roleOf(path) !== 'source') continue;
    const extracted = path.endsWith('.svelte')
      ? extractComponent(path, text, mode)
      : path.endsWith('.css')
        ? extractStylesheet(path, text, mode)
        : extractFile(path, text, mode);
    overviews.push(extracted.overview);
    for (const declaration of extracted.declarations) {
      declarations.set(declaration.key, declaration);
    }
  }

  const tests: Test[] = [];
  const warnings: Warning[] = [];
  for (const [path, text] of files) {
    if (!isTestFile(path)) continue;
    // `Foo.svelte.test.ts` belongs to `Foo.svelte`, so only a leftover `.svelte`/`.svelte.ts` suffix decides.
    const stem = path.replace(testFilePattern, '');
    const sourcePath = stem.endsWith('.svelte') ? stem : `${stem}.ts`;
    // Scenario tests state their purpose and script and link to no declaration. They are still recorded so removing
    // one is reported.
    // A unit test file without its source is reported once as a whole rather than test by test.
    const scenario = layout.roleOf(path) === 'test';
    if (scenario || !paths.has(sourcePath)) {
      if (!scenario) warnings.push({ kind: 'test-file-without-source', file: path, source: sourcePath });
      for (const raw of extractTests(path, text))
        tests.push({ file: path, name: raw.name, covers: [], bodyKey: raw.bodyKey });
      continue;
    }

    const resolve = (name: string): string | undefined =>
      declarations.has(`${sourcePath}#${name}`) ? `${sourcePath}#${name}` : undefined;

    for (const raw of extractTests(path, text)) {
      const names = raw.coversNames ?? (raw.describe && resolve(raw.describe) ? [raw.describe] : []);
      if (!names.length) warnings.push({ kind: 'test-unlinked', file: path, test: raw.name });

      const covers: string[] = [];
      for (const name of names) {
        const key = resolve(name);
        if (!key) {
          warnings.push({ kind: 'covers-unknown', file: path, test: raw.name, symbol: name });
          continue;
        }
        // Only a `Covers:` line is checked against the body: under `describe` the call may go through an alias, such
        // as a remote function cast to its handler type. `Class.member` counts when the test names both parts.
        if (raw.coversNames && !name.split('.').every((part) => raw.identifiers.has(part)))
          warnings.push({ kind: 'covers-unreferenced', file: path, test: raw.name, key });
        covers.push(key);
      }
      tests.push({ file: path, name: raw.name, covers, bodyKey: raw.bodyKey });
    }
  }

  return { declarations, files: overviews, tests, warnings, paths };
}

// The comments inside a signature, such as those on interface members or component props, as one prose text.
// Signature keys are built from tokens and never see them.
function signatureComments(signature: string): string {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, signature);
  const comments: string[] = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan())
    if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia)
      comments.push(cleanComment(scanner.getTokenText(), token));
  return normalizeProse(comments.join('\n\n'));
}

function classify(before: Declaration | undefined, after: Declaration | undefined): Change {
  if (!before) return 'added';
  if (!after) return 'removed';
  if (before.signatureKey !== after.signatureKey) return 'signature';
  if (
    normalizeProse(before.doc) !== normalizeProse(after.doc) ||
    signatureComments(before.signature) !== signatureComments(after.signature)
  )
    return 'doc';
  if (before.bodyKey !== after.bodyKey) return 'impl';
  return 'unchanged';
}

function compare(base: Snapshot, head: Snapshot): { declarations: Entry[]; warnings: Warning[] } {
  const contract = (declaration: Declaration | undefined): Contract | undefined =>
    declaration && {
      signature: declaration.signature,
      doc: declaration.doc,
      docStyle: declaration.docStyle,
      body: declaration.body,
    };
  const testId = (test: Test) => [test.file, ...test.name].join('\n');
  const baseTests = new Map(base.tests.map((test) => [testId(test), test]));
  const headTests = new Map(head.tests.map((test) => [testId(test), test]));
  const warnings = [...head.warnings];
  for (const [id, test] of baseTests)
    if (!headTests.has(id)) warnings.push({ kind: 'test-removed', file: test.file, test: test.name });

  const keys = [...new Set([...base.declarations.keys(), ...head.declarations.keys()])].sort();
  const declarations = keys.map((key): Entry => {
    const before = base.declarations.get(key);
    const after = head.declarations.get(key);
    const { path, symbol, kind, parent } = (after ?? before)!;
    const tests: Entry['tests'] = [];
    for (const [id, test] of headTests) {
      if (!test.covers.includes(key)) continue;
      const previous = baseTests.get(id);
      const change = !previous ? 'added' : previous.bodyKey !== test.bodyKey ? 'modified' : 'unchanged';
      tests.push({ file: test.file, name: test.name, change });
    }
    for (const [id, test] of baseTests)
      if (test.covers.includes(key) && !headTests.has(id))
        tests.push({ file: test.file, name: test.name, change: 'removed' });
    return {
      key,
      path,
      symbol,
      kind,
      parent,
      change: classify(before, after),
      before: contract(before),
      after: contract(after),
      tests,
    };
  });
  return { declarations, warnings };
}

// Word-level diff by longest common subsequence; contracts are short enough for the quadratic table.
type DiffOp = { op: 'same' | 'del' | 'ins'; text: string };

function diffOps(before: string, after: string): DiffOp[] {
  const split = (text: string) => text.match(/\s+|\w+|[^\s\w]/g) ?? [];
  const a = split(before);
  const b = split(after);
  const lengths = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      ops.push({ op: 'same', text: a[i++] });
      j++;
    } else if (j >= b.length || (i < a.length && lengths[i + 1][j] >= lengths[i][j + 1])) {
      ops.push({ op: 'del', text: a[i++] });
    } else {
      ops.push({ op: 'ins', text: b[j++] });
    }
  }
  return coalesce(ops);
}

// Whitespace kept between two changed tokens joins the change, so an edited phrase reads as one deletion and one
// insertion instead of a highlight per word.
function coalesce(ops: DiffOp[]): DiffOp[] {
  const result: DiffOp[] = [];
  let index = 0;
  while (index < ops.length) {
    if (ops[index].op === 'same') {
      result.push(ops[index++]);
      continue;
    }
    let end = index;
    for (let next = index; next < ops.length; next++) {
      if (ops[next].op !== 'same') end = next;
      else if (!/^\s+$/.test(ops[next].text)) break;
    }
    const segment = ops.slice(index, end + 1);
    const side = (op: 'del' | 'ins') =>
      segment
        .filter((item) => item.op === op || item.op === 'same')
        .map((item) => item.text)
        .join('');
    const removed = side('del');
    const inserted = side('ins');
    if (segment.some((item) => item.op === 'del')) result.push({ op: 'del', text: removed });
    if (segment.some((item) => item.op === 'ins')) result.push({ op: 'ins', text: inserted });
    index = end + 1;
  }
  return result;
}

// Lines compared by longest common subsequence; signatures are short enough for the quadratic table.
function lineOps(before: string[], after: string[]): { op: 'same' | 'del' | 'ins'; line: string }[] {
  const lengths = Array.from({ length: before.length + 1 }, () => new Array<number>(after.length + 1).fill(0));
  for (let i = before.length - 1; i >= 0; i--)
    for (let j = after.length - 1; j >= 0; j--)
      lengths[i][j] =
        before[i] === after[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
  const ops: { op: 'same' | 'del' | 'ins'; line: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      ops.push({ op: 'same', line: before[i++] });
      j++;
    } else if (j >= after.length || (i < before.length && lengths[i + 1][j] >= lengths[i][j + 1])) {
      ops.push({ op: 'del', line: before[i++] });
    } else {
      ops.push({ op: 'ins', line: after[j++] });
    }
  }
  return ops;
}

// Splits word-diff ops for one side into HTML lines, wrapping changed text without letting a tag span a line.
function sideLines(ops: DiffOp[], side: 'del' | 'ins'): string[] {
  const lines = [''];
  for (const { op, text } of ops) {
    if (op !== 'same' && op !== side) continue;
    text.split('\n').forEach((piece, index) => {
      if (index > 0) lines.push('');
      if (piece)
        lines[lines.length - 1] += op === 'same' ? escapeHtml(piece) : `<${side}>${escapeHtml(piece)}</${side}>`;
    });
  }
  return lines;
}

// A unified diff like git's: unchanged lines once, removed lines marked −, added lines marked +. Where a run of
// removed lines is replaced by added lines, the words that actually changed are highlighted inside them.
function renderSignatureDiff(before: string, after: string): string {
  const ops = lineOps(before.split('\n'), after.split('\n'));
  const row = (kind: 'same' | 'del' | 'ins', html: string) =>
    `<div class="ln ln-${kind}"><span class="sign">${kind === 'del' ? '−' : kind === 'ins' ? '+' : ' '}</span><span>${html || ' '}</span></div>`;
  const rows: string[] = [];
  let index = 0;
  while (index < ops.length) {
    if (ops[index].op === 'same') {
      rows.push(row('same', escapeHtml(ops[index++].line)));
      continue;
    }
    const removed: string[] = [];
    const added: string[] = [];
    while (index < ops.length && ops[index].op !== 'same') {
      if (ops[index].op === 'del') removed.push(ops[index].line);
      else added.push(ops[index].line);
      index++;
    }
    if (removed.length && added.length) {
      const words = diffOps(removed.join('\n'), added.join('\n'));
      rows.push(...sideLines(words, 'del').map((html) => row('del', html)));
      rows.push(...sideLines(words, 'ins').map((html) => row('ins', html)));
    } else {
      rows.push(...removed.map((line) => row('del', escapeHtml(line))));
      rows.push(...added.map((line) => row('ins', escapeHtml(line))));
    }
  }
  return `<pre class="sig sig-diff">${rows.join('')}</pre>`;
}

// Descriptions are prose reflowed by formatters, so line breaks inside a paragraph carry no meaning; only blank
// lines separating paragraphs do.
function normalizeProse(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .join('\n\n');
}

// Prose reads better as one text with deletions and insertions inline than as two columns.
function renderProseDiff(before: string, after: string): string {
  const html = diffOps(normalizeProse(before), normalizeProse(after))
    .map(({ op, text }) => {
      const escaped = escapeHtml(text);
      if (op === 'same' || /^\s+$/.test(text)) return escaped;
      return op === 'del' ? `<del class="inline">${escaped}</del>` : `<ins>${escaped}</ins>`;
    })
    .join('');
  return html
    .split(/\n\n/)
    .map(
      (paragraph) =>
        `<p>${paragraph.replace(/\[([^\]]+)\]\([^)<]+\)/g, '$1').replace(/`([^`<]+)`/g, '<code>$1</code>')}</p>`,
    )
    .join('');
}

const changeLabels: Record<Change | 'tests', string> = {
  added: '新增',
  removed: '删除',
  signature: '签名变更',
  doc: '仅注释变更',
  impl: '实现变更、契约未变',
  tests: '仅测试变更',
  unchanged: '未变更',
};
const testMarks: Record<TestChange, string> = { added: '+', removed: '−', modified: '~', unchanged: '·' };

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);
}

const docStyleLabels: Record<DocStyle, string> = { doc: '文档注释', plain: '// 普通注释', none: '无注释' };

const testTitle = (name: string[]) => name.join(' › ');

function warningText(warning: Warning): string {
  switch (warning.kind) {
    case 'test-file-without-source':
      return `${warning.file}：找不到对应的源文件 ${warning.source}`;
    case 'test-unlinked':
      return `${warning.file}：测试「${testTitle(warning.test)}」没有关联任何声明`;
    case 'covers-unknown':
      return `${warning.file}：测试「${testTitle(warning.test)}」关联的声明 ${warning.symbol} 不存在`;
    case 'covers-unreferenced':
      return `${warning.file}：测试「${testTitle(warning.test)}」没有引用 ${warning.key}`;
    case 'test-removed':
      return `${warning.file}：测试「${testTitle(warning.test)}」被删除`;
  }
}

// Renders the small Markdown subset comments and directory descriptions use: paragraphs separated by blank lines,
// inline code, and links. Wrapped lines join into one paragraph, as godoc does. Links become plain text because
// their targets are relative to the file they were written in, not to this page.
function renderMarkdown(markdown: string): string {
  return normalizeProse(markdown)
    .split('\n\n')
    .filter(Boolean)
    .map((paragraph) => `<p>${renderInline(paragraph)}</p>`)
    .join('');
}

// Tests are grouped under their file, which by the linking rules is normally the declaration's own test file, so
// each test shows only its intent. A leading `describe(<declaration>)` adds nothing beside the declaration and is
// dropped; tests under any other describe are listed beneath it once. Diff marks appear only for tests that
// changed.
function renderTests(entry: Entry): string {
  if (!entry.tests.length && !testableKinds.has(entry.kind)) return '';
  const head = (file: string) => `<div class="tests-head"><span class="tests-title">Tests</span>${file}</div>`;
  if (!entry.tests.length) return `<div class="tests">${head('<span class="tests-na">N/A</span>')}</div>`;

  const byFile = new Map<string, Entry['tests']>();
  for (const test of entry.tests) byFile.set(test.file, [...(byFile.get(test.file) ?? []), test]);
  const item = (test: Entry['tests'][number], title: string) => {
    const mark = test.change === 'unchanged' ? '' : `<span class="mark">${testMarks[test.change]}</span>`;
    return `<li class="t-${test.change}">${mark}${escapeHtml(title)}</li>`;
  };
  return [...byFile]
    .map(([file, tests]) => {
      // Tests sharing an enclosing describe are listed once under it instead of repeating it on every line.
      const byContext = new Map<string, string[]>();
      for (const test of tests) {
        const parts = test.name.length > 1 && test.name[0] === entry.symbol ? test.name.slice(1) : test.name;
        const context = parts.slice(0, -1).join(' › ');
        byContext.set(context, [...(byContext.get(context) ?? []), item(test, parts.at(-1)!)]);
      }
      const items = [...byContext]
        .map(([context, lines]) =>
          context
            ? `<li class="tests-group"><span class="tests-context">${escapeHtml(context)}</span><ul>${lines.join('')}</ul></li>`
            : lines.join(''),
        )
        .join('');
      return `<div class="tests">${head(`<code class="tests-file">${escapeHtml(file)}</code>`)}<ul>${items}</ul></div>`;
    })
    .join('');
}

function entryCategory(entry: Entry): Change | 'tests' {
  const testsChanged = entry.tests.some((test) => test.change !== 'unchanged');
  return entry.change === 'unchanged' && testsChanged ? 'tests' : entry.change;
}

const anchorOf = (prefix: string, path: string) => `${prefix}-${encodeURIComponent(path).replace(/[%.]/g, '_')}`;

// One declaration in godoc order: keyword and name, then the signature, then the doc comment.
function renderEntry(entry: Entry, mode: Report['mode']): string {
  const contract = (entry.after ?? entry.before)!;
  const category = entryCategory(entry);
  const id = anchorOf('e', entry.key);
  const styleTag =
    mode === 'diff' || contract.docStyle === 'doc'
      ? ''
      : `<span class="tag s-${contract.docStyle}">${docStyleLabels[contract.docStyle]}</span>`;
  const kindLabel = entry.kind === 'getter' ? 'get' : entry.kind === 'setter' ? 'set' : entry.kind;
  // A member keeps its class as a muted prefix: the diff view may hide an unchanged class above it.
  const owner = entry.parent ? `<span class="owner">${escapeHtml(entry.parent)}.</span>` : '';
  const shortName = entry.parent ? entry.symbol.slice(entry.parent.length + 1) : entry.symbol;
  const changeTag = mode === 'diff' ? `<span class="badge b-${category}">${changeLabels[category]}</span>` : '';
  const heading = `<h4><span class="kw">${kindLabel}</span> <a class="name" href="#${id}">${owner}${escapeHtml(shortName)}</a>${changeTag}${styleTag}</h4>`;

  let body: string;
  if (mode === 'diff' && entry.before && entry.after && (entry.change === 'signature' || entry.change === 'doc')) {
    // One column: the signature as a unified line diff, the comment as inline prose diff, each only when it
    // changed.
    const { before, after } = entry;
    const signature =
      before.signature === after.signature
        ? `<pre class="sig">${escapeHtml(after.signature)}</pre>`
        : renderSignatureDiff(before.signature, after.signature);
    const docChanged = normalizeProse(before.doc) !== normalizeProse(after.doc);
    const doc = docChanged
      ? `<div class="doc">${renderProseDiff(before.doc, after.doc)}</div>`
      : after.doc
        ? `<div class="doc">${renderMarkdown(after.doc)}</div>`
        : '';
    body = signature + doc;
  } else {
    body = `${`<pre class="sig">${escapeHtml(contract.signature)}</pre>`}${contract.doc ? `<div class="doc">${renderMarkdown(contract.doc)}</div>` : ''}`;
  }
  const note =
    entry.change === 'impl'
      ? '<p class="note">实现已变更，但签名和注释没有变化：需要 review agent 核对契约是否仍然成立。</p>'
      : '';
  return `<article class="entry" id="${id}" data-change="${category}" data-doc="${contract.docStyle}">
${heading}${note}${body}${renderTests(entry)}
</article>`;
}

type FileGroup = { path: string; name: string; doc?: FileDoc; entries: Entry[] };

// One directory in the nested view: its own files first, then its subdirectories, mirroring the file system.
type DirNode = { path: string; name: string; doc: DirDoc; files: FileGroup[]; children: DirNode[] };

// Builds the directory tree under `report.dir`, or under `.` when it names several directories. Every described
// directory and every extracted file appears, even without declarations, and directories with no files of their own
// are still created so each subdirectory hangs under its real parent.
function buildTree(report: Report): DirNode {
  const dirs = report.dir.split(',');
  const root = dirs.length === 1 ? dirs[0] : '.';
  const dirDocs = new Map(report.directories.map((doc) => [doc.path, doc]));
  const fileDocs = new Map(report.files.map((doc) => [doc.path, doc]));
  const nodes = new Map<string, DirNode>();
  const nodeOf = (path: string): DirNode => {
    const existing = nodes.get(path);
    if (existing) return existing;
    const node: DirNode = {
      path,
      name: path === root ? root : path.slice(path.lastIndexOf('/') + 1),
      doc: dirDocs.get(path) ?? { path, doc: '', source: '' },
      files: [],
      children: [],
    };
    nodes.set(path, node);
    if (path !== root) nodeOf(parentDir(path)).children.push(node);
    return node;
  };
  const fileOf = (path: string): FileGroup => {
    const dir = nodeOf(parentDir(path));
    let file = dir.files.find((candidate) => candidate.path === path);
    if (!file) {
      file = { path, name: path.slice(path.lastIndexOf('/') + 1), doc: fileDocs.get(path), entries: [] };
      dir.files.push(file);
    }
    return file;
  };

  nodeOf(root);
  for (const doc of report.directories) nodeOf(doc.path);
  for (const doc of report.files) fileOf(doc.path);
  for (const entry of report.declarations) fileOf(entry.path).entries.push(entry);
  for (const node of nodes.values()) {
    node.files.sort((a, b) => a.path.localeCompare(b.path));
    node.children.sort((a, b) => a.path.localeCompare(b.path));
  }
  return nodeOf(root);
}

// Merges a directory that has no description, no files and a single subdirectory into that subdirectory's row,
// as editors' compact folders do, so chains such as `a/[articleId]` cost one level of indentation. The root stays.
function compactChains(node: DirNode, isRoot = true): DirNode {
  const children = node.children.map((child) => compactChains(child, false));
  const [only] = children;
  if (!isRoot && !node.doc.source && !node.files.length && children.length === 1)
    return { ...only, name: `${node.name}/${only.name}` };
  return { ...node, children };
}

function allEntries(node: DirNode): Entry[] {
  return [...node.files.flatMap((file) => file.entries), ...node.children.flatMap(allEntries)];
}

// Snapshot rows count missing comments; diff rows count changed declarations instead, since that is what a
// reviewer scans for.
function countLine(entries: Entry[], mode: Report['mode'], prefix = ''): string {
  const total = `<span class="pill">${entries.length} 声明</span>`;
  if (mode === 'diff') {
    const changed = entries.filter((entry) => entryCategory(entry) !== 'unchanged').length;
    return `<span class="counts">${prefix}${changed ? `<span class="pill changed">${changed} 变更</span>` : ''}${total}</span>`;
  }
  const missing = entries.filter((entry) => (entry.after ?? entry.before)!.docStyle === 'none').length;
  const missingPill = missing ? `<span class="pill missing">${missing} 无注释</span>` : '';
  return `<span class="counts">${prefix}${total}${missingPill}</span>`;
}

// The diff view keeps only files and directories with a changed declaration or description, plus the
// directories leading to them; unchanged
// declarations inside those files stay available through the 未变更 filter.
function pruneUnchanged(node: DirNode): DirNode | undefined {
  const files = node.files.filter(
    (file) => file.doc?.before !== undefined || file.entries.some((entry) => entryCategory(entry) !== 'unchanged'),
  );
  const children = node.children.map(pruneUnchanged).filter((child): child is DirNode => child !== undefined);
  return files.length || children.length || node.doc.before !== undefined ? { ...node, files, children } : undefined;
}

const icons = {
  unfold: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 6 8 3l3 3M5 10l3 3 3-3"/></svg>',
  fold: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l3 3 3-3M5 13l3-3 3 3"/></svg>',
  // Separate open and closed glyphs, drawn so both end at the same x: a rotated chevron would be wider when open
  // and crowd the icon beside it.
  chevron:
    '<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path class="c-open" d="M4.5 6.5 8 10l3.5-3.5"/><path class="c-closed" d="M8 4.5 11.5 8 8 11.5"/></svg>',
  folder:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.75 3.5h4.1l1.5 1.5h6.9v7.75H1.75z"/></svg>',
  file: '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.25 1.75h6l3.5 3.5v9H3.25z M9.25 1.75v3.5h3.5"/></svg>',
};

// The first sentence of a description, shown on a collapsed row the way godoc lists package synopses.
function synopsis(markdown: string): string {
  const paragraph = markdown
    .trim()
    .split(/\n\s*\n/)[0]
    .replace(/\s*\n\s*/g, ' ');
  const sentence = paragraph.match(/^.*?[.。](?=\s|$)/)?.[0] ?? paragraph;
  const html = escapeHtml(sentence)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  return html ? `<span class="synopsis">${html}</span>` : '';
}

const docChangedPill = '<span class="pill changed">说明变更</span>';

// Directory and file descriptions are body text, set like declaration comments; a changed one shows as an inline
// prose diff.
function renderDirDoc(doc: DirDoc): string {
  if (!doc.source) return '';
  const prose = doc.before !== undefined ? renderProseDiff(doc.before, doc.doc) : renderMarkdown(doc.doc);
  return `<div class="prose dir-doc">${prose}<p class="source">来源 <code>${escapeHtml(doc.source)}</code></p></div>`;
}

function renderFileDoc(doc: FileDoc | undefined): string {
  if (!doc?.doc && doc?.before === undefined) return '';
  const prose = doc.before !== undefined ? renderProseDiff(doc.before, doc.doc) : renderMarkdown(doc.doc);
  return `<div class="prose file-doc">${prose}</div>`;
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderFile(file: FileGroup, mode: Report['mode']): string {
  // Members render right after their class as ordinary entries; the class prefix in their name is the only link,
  // so the change filters can hide or show each one alone.
  const ordered = file.entries
    .filter((entry) => !entry.parent)
    .flatMap((entry) => [entry, ...file.entries.filter((member) => member.parent === entry.symbol)]);
  const entries = ordered.map((entry) => renderEntry(entry, mode)).join('\n');
  const counts = countLine(file.entries, mode, file.doc?.before !== undefined ? docChangedPill : '');
  return `<details class="file" id="${anchorOf('f', file.path)}" data-crumb="file" data-name="${escapeHtml(file.name)}" open>
<summary class="file-head">${icons.chevron}${icons.file}<h3>${escapeHtml(file.name)}</h3>${synopsis(file.doc?.doc ?? '')}${counts}</summary>
${renderFileDoc(file.doc)}
${entries || '<p class="muted entry">没有导出声明</p>'}
</details>`;
}

// A directory renders like an editor's file tree: its body hangs off an indent guide that starts under the header's
// chevron and collapses the whole subtree when clicked, and the header keeps a recursive count so a collapsed
// subtree still says what it holds.
function renderDir(node: DirNode, mode: Report['mode']): string {
  const subdirs = node.children.length ? `<span class="pill">${node.children.length} 子目录</span>` : '';
  const counts = countLine(allEntries(node), mode, (node.doc.before !== undefined ? docChangedPill : '') + subdirs);
  const label = escapeHtml(node.path);
  const actions = `<span class="actions"><button type="button" data-fold="open" title="展开全部子项" aria-label="展开 ${label}/ 的全部子项">${icons.unfold}</button><button type="button" data-fold="close" title="收起全部子项" aria-label="收起 ${label}/ 的全部子项">${icons.fold}</button></span>`;
  const empty = node.files.length || node.children.length ? '' : '<p class="muted">没有提取到导出声明</p>';
  return `<details class="dir" id="${anchorOf('d', node.path)}" data-crumb="dir" data-name="${escapeHtml(node.name)}" open>
<summary class="dir-head">${icons.chevron}${icons.folder}<h2>${escapeHtml(node.name)}</h2>${synopsis(node.doc.doc)}${counts}${actions}</summary>
<div class="dir-body"><button class="guide" type="button" aria-label="收起 ${label}/"></button>
${renderDirDoc(node.doc)}${empty}
${node.files.map((file) => renderFile(file, mode)).join('\n')}
${node.children.map((child) => renderDir(child, mode)).join('\n')}
</div>
</details>`;
}

function renderHtml(report: Report): string {
  const tree = compactChains(buildTree(report));
  const shown = report.mode === 'diff' ? (pruneUnchanged(tree) ?? { ...tree, files: [], children: [] }) : tree;
  const sections = renderDir(shown, report.mode);

  // Filters hide entries by category: change type in diff mode, comment style in snapshot mode.
  const filterSet =
    report.mode === 'snapshot'
      ? (Object.keys(docStyleLabels) as DocStyle[]).map((style) => ({
          id: `s-${style}`,
          attribute: `data-doc="${style}"`,
          label: docStyleLabels[style],
          count: report.declarations.filter((entry) => (entry.after ?? entry.before)!.docStyle === style).length,
          checked: true,
        }))
      : (Object.keys(changeLabels) as (Change | 'tests')[]).map((category) => ({
          id: `b-${category}`,
          attribute: `data-change="${category}"`,
          label: changeLabels[category],
          count: report.declarations.filter((entry) => entryCategory(entry) === category).length,
          checked: category !== 'unchanged',
        }));
  const filters = filterSet
    .map(
      (filter) =>
        `<label class="badge ${filter.id}"><input type="checkbox" id="f-${filter.id}"${filter.checked ? ' checked' : ''}>${filter.label} ${filter.count}</label>`,
    )
    .join('');
  const filterRules = filterSet
    .map(
      (filter) => `body:has(#f-${filter.id}:not(:checked)) :is(.entry,.o-decls li)[${filter.attribute}]{display:none}`,
    )
    .join('\n');

  const warningCounts = new Map<string, number>();
  for (const warning of report.warnings) warningCounts.set(warning.kind, (warningCounts.get(warning.kind) ?? 0) + 1);
  const warnings = report.warnings.length
    ? `<details class="warnings"><summary>工具校验：${report.warnings.length} 条 <span class="muted">${[
        ...warningCounts,
      ]
        .map(([kind, total]) => `${kind} ${total}`)
        .join(' · ')}</span></summary><ul>${report.warnings
        .map((warning) => `<li><code>${warning.kind}</code> ${escapeHtml(warningText(warning))}</li>`)
        .join('')}</ul></details>`
    : '';

  const title = report.mode === 'snapshot' ? '契约总览' : '契约 diff';
  const source =
    report.mode === 'snapshot'
      ? `<code>${escapeHtml(report.head === '.' ? '工作区' : report.head)}</code>`
      : `<code>${escapeHtml(report.base ?? '')}</code> → <code>${escapeHtml(report.head)}</code>`;
  const commentNote = report.comments === 'loose' ? '，紧贴声明的普通注释也算作契约' : '，只收 /** */ 文档注释';

  return `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
:root{--bg:#f6f5f2;--panel:#fff;--text:#1f2328;--muted:#6b7280;--line:#e2e0db;--sig:#f3f2ef;--accent:#2b6f8f;
--dir:#5b4a8b;--del:#ffd7d5;--ins:#c8f0d2;
--added:#1a7f37;--removed:#cf222e;--signature:#9a6700;--doc:#0969da;--impl:#bc4c00;--tests:#8250df;--unchanged:#6b7280;
--doc-comment:#1a7f37;--plain:#0969da;--none:#cf222e}
@media (prefers-color-scheme:dark){:root{--bg:#131518;--panel:#1b1e22;--text:#e6e6e6;--muted:#9aa3ad;--line:#30343a;
--sig:#23272c;--accent:#6cb6d9;--dir:#b3a3e6;--del:#67201f;--ins:#1c4a2b;--added:#4ac26b;--removed:#ff7b72;
--signature:#d4a72c;--doc:#58a6ff;--impl:#f0883e;--tests:#bc8cff;--unchanged:#9aa3ad;--doc-comment:#4ac26b;--plain:#58a6ff;
--none:#ff7b72}}
*{box-sizing:border-box}
html{scroll-padding-top:40px}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,sans-serif}
a{color:inherit}
code,pre{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
.muted{color:var(--muted);font-size:13px}
.page{max-width:1072px;margin:0 auto;padding:24px 16px 96px}

/* Breadcrumb: the directory or file at the top of the viewport, filled in by the script below. */
.crumb{position:fixed;top:0;left:0;right:0;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:2px;
padding:5px max(16px,calc((100vw - 1072px) / 2 + 16px));background:color-mix(in srgb,var(--bg) 92%,transparent);
backdrop-filter:blur(6px);border-bottom:1px solid var(--line);font:13px ui-monospace,SFMono-Regular,Menlo,monospace}
.crumb a{display:inline-flex;align-items:center;gap:5px;padding:2px 6px;border-radius:5px;text-decoration:none;
color:var(--muted)}
.crumb a:hover{background:var(--sig);color:var(--text)}
.crumb a:last-child{color:var(--text);font-weight:600}
.crumb .sep{width:12px;height:12px;fill:none;stroke:var(--line);stroke-width:1.8;stroke-linecap:round}
.crumb .icon{width:14px;height:14px}
.crumb [data-kind="dir"] .icon{stroke:var(--dir);fill:color-mix(in srgb,var(--dir) 14%,transparent)}
.crumb [data-kind="file"] .icon{stroke:var(--muted)}
.crumb:empty{display:none}

h1{margin:0;font-size:24px}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.badge{display:inline-flex;gap:6px;align-items:center;padding:1px 10px;border:1px solid currentColor;border-radius:999px;
font:12px/1.6 system-ui,sans-serif;white-space:nowrap}
${Object.keys(changeLabels)
  .map((category) => `.b-${category}{color:var(--${category})}`)
  .join('')}
.s-doc{color:var(--doc-comment)}.s-plain{color:var(--plain)}.s-none{color:var(--none)}
.prose p{margin:0 0 8px}.prose code{font-size:.9em;padding:0 3px;background:var(--sig);border-radius:3px}
.source{color:var(--muted);font-size:12px}.source code{background:none}

/* Tree: chevron and icon per row, indent guides under the chevrons, counts pushed to the right. */
.counts{display:flex;gap:6px;margin-left:auto;padding-left:12px}
.synopsis{min-width:0;flex:1 1 0;margin-left:8px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
color:var(--muted);font:14px/1.4 system-ui,sans-serif}
.synopsis code{font-size:.9em}
details[open]>summary>.synopsis{visibility:hidden}
/* The subtree actions close the row so they stay put whatever the counts before them say. */
.actions{display:flex;gap:2px;padding-left:8px;opacity:.35;transition:opacity .15s}
.dir-head:hover .actions,.actions:focus-within{opacity:1}
.actions button{display:grid;place-items:center;width:24px;height:24px;padding:0;border:1px solid transparent;
border-radius:5px;background:none;color:var(--muted);cursor:pointer}
.actions button:hover{border-color:var(--line);background:var(--panel);color:var(--text)}
.actions svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;
stroke-linejoin:round}
@media (hover:none){.actions{opacity:1}}
.pill{padding:0 8px;border-radius:999px;background:var(--sig);color:var(--muted);font:12px/20px system-ui,sans-serif;
white-space:nowrap}
.pill.changed{background:color-mix(in srgb,var(--signature) 14%,transparent);color:var(--signature)}
.pill.missing{background:color-mix(in srgb,var(--none) 12%,transparent);color:var(--none)}
.dir-head,.file-head{display:flex;align-items:center;gap:6px;cursor:pointer;list-style:none;user-select:none}
.dir-head::-webkit-details-marker,.file-head::-webkit-details-marker{display:none}
.chevron{flex:none;margin-right:-5px;width:16px;height:16px;fill:none;stroke:var(--muted);stroke-width:1.6;stroke-linecap:round;
stroke-linejoin:round}
details[open]>summary>.chevron .c-closed,details:not([open])>summary>.chevron .c-open{display:none}
.icon{flex:none;width:16px;height:16px;fill:none;stroke-width:1.3;stroke-linejoin:round}
.dir-head .icon{stroke:var(--dir);fill:color-mix(in srgb,var(--dir) 14%,transparent)}
.file-head .icon{stroke:var(--muted)}

.dir{margin-top:6px}
.dir-head{padding:6px 8px 6px 0;border-radius:6px}
.dir-head:hover{background:var(--sig)}
.dir-head h2{margin:0;font:600 16px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}
.dir-body{position:relative;padding:0 0 8px 16px}
.guide{position:absolute;left:0;top:0;bottom:0;width:16px;padding:0;border:0;background:none;cursor:pointer}
.guide::before{content:'';position:absolute;left:7.5px;top:0;bottom:8px;width:1px;background:var(--line)}
.guide:hover::before{width:2px;left:7px;background:var(--dir)}
.dir-doc{margin:2px 0 12px;font-size:15px}.dir-doc .source{margin-top:-2px}
.file-doc{padding:0 20px 8px 26px;font-size:15px}

.file{margin:10px 0 14px;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.file-head{padding:10px 14px 10px 10px}
.file-head:hover{background:var(--sig)}
.file-head h3{margin:0;font:600 15px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}

.entry{padding:18px 20px;border-top:1px solid var(--line)}
.entry h4{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:0 0 8px;font:600 17px/1.4 system-ui,sans-serif}
.kw{font-weight:600}
.owner{color:var(--muted);font-weight:500}
.name{color:var(--accent);text-decoration:none;font-weight:700}.name:hover{text-decoration:underline}
.tag{font:12px/1.6 system-ui,sans-serif;padding:0 8px;border-radius:4px;border:1px solid currentColor;opacity:.85}
.sig{margin:0;padding:12px 16px;background:var(--sig);border:1px solid var(--line);border-radius:6px;
white-space:pre;overflow-x:auto}
.sig-diff{padding:10px 0}
.ln{display:flex;padding:0 16px 0 0;min-width:max-content}
.ln .sign{flex:none;width:28px;text-align:center;color:var(--muted);user-select:none}
.ln-del{background:color-mix(in srgb,var(--del) 45%,transparent)}.ln-del .sign{color:var(--removed)}
.ln-ins{background:color-mix(in srgb,var(--ins) 45%,transparent)}.ln-ins .sign{color:var(--added)}
.doc{margin-top:12px}.doc p{margin:0 0 8px}
.doc code{font-size:.9em;padding:0 3px;background:var(--sig);border-radius:3px}
del{background:var(--del);text-decoration:none;border-radius:2px}del.inline{text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--removed) 60%,transparent)}ins{background:var(--ins);text-decoration:none;border-radius:2px}
.note{margin:0 0 10px;padding:6px 10px;border-left:3px solid var(--impl);color:var(--impl)}
.tests{margin:14px 0 0}
.tests-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
.tests-title{font:600 13px/1.6 system-ui,sans-serif}
.tests-file{color:var(--muted);font-size:12px;overflow-wrap:anywhere}
.tests-na{color:var(--muted);font-size:13px}
.tests ul{margin:4px 0 0;padding-left:20px;font-size:14px;line-height:1.55}
.tests li{margin:2px 0}.tests-group{list-style:none;margin-left:-20px!important}
.tests-context{color:var(--muted);font-size:13px}.tests-group>ul{margin:2px 0 4px;padding-left:20px}.tests li::marker{color:var(--muted)}
.mark{display:inline-block;width:1.2em;margin-left:-1.2em;font-family:ui-monospace,monospace;font-weight:700}
.t-added{color:var(--added)}.t-removed{color:var(--removed);text-decoration:line-through}.t-modified{color:var(--signature)}
.warnings{margin:8px 0;padding:10px 14px;background:var(--panel);border:1px solid var(--line);border-radius:8px}
.warnings summary{cursor:pointer}.warnings ul{margin:8px 0 0;padding:0;list-style:none;font-size:13px}
.warnings li{padding:2px 0;overflow-wrap:anywhere}
@media (max-width:640px){.file-doc{padding-left:14px}.dir-body{padding-left:14px}.guide{width:10px}.guide::before{left:4.5px}
.counts{flex-basis:100%;margin-left:38px;padding-left:0}.dir-head,.file-head{flex-wrap:wrap}.synopsis{display:none}
.entry,.file-head{padding-left:14px;padding-right:14px}}
${filterRules}
</style>
<div class="page">
<div class="crumb"></div>
<h1>${title}</h1>
<p class="muted"><code>${escapeHtml(report.dir)}</code> ${source}${commentNote}</p>
<div class="filters">${filters}</div>

${warnings}
${sections}
</div>
<script>
// Clicking an indent guide collapses its directory and brings the header back into view.
document.addEventListener('click', (event) => {
  const thread = event.target.closest('.guide');
  if (!thread) return;
  const dir = thread.closest('details');
  dir.open = false;
  if (dir.getBoundingClientRect().top < 0) dir.scrollIntoView();
});
// Row actions open or close everything below a directory; the directory itself stays open. They sit inside the
// summary, so the click must not also toggle it.
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-fold]');
  if (!button) return;
  event.preventDefault();
  const dir = button.closest('details');
  dir.open = true;
  for (const node of dir.querySelectorAll('details.dir, details.file')) node.open = button.dataset.fold === 'open';
});
// The breadcrumb links every directory and file enclosing the row under its bottom edge.
const crumb = document.querySelector('.crumb');
const crumbIcons = { dir: ${JSON.stringify(icons.folder)}, file: ${JSON.stringify(icons.file)} };
const separator = '<svg class="sep" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';
let crumbTarget;
const escapeText = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const updateCrumb = () => {
  const firstDir = document.querySelector('details.dir');
  const below = crumb.offsetHeight || 34;
  const hit = window.scrollY < firstDir.offsetTop
    ? undefined
    : document.elementFromPoint(window.innerWidth / 2, below + 16)?.closest('[data-crumb]');
  if (hit === crumbTarget) return;
  crumbTarget = hit;
  const chain = [];
  for (let node = hit; node; node = node.parentElement?.closest('[data-crumb]')) chain.unshift(node);
  crumb.innerHTML = chain
    .map((node) => '<a href="#' + node.id + '" data-kind="' + node.dataset.crumb + '">' +
      crumbIcons[node.dataset.crumb] + escapeText(node.dataset.name) + '</a>')
    .join(separator);
};
document.addEventListener('scroll', updateCrumb, { passive: true });
document.addEventListener('toggle', updateCrumb, true);
updateCrumb();
</script>
</html>
`;
}

function main(): void {
  const options: Record<string, string> = {
    mode: 'diff',
    comments: 'doc',
    base: 'git:main',
    head: '.',
    dir: '',
    out: '.contracts',
    name: 'contracts',
  };
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index].replace(/^--/, '');
    if (!(name in options) || args[index + 1] === undefined)
      throw new Error(`Unknown or incomplete option: ${args[index]}`);
    options[name] = args[index + 1];
  }
  const { mode, comments, base, head, dir, out, name } = options;
  if (mode !== 'diff' && mode !== 'snapshot') throw new Error(`--mode must be diff or snapshot, got ${mode}`);
  if (comments !== 'doc' && comments !== 'loose') throw new Error(`--comments must be doc or loose, got ${comments}`);

  // A snapshot is compared with itself, so every entry and test comes out unchanged and no removals are reported.
  const layout = readLayout(
    dir
      .split(',')
      .filter(Boolean)
      .map((path) => path.replace(/\/$/, '')),
  );
  const dirs = layout.roots;
  const headSnapshot = takeSnapshot(head, layout, comments);
  const directories = readDirDocs(head, dirs, headSnapshot.paths);
  const baseSnapshot = mode === 'diff' ? takeSnapshot(base, layout, comments) : headSnapshot;
  if (mode === 'diff') {
    const changedFrom = (before: string, after: string) =>
      normalizeProse(before) === normalizeProse(after) ? undefined : before;
    const baseDirs = new Map(readDirDocs(base, dirs, baseSnapshot.paths).map((doc) => [doc.path, doc.doc]));
    for (const doc of directories) doc.before = changedFrom(baseDirs.get(doc.path) ?? '', doc.doc);
    const baseFiles = new Map(baseSnapshot.files.map((doc) => [doc.path, doc.doc]));
    for (const doc of headSnapshot.files) doc.before = changedFrom(baseFiles.get(doc.path) ?? '', doc.doc);
  }
  const report: Report =
    mode === 'snapshot'
      ? {
          mode,
          comments,
          head,
          dir: dirs.join(','),
          directories,
          files: headSnapshot.files,
          ...compare(headSnapshot, headSnapshot),
        }
      : {
          mode,
          comments,
          base,
          head,
          dir: dirs.join(','),
          directories,
          files: headSnapshot.files,
          ...compare(baseSnapshot, headSnapshot),
        };
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${name}.json`), JSON.stringify(report, null, 2));
  writeFileSync(join(out, `${name}.html`), renderHtml(report));

  if (mode === 'snapshot') {
    const styles = new Map<DocStyle, number>();
    for (const entry of report.declarations) {
      const style = entry.after!.docStyle;
      styles.set(style, (styles.get(style) ?? 0) + 1);
    }
    console.log(
      `声明 ${report.declarations.length}：${[...styles].map(([style, total]) => `${docStyleLabels[style]} ${total}`).join('，')}`,
    );
  } else {
    const counts = new Map<Change, number>();
    for (const entry of report.declarations) counts.set(entry.change, (counts.get(entry.change) ?? 0) + 1);
    console.log([...counts].map(([change, total]) => `${changeLabels[change]} ${total}`).join('，'));
  }
  console.log(`工具校验 ${report.warnings.length} 条`);
  console.log(join(out, `${name}.html`));
}

main();
