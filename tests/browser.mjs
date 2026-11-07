import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppServer } from '../server.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'qa');
const PLAYWRIGHT = '/Users/qiaojinliang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const CHROME = '/Users/qiaojinliang/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const results = [];
const failures = [];
function check(name, condition, detail) {
  results.push({ name, ok: Boolean(condition), detail: detail ?? null });
  if (!condition) failures.push(detail ? `${name}: ${detail}` : name);
}

async function goHash(page, hash) {
  await page.evaluate(value => { window.location.hash = value; }, hash);
  await page.waitForTimeout(120);
}

async function main() {
  const { chromium } = await import(PLAYWRIGHT);
  const server = createAppServer({ rootDir: join(ROOT, 'dist'), apiKey: '' });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => failedRequests.push(`${request.url()} ${request.failure()?.errorText ?? ''}`));

    await page.goto(`${base}/#/library`, { waitUntil: 'networkidle' });
    await page.waitForSelector('section.library-page h1');

    const title = (await page.textContent('.library-page h1'))?.trim();
    check('library renders its title', title === 'All items', title);
    const cards = await page.locator('.masonry .item-card').count();
    check('library shows seeded cards', cards >= 10, String(cards));
    const sidebarWidth = await page.locator('aside.sidebar').evaluate(node => Math.round(node.getBoundingClientRect().width));
    check('sidebar measures 272px at 1440', sidebarWidth === 272, String(sidebarWidth));
    const bodyColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check('light page surface is #fcfcfa', bodyColor === 'rgb(252, 252, 250)', bodyColor);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('no horizontal overflow at 1440', overflow <= 1, `${overflow}px`);
    await page.screenshot({ path: join(OUT, 'library-1440.png'), fullPage: false });

    const search = page.locator('input[aria-label="Search your library"]');
    await search.fill('attention');
    await page.waitForTimeout(120);
    const filtered = await page.locator('.masonry .item-card').count();
    check('search narrows the grid', filtered > 0 && filtered < cards, `${filtered} of ${cards}`);
    await search.fill('');
    await page.waitForTimeout(120);

    await page.getByRole('button', { name: 'Index view' }).click();
    await page.waitForSelector('.index-panel');
    const topics = await page.locator('.index-panel h3').first().textContent();
    check('index view renders its topics panel', topics?.trim() === 'TOPICS', topics ?? '');
    await page.screenshot({ path: join(OUT, 'library-index-1440.png') });
    await page.getByRole('button', { name: 'Grid view' }).click();

    const pages = [
      ['Discover', '.p-discover-nav button', 'discover'],
      ['Strategy', '.p-header .page-title', 'strategy'],
      ['Planner', '.p-header .page-title', 'planner'],
      ['Publish', '.p-header .page-title', 'publish'],
      ['Chat', '.p-header .page-title', 'chat'],
      ['Custom AI', '.p-header .page-title', 'custom-ai'],
      ['Analytics', '.p-header .page-title', 'analytics'],
      ['Your store', '.p-header .page-title', 'store'],
      ['Settings', '.p-header .page-title', 'settings'],
      ['Boards', '.library-page h1', 'boards'],
      ['Trash', '.library-page h1', 'trash']
    ];
    for (const [label, selector, slug] of pages) {
      try {
        await goHash(page, `#/${slug}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        const rendered = (await page.textContent(selector))?.trim() ?? '';
        check(`${label} page renders`, rendered.length > 0, rendered);
        const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(`${label} has no horizontal overflow`, pageOverflow <= 1, `${pageOverflow}px`);
        if (label === 'Discover') await page.screenshot({ path: join(OUT, 'discover-1440.png') });
        if (label === 'Planner') await page.screenshot({ path: join(OUT, 'planner-1440.png') });
      } catch (error) {
        check(`${label} page renders`, false, `${error?.message ?? error}`.slice(0, 200));
      }
    }

    await goHash(page, '#/library');
    await page.waitForSelector('.library-page h1');
    await page.keyboard.press('n');
    await page.waitForSelector('dialog[open], .dialog-backdrop', { timeout: 4000 }).catch(() => {});
    const composerOpen = await page.locator('dialog[open], .dialog-backdrop').count();
    check('N opens the capture composer', composerOpen > 0, String(composerOpen));
    await page.keyboard.press('Escape');

    await page.keyboard.press('Meta+k');
    await page.waitForSelector('.palette, [role="dialog"]', { timeout: 3000 }).catch(() => {});
    const paletteOpen = await page.locator('.palette, .command-palette').count();
    check('⌘K opens the command palette', paletteOpen > 0, String(paletteOpen));
    await page.screenshot({ path: join(OUT, 'palette-1440.png') });
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Workspace menu' }).click();
    await page.getByRole('menuitem', { name: /Switch to dark theme/i }).click();
    await page.waitForTimeout(200);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    check('dark theme applies', theme === 'dark', theme ?? 'unset');
    await page.screenshot({ path: join(OUT, 'library-dark-1440.png') });
    await page.getByRole('button', { name: 'Workspace menu' }).click();
    await page.getByRole('menuitem', { name: /Switch to light theme/i }).click();

    await goHash(page, '#/library');
    await page.waitForSelector('.masonry .item-card');
    await page.locator('.masonry .item-card').first().hover();
    const firstName = (await page.locator('.masonry .item-card h3').first().textContent())?.trim() ?? '';
    await page.locator('.card-pane').first().click({ force: true });
    await page.waitForSelector('.pane .pane-title', { timeout: 4000 });
    const paneName = (await page.textContent('.pane .pane-title'))?.trim() ?? '';
    check('pane opens the chosen card', paneName === firstName, `${paneName} vs ${firstName}`);
    const paneWidth = await page.locator('.pane').evaluate(node => Math.round(node.getBoundingClientRect().width));
    check('pane occupies its own column', paneWidth === 360, String(paneWidth));
    await page.screenshot({ path: join(OUT, 'pane-1440.png') });
    await page.getByRole('button', { name: 'Close pane' }).click();
    await page.waitForTimeout(150);
    const remainingPanes = await page.locator('.pane').count();
    check('pane closes again', remainingPanes === 0, `${remainingPanes} pane(s) left`);

    await page.goto(`${base}/#/library`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.masonry .item-card');
    const persisted = (await page.textContent('.library-page h1'))?.trim();
    check('reload keeps the workspace', persisted === 'All items', persisted ?? '');

    for (const [width, height, name] of [[768, 1024, 'tablet'], [390, 844, 'mobile']]) {
      await page.setViewportSize({ width, height });
      await goHash(page, '#/library');
      await page.waitForSelector('.masonry .item-card');
      const layoutOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`no horizontal overflow at ${width}`, layoutOverflow <= 1, `${layoutOverflow}px`);
      const columns = await page.locator('.masonry .item-card').count();
      check(`${name} viewport keeps the grid`, columns > 0, String(columns));
      await page.screenshot({ path: join(OUT, `library-${width}.png`) });
      await goHash(page, '#/discover');
      await page.waitForSelector('.p-discover-nav');
      await page.screenshot({ path: join(OUT, `discover-${width}.png`) });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await goHash(page, '#/library');
    await page.waitForSelector('.masonry .item-card');
    const toggle = page.getByRole('button', { name: 'Open navigation' });
    check('mobile menu button is visible', await toggle.isVisible(), String(await toggle.count()));
    await toggle.click();
    await page.waitForTimeout(200);
    const sidebarOnScreen = await page.locator('aside.sidebar').evaluate(node => Math.round(node.getBoundingClientRect().left));
    check('mobile navigation slides into view', sidebarOnScreen === 0, `left ${sidebarOnScreen}px`);
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.waitForSelector('.p-discover-nav', { timeout: 4000 });
    const discoverNavs = await page.locator('.p-discover-nav').count();
    check('mobile navigation reaches Discover', discoverNavs === 1, `${discoverNavs} nav(s)`);
    await page.screenshot({ path: join(OUT, 'mobile-nav-390.png') });

    check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 600));
    check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 600));
    check('no failed network requests', failedRequests.length === 0, failedRequests.join(' | ').slice(0, 600));

    const health = await page.request.get(`${base}/api/health`);
    check('health endpoint answers', health.status() === 200, String(health.status()));
    const chat = await page.request.post(`${base}/api/chat`, { data: { messages: [{ role: 'user', content: 'Hello' }] } });
    const chatBody = await chat.json();
    check('chat reports an honest unconfigured state', chat.status() === 503 && chatBody.ok === false, `${chat.status()} ${JSON.stringify(chatBody).slice(0, 120)}`);

    await context.close();
  } finally {
    await browser.close();
    await new Promise(done => server.close(done));
  }

  const report = { generatedAt: new Date().toISOString(), checked: results.length, failed: failures.length, results, failures, consoleErrors, pageErrors, failedRequests };
  await writeFile(join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const passed = results.filter(entry => entry.ok).length;
  process.stdout.write(`\nYDY browser QA — ${passed}/${results.length} checks passed\n`);
  for (const entry of results) process.stdout.write(`${entry.ok ? 'PASS' : 'FAIL'}  ${entry.name}${entry.detail ? `  (${entry.detail})` : ''}\n`);
  if (failures.length) {
    process.stdout.write(`\n${failures.length} failure(s); see qa/report.json and qa/*.png\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('\nAll browser checks passed; screenshots written to qa/\n');
  }
}

main().catch(error => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
