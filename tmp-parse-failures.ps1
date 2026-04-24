$json = Get-Content 'reports/playwright-results.json' -Raw | ConvertFrom-Json
$rows = @()
function Walk-Suite($suite, $parents) {
  $current = @($parents)
  if ($suite.title) { $current += $suite.title }
  foreach ($spec in ($suite.specs | Where-Object { $_ })) {
    foreach ($test in ($spec.tests | Where-Object { $_ })) {
      $statuses = @($test.results | ForEach-Object { $_.status } | Where-Object { $_ })
      $last = if ($statuses.Count -gt 0) { $statuses[-1] } else { 'skipped' }
      $failed = $statuses -contains 'failed' -or $statuses -contains 'timedOut' -or $statuses -contains 'interrupted'
      $outcome = if ($failed -and $last -eq 'passed') { 'flaky' } elseif ($failed) { $last } else { $last }
      if ($outcome -eq 'failed' -or $outcome -eq 'timedOut' -or $outcome -eq 'interrupted') {
        $final = $test.results[-1]
        $msgs = @()
        foreach ($err in ($final.errors | Where-Object { $_ })) {
          if ($err.message) { $msgs += ($err.message -replace "`r?`n", ' ') }
        }
        $rows += [pscustomobject]@{
          file = $spec.file
          title = $spec.title
          project = $test.projectName
          outcome = $outcome
          duration_ms = $final.duration
          error = ($msgs -join ' || ')
        }
      }
    }
  }
  foreach ($child in ($suite.suites | Where-Object { $_ })) { Walk-Suite $child $current }
}
foreach ($suite in $json.suites) { Walk-Suite $suite @() }
