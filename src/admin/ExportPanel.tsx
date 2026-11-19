import { useState } from 'react';
import { downloadCsv } from '../lib/csv';
import { EXPORT_OPTIONS, exportToCsv, type ExportKind } from '../lib/exports';
import type { AdminFilters } from '../lib/filters';
import { useStore } from '../store/AppStore';

export function ExportPanel({ filters }: { filters: AdminFilters }) {
  const { state, notify } = useStore();
  const [kind, setKind] = useState<ExportKind>('allocations');

  const doExport = () => {
    const { filename, csv, rows } = exportToCsv(kind, state, filters);
    if (rows.length === 0) {
      notify('warning', 'There is nothing to export with the current filters. Clear or change a filter and try again.');
      return;
    }
    downloadCsv(filename, csv);
    notify('success', `Exported ${rows.length} row${rows.length === 1 ? '' : 's'} to ${filename}.`);
  };

  return (
    <section aria-labelledby="export-h" className="card p-4">
      <h2 id="export-h" className="text-lg font-semibold">
        Export CSV
      </h2>
      <p className="text-sm text-muted">
        Exports the currently filtered data. Files contain personal information – handle them under Council records and privacy policy.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem]">
          <label htmlFor="export-kind" className="label">
            What to export
          </label>
          <select id="export-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as ExportKind)}>
            {EXPORT_OPTIONS.map((o) => (
              <option key={o.kind} value={o.kind}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-primary" onClick={doExport}>
          Download CSV
        </button>
      </div>
    </section>
  );
}
