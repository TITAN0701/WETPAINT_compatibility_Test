import fs from 'node:fs/promises';
import path from 'node:path';

const inputFile = path.resolve(process.cwd(), 'playwright-report/results/playwright-results.json');
const outputDir = path.resolve(process.cwd(), 'reports/generated');

const statusEmoji = {
  passed: '✅',
  failed: '❌',
  timedOut: '❌',
  interrupted: '❌',
  skipped: '➖',
  flaky: '⚠️'
};

function normalizeOutcome(testResultStatuses = []) {
  const lastStatus = testResultStatuses.at(-1);
  if (!lastStatus) {
    return 'skipped';
  }

  if (testResultStatuses.includes('failed') || testResultStatuses.includes('timedOut') || testResultStatuses.includes('interrupted')) {
    if (lastStatus === 'passed') {
      return 'flaky';
    }
    return lastStatus;
  }

  return lastStatus;
}

function walkSuites(suites, rows = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const statuses = (test.results ?? []).map((result) => result.status).filter(Boolean);
        const outcome = normalizeOutcome(statuses);
        rows.push({
          title: spec.title,
          file: spec.file || suite.file || '',
          projectName: test.projectName || 'unknown',
          tags: spec.tags || [],
          status: outcome,
          statusEmoji: statusEmoji[outcome] || '🔲'
        });
      }
    }

    walkSuites(suite.suites, rows);
  }

  return rows;
}

function buildProjectSummary(rows) {
  const summary = new Map();

  for (const row of rows) {
    if (!summary.has(row.projectName)) {
      summary.set(row.projectName, {
        passed: 0,
        failed: 0,
        flaky: 0,
        skipped: 0,
        timedOut: 0,
        interrupted: 0
      });
    }

    const stats = summary.get(row.projectName);
    stats[row.status] += 1;
  }

  return Object.fromEntries(summary.entries());
}

function toMarkdown(projectSummary, rows) {
  const lines = [
    '# Compatibility Summary',
    '',
    '## Projects',
    '',
    '| Project | ✅ Passed | ❌ Failed | ⚠️ Flaky | ➖ Skipped |',
    '| --- | ---: | ---: | ---: | ---: |'
  ];

  for (const [project, stats] of Object.entries(projectSummary)) {
    lines.push(`| ${project} | ${stats.passed} | ${stats.failed + stats.timedOut + stats.interrupted} | ${stats.flaky} | ${stats.skipped} |`);
  }

  lines.push('', '## Matrix Rows', '', '| Project | Status | Test | File | Tags |', '| --- | --- | --- | --- | --- |');

  for (const row of rows) {
    lines.push(`| ${row.projectName} | ${row.statusEmoji} ${row.status} | ${row.title} | ${row.file} | ${(row.tags || []).join(', ')} |`);
  }

  lines.push('');
  return lines.join('\n');
}

function toCsv(rows) {
  const lines = ['project,statusEmoji,status,title,file,tags'];
  for (const row of rows) {
    const values = [row.projectName, row.statusEmoji, row.status, row.title, row.file, (row.tags || []).join('|')]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`);
    lines.push(values.join(','));
  }
  return lines.join('\n');
}

async function main() {
  const raw = await fs.readFile(inputFile, 'utf8');
  const report = JSON.parse(raw);
  const rows = walkSuites(report.suites || []);
  const projectSummary = buildProjectSummary(rows);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'compatibility-summary.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), projectSummary, rows }, null, 2),
    'utf8'
  );
  await fs.writeFile(path.join(outputDir, 'compatibility-summary.md'), toMarkdown(projectSummary, rows), 'utf8');
  await fs.writeFile(path.join(outputDir, 'compatibility-matrix.csv'), toCsv(rows), 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
