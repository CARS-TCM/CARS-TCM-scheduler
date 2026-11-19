import { useState } from 'react';
import { AccessDenied } from '../components/AccessDenied';
import { Tabs } from '../components/Tabs';
import { emptyFilters, type AdminFilters } from '../lib/filters';
import { openRequests } from '../lib/rules';
import { useStore } from '../store/AppStore';
import { CapacityTable } from './CapacityTable';
import { CompletionTable } from './CompletionTable';
import { EmployeeAllocations } from './EmployeeAllocations';
import { ExportPanel } from './ExportPanel';
import { FilterBar } from './FilterBar';
import { RequestsAdmin } from './RequestsAdmin';
import { SummaryCards } from './SummaryCards';

type AdminTab = 'completion' | 'capacity' | 'employees' | 'requests';

export function AdminView() {
  const { state, actor } = useStore();
  const [filters, setFilters] = useState<AdminFilters>(emptyFilters);
  const [tab, setTab] = useState<AdminTab>('completion');

  if (actor.role !== 'admin') return <AccessDenied needs="Training Administrator" />;

  const open = openRequests(state).length;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Training administrator dashboard</h2>
      <SummaryCards state={state} />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <FilterBar filters={filters} onChange={setFilters} />
        <ExportPanel filters={filters} />
      </div>
      <Tabs
        label="Administrator views"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'completion', label: 'Manager completion' },
          { id: 'capacity', label: 'Session capacity' },
          { id: 'employees', label: 'Employee allocations' },
          { id: 'requests', label: `Team member requests${open ? ` (${open} open)` : ''}` },
        ]}
      >
        {tab === 'completion' && <CompletionTable filters={filters} />}
        {tab === 'capacity' && (
          <CapacityTable
            filters={filters}
            onViewAttendees={(sessionId) => {
              setFilters({ ...filters, sessionId });
              setTab('employees');
            }}
          />
        )}
        {tab === 'employees' && <EmployeeAllocations filters={filters} />}
        {tab === 'requests' && <RequestsAdmin filters={filters} />}
      </Tabs>
    </div>
  );
}
