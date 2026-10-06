import * as esbuild from 'esbuild';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  console.log('Building standalone OLC animation web application...');

  const distDir = path.join(__dirname, 'dist');
  await fs.mkdir(distDir, { recursive: true });

  // 1. Bundle TypeScript to a single JS bundle
  const jsResult = await esbuild.build({
    entryPoints: [path.join(__dirname, 'src/main.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    target: ['es2022']
  });

  const bundledJs = jsResult.outputFiles[0].text;

  // 2. Read and minify CSS
  const cssPath = path.join(__dirname, 'src/ui/styles.css');
  const rawCss = await fs.readFile(cssPath, 'utf-8');

  const cssResult = await esbuild.transform(rawCss, {
    loader: 'css',
    minify: true
  });
  const bundledCss = cssResult.code;

  // 3. Read HTML template and inject inline CSS and JS
  const templatePath = path.join(__dirname, 'static/index.html');
  const templateHtml = await fs.readFile(templatePath, 'utf-8');

  const standaloneHtml = templateHtml
    .replace('<!-- INLINE_CSS -->', `<style>\n${bundledCss}\n</style>`)
    .replace('<!-- INLINE_JS -->', `<script>\n${bundledJs}\n</script>`);

  const outputPath = path.join(distDir, 'index.html');
  await fs.writeFile(outputPath, standaloneHtml, 'utf-8');

  const stats = await fs.stat(outputPath);
  console.log(
    `Successfully generated standalone HTML: ${outputPath} ` +
    `(${stats.size} bytes)`
  );
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
