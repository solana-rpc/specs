import type { Report } from './runner.js'

export function textReport(report: Report): string {
  const totals = Object.entries(report.summary).map(([status, count]) => `${count} ${status}`).join(', ')
  return [
    `RPC spec compatibility: ${report.target}`,
    `Spec ${report.spec.version} (sha256 ${report.spec.sha256.slice(0, 12)})`,
    `${report.coverage.selectedMethods} methods; ${totals}`,
    ...report.results.map((r) => `${r.status.toUpperCase().padEnd(12)} ${r.method}/${r.probe}: ${r.detail}${r.code === undefined ? '' : ` (${r.code})`}`),
    '', ...report.discovery, '', ...report.limitations,
  ].join('\n') + '\n'
}

function escape(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function htmlReport(report: Report): string {
  const rows = report.results.map((r) => `<tr data-status="${r.status}"><td class="${r.status}">${r.status}</td><td>${escape(r.category)}</td><td>${escape(r.method)}<small>${escape(r.probe)}</small></td><td>${escape(r.detail)}${r.code === undefined ? '' : ` (${r.code})`}<small>${escape(r.source)}</small></td><td>${r.durationMs} ms</td></tr>`).join('\n')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RPC compatibility — ${escape(report.target)}</title>
<style>
:root{font:16px system-ui,sans-serif;color:#172437;background:#f5f7fa}body{max-width:1200px;margin:40px auto;padding:0 24px}h1{font-size:32px}p{line-height:1.6}.summary{display:flex;flex-wrap:wrap;gap:12px}.summary div{background:white;border:1px solid #dce2e9;border-radius:8px;padding:16px;min-width:110px}.summary strong{display:block;font-size:28px}table{border-collapse:collapse;background:white;width:100%;margin-top:24px}th,td{text-align:left;padding:12px;border-bottom:1px solid #dce2e9;vertical-align:top}small{display:block;color:#54657a;margin-top:5px;overflow-wrap:anywhere}.pass{color:#146b3a}.fail,.unsupported{color:#ab2430}.error,.inconclusive,.skipped{color:#825500}select{padding:8px;margin-top:20px}details{margin:24px 0}code{overflow-wrap:anywhere}@media(max-width:700px){body{padding:0 12px}th,td{padding:8px;font-size:13px}}
</style></head><body>
<h1>RPC spec compatibility</h1><p>${escape(report.target)} · ${escape(report.startedAt)} · ${(report.durationMs / 1000).toFixed(1)} seconds<br>Spec ${escape(report.spec.version)} · ${report.coverage.selectedMethods} methods selected</p>
<div class="summary">${Object.entries(report.summary).map(([status, count]) => `<div class="${status}"><strong>${count}</strong>${status}</div>`).join('')}</div>
<p>Each probe checks this target against the specification. Pass counts describe the probes that ran, not a percentage of full conformance.</p>
<label>Show <select id="filter"><option value="all">All results</option><option value="issues">Everything except passes</option>${Object.keys(report.summary).map((s) => `<option value="${s}">${s}</option>`).join('')}</select></label>
<table><thead><tr><th>Status</th><th>Category</th><th>Method / probe</th><th>Finding</th><th>Duration</th></tr></thead><tbody>${rows}</tbody></table>
<details><summary>Coverage and reproducibility</summary><p>Spec SHA-256: <code>${escape(report.spec.sha256)}</code></p><ul>${[...report.discovery, ...report.limitations].map((v) => `<li>${escape(v)}</li>`).join('')}</ul></details>
<script>document.getElementById('filter').addEventListener('change',function(){for(const row of document.querySelectorAll('tbody tr')){row.hidden=this.value==='issues'?row.dataset.status==='pass':this.value!=='all'&&row.dataset.status!==this.value}})</script>
</body></html>\n`
}
