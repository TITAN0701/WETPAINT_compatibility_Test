import fs from 'node:fs/promises';
import path from 'node:path';

const reportPath = path.resolve(process.cwd(), 'reports', 'playwright-results.json');

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

function collectRows(suites, rows = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const statuses = (test.results ?? []).map((result) => result.status).filter(Boolean);
        rows.push({
          title: spec.title,
          projectName: test.projectName || 'unknown',
          status: normalizeOutcome(statuses)
        });
      }
    }

    collectRows(suite.suites, rows);
  }

  return rows;
}

async function main() {
  const raw = await fs.readFile(reportPath, 'utf8');
  const report = JSON.parse(raw);
  const rows = collectRows(report.suites || []);

  if (rows.length === 0) {
    throw new Error('No tests were written to reports/playwright-results.json.');
  }

  const counts = rows.reduce((summary, row) => {
    summary[row.status] = (summary[row.status] || 0) + 1;
    return summary;
  }, {});

  const signalCount = rows.filter((row) => row.status !== 'skipped').length;
  console.log(`Playwright signal check: ${signalCount}/${rows.length} tests produced pass/fail/flaky output.`);
  console.log(`Status counts: ${JSON.stringify(counts)}`);

  if (signalCount === 0) {
    throw new Error('All tests in reports/playwright-results.json are skipped; baseline is not trustworthy yet.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
