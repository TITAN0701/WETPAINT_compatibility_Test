import fs from 'node:fs/promises';
import path from 'node:path';

const reportsDir = path.resolve(process.cwd(), 'reports');
const inputFile = path.join(reportsDir, 'playwright-results.json');
const outputFile = path.join(reportsDir, 'compatibility-summary.html');
const legacyDirs = [path.join(reportsDir, 'generated')];
const areaTagOrder = ['workflow', 'frontdesk', 'admin', 'shared', 'rwd', 'ui', 'media'];

const statusBadge = {
  passed: 'PASS',
  failed: 'FAIL',
  timedOut: 'TIMEOUT',
  interrupted: 'INTERRUPTED',
  skipped: 'SKIPPED',
  flaky: 'FLAKY'
};

function normalizeOutcome(testResultStatuses = []) {
  const lastStatus = testResultStatuses.at(-1);
  if (!lastStatus) {
    return 'skipped';
  }

  if (testResultStatuses.includes('failed') || testResultStatuses.includes('timedOut') || testResultStatuses.includes('interrupted')) {
    return lastStatus === 'passed' ? 'flaky' : lastStatus;
  }

  return lastStatus;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getInlineScreenshotAttachment(test) {
  const finalResult = [...(test.results ?? [])].at(-1);
  const attachment = [...(finalResult?.attachments ?? [])].reverse().find((item) => item.name === 'inline-report-screenshot');
  if (!attachment) {
    return null;
  }

  return {
    body: attachment.body || null,
    path: attachment.path || null,
    contentType: attachment.contentType || 'image/png'
  };
}

function resolveArea(tags = []) {
  const matched = areaTagOrder.filter((tag) => tags.includes(tag));
  if (matched.includes('workflow')) {
    return 'workflow';
  }
  if (matched.length === 1) {
    return matched[0];
  }
  if (matched.length > 1) {
    return 'mixed';
  }
  return 'other';
}

function walkSuites(suites, rows = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const statuses = (test.results ?? []).map((result) => result.status).filter(Boolean);
        const outcome = normalizeOutcome(statuses);
        const tags = spec.tags || [];
        rows.push({
          title: spec.title,
          file: spec.file || suite.file || '',
          projectName: test.projectName || 'unknown',
          tags,
          area: resolveArea(tags),
          status: outcome,
          statusBadge: statusBadge[outcome] || 'UNKNOWN',
          screenshotAttachment: getInlineScreenshotAttachment(test)
        });
      }
    }

    walkSuites(suite.suites, rows);
  }

  return rows;
}

async function hydrateRows(rows) {
  return Promise.all(
    rows.map(async (row) => {
      if (!row.screenshotAttachment) {
        return { ...row, hasInlineScreenshot: false };
      }

      try {
        let dataUrl = '';
        if (row.screenshotAttachment.body) {
          dataUrl = `data:${row.screenshotAttachment.contentType};base64,${row.screenshotAttachment.body}`;
        } else if (row.screenshotAttachment.path) {
          const raw = await fs.readFile(row.screenshotAttachment.path);
          dataUrl = `data:${row.screenshotAttachment.contentType};base64,${raw.toString('base64')}`;
        }

        return {
          ...row,
          screenshotDataUrl: dataUrl,
          hasInlineScreenshot: Boolean(dataUrl)
        };
      } catch {
        return { ...row, hasInlineScreenshot: false };
      }
    })
  );
}

function createStatusBucket() {
  return {
    passed: 0,
    failed: 0,
    flaky: 0,
    skipped: 0,
    timedOut: 0,
    interrupted: 0
  };
}

function buildGroupedSummary(rows, keySelector) {
  const summary = new Map();

  for (const row of rows) {
    const keys = [].concat(keySelector(row)).filter(Boolean);
    for (const key of keys) {
      if (!summary.has(key)) {
        summary.set(key, createStatusBucket());
      }
      summary.get(key)[row.status] += 1;
    }
  }

  return Object.fromEntries(summary.entries());
}

function renderSummaryTable(summary, formatter) {
  return Object.entries(summary)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, stats]) => {
      return `<tr><th>${escapeHtml(formatter(key))}</th><td>${stats.passed}</td><td>${stats.failed + stats.timedOut + stats.interrupted}</td><td>${stats.flaky}</td><td>${stats.skipped}</td></tr>`;
    })
    .join('');
}

function renderCards(rows) {
  return rows
    .map((row) => {
      const screenshot = row.screenshotDataUrl
        ? `<img src="${row.screenshotDataUrl}" alt="${escapeHtml(row.title)}" loading="lazy" />`
        : '<div class="placeholder">No inline screenshot</div>';

      return `
        <article class="card">
          <div class="card-head">
            <div class="status status-${escapeHtml(row.status)}">${escapeHtml(row.statusBadge)}</div>
            <div class="project">${escapeHtml(row.projectName)}</div>
          </div>
          <h3>${escapeHtml(row.title)}</h3>
          <div class="meta"><strong>Area:</strong> ${escapeHtml(row.area)}</div>
          <div class="meta"><strong>File:</strong> ${escapeHtml(row.file)}</div>
          <div class="meta"><strong>Tags:</strong> ${escapeHtml((row.tags || []).map((tag) => `@${tag}`).join(', ') || 'none')}</div>
          <div class="shot">${screenshot}</div>
        </article>
      `;
    })
    .join('\n');
}

function renderAreaSections(rows) {
  const areaLabels = {
    workflow: 'Workflow',
    frontdesk: 'Frontdesk',
    admin: 'Admin',
    shared: 'Shared',
    rwd: 'RWD',
    ui: 'UI',
    media: 'Media',
    mixed: 'Mixed',
    other: 'Other'
  };

  return Object.entries(areaLabels)
    .map(([areaKey, areaLabel]) => {
      const areaRows = rows.filter((row) => row.area === areaKey);
      if (areaRows.length === 0) {
        return '';
      }

      return `
        <section class="panel area-panel" id="area-${escapeHtml(areaKey)}">
          <div class="section-head">
            <h2>${escapeHtml(areaLabel)}</h2>
            <div class="meta-line">${areaRows.length} tests</div>
          </div>
          <div class="cards">
            ${renderCards(areaRows)}
          </div>
        </section>
      `;
    })
    .join('\n');
}

function toHtml(reportMetadata, projectSummary, tagSummary, areaSummary, rows) {
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compatibility Summary</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f141c;
        --panel: rgba(24, 32, 43, 0.92);
        --panel-2: #213041;
        --text: #edf2f7;
        --muted: #9fb0c3;
        --accent: #7cc4ff;
        --border: #2e3d4f;
        --ok: #5dd39e;
        --fail: #ff7b72;
        --skip: #d6b370;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", "Noto Sans TC", sans-serif;
        background: linear-gradient(180deg, #0f141c 0%, #141c27 100%);
        color: var(--text);
      }
      main {
        width: min(1480px, calc(100vw - 32px));
        margin: 24px auto 48px;
      }
      .hero, .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 20px 24px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
      }
      .hero { margin-bottom: 20px; }
      .panel + .panel, .area-panel + .area-panel { margin-top: 20px; }
      h1, h2, h3 { margin: 0 0 12px; }
      h1 { font-size: 28px; }
      h2 { font-size: 20px; }
      .hero p, .meta-line, .meta {
        color: var(--muted);
        margin: 6px 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }
      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--border);
        color: var(--text);
        text-decoration: none;
        background: rgba(33, 48, 65, 0.72);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border-top: 1px solid var(--border);
        padding: 10px 8px;
        text-align: left;
      }
      th { color: var(--muted); font-weight: 600; }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 12px;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 18px;
      }
      .card {
        background: rgba(24, 32, 43, 0.92);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 18px;
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .status {
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .status-passed { color: var(--ok); }
      .status-failed, .status-timedOut, .status-interrupted { color: var(--fail); }
      .status-skipped, .status-flaky { color: var(--skip); }
      .project {
        color: var(--muted);
      }
      .shot {
        margin-top: 14px;
        border-radius: 14px;
        overflow: hidden;
        background: #0b1118;
        border: 1px solid var(--border);
      }
      .shot img {
        width: 100%;
        display: block;
      }
      .placeholder {
        padding: 32px 16px;
        text-align: center;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compatibility Summary</h1>
        <p>Generated at: ${escapeHtml(reportMetadata.generatedAt)}</p>
        <p>Source report: ${escapeHtml(reportMetadata.inputFile)}</p>
        <p>Projects in run: ${escapeHtml(reportMetadata.projects.join(', ') || 'none')}</p>
        <p>Total rows: ${reportMetadata.totalRows}</p>
        <div class="chip-row">
          <a class="chip" href="#area-frontdesk">Frontdesk</a>
          <a class="chip" href="#area-admin">Admin</a>
          <a class="chip" href="#area-shared">Shared</a>
          <a class="chip" href="#area-rwd">RWD</a>
          <a class="chip" href="#area-ui">UI</a>
          <a class="chip" href="#area-media">Media</a>
          <a class="chip" href="#area-workflow">Workflow</a>
          <a class="chip" href="#area-mixed">Mixed</a>
          <a class="chip" href="#area-other">Other</a>
        </div>
      </section>

      <section class="grid">
        <section class="panel">
          <h2>Feature Areas</h2>
          <table>
            <thead>
              <tr><th>Area</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th></tr>
            </thead>
            <tbody>${renderSummaryTable(areaSummary, (value) => value)}</tbody>
          </table>
        </section>
        <section class="panel">
          <h2>Projects</h2>
          <table>
            <thead>
              <tr><th>Project</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th></tr>
            </thead>
            <tbody>${renderSummaryTable(projectSummary, (value) => value)}</tbody>
          </table>
        </section>
        <section class="panel">
          <h2>Tags</h2>
          <table>
            <thead>
              <tr><th>Tag</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th></tr>
            </thead>
            <tbody>${renderSummaryTable(tagSummary, (value) => `@${value}`)}</tbody>
          </table>
        </section>
      </section>

      ${renderAreaSections(rows)}
    </main>
  </body>
</html>`;
}

async function main() {
  const raw = await fs.readFile(inputFile, 'utf8');
  const report = JSON.parse(raw);
  const rows = await hydrateRows(walkSuites(report.suites || []));
  const projectSummary = buildGroupedSummary(rows, (row) => row.projectName);
  const tagSummary = buildGroupedSummary(rows, (row) => row.tags || []);
  const areaSummary = buildGroupedSummary(rows, (row) => row.area);
  const projects = [...new Set(rows.map((row) => row.projectName))].sort();
  const reportMetadata = {
    generatedAt: new Date().toISOString(),
    inputFile,
    totalRows: rows.length,
    projects
  };

  await fs.mkdir(reportsDir, { recursive: true });
  await Promise.all(
    legacyDirs.map(async (dirPath) => {
      await fs.rm(dirPath, { recursive: true, force: true });
    })
  );

  await fs.writeFile(outputFile, toHtml(reportMetadata, projectSummary, tagSummary, areaSummary, rows), 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
