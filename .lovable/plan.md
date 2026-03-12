

## Plan: Replace all `<Input type="date">` with Popover + Calendar pickers (like Orders page)

### Problem
The Audit Log, KPI Dashboard, Profitability Reports, Reports Tab, Finance, and Analytics pages use plain HTML `<Input type="date">` for date filtering. The Orders page uses the Shadcn `Popover + Calendar` component with Bulgarian locale, which looks better and is consistent.

### Scope — 6 files to update

| File | Current | Change |
|------|---------|--------|
| `AuditLogTab.tsx` | `Input type="date"` x2 | Popover + Calendar, convert state from `string` to `Date \| undefined` |
| `WarehouseKPIDashboard.tsx` | `Input type="date"` x2 | Popover + Calendar, convert state from `string` to `Date \| undefined` |
| `ProfitabilityReport.tsx` | `Input type="date"` x2 | Popover + Calendar, convert state from `string` to `Date \| undefined` |
| `ReportsTab.tsx` | `Input type="date"` x2 | Popover + Calendar, convert state from `string` to `Date \| undefined` |
| `Finance.tsx` | `Input type="date"` x3 | Popover + Calendar |
| `Analytics.tsx` | `Input type="date"` x2 | Popover + Calendar |

### Pattern (from OrderFilters.tsx)
Each date input becomes:
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-[160px] justify-between">
      <div className="flex items-center">
        <Calendar className="w-4 h-4 mr-2" />
        {date ? format(date, 'dd.MM.yy', { locale: bg }) + ' г.' : 'От дата'}
      </div>
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <CalendarComponent mode="single" selected={date} onSelect={setDate} locale={bg} />
  </PopoverContent>
</Popover>
```

### State changes
- Files using `string` state (e.g. `useState('2025-01-01')`) will be converted to `Date | undefined`
- Date comparison logic will be updated to work with `Date` objects instead of string comparisons
- Default dates (like `subDays(new Date(), 30)`) remain as `Date` objects directly

### No new dependencies needed
All imports (`Popover`, `Calendar`, `date-fns`, `bg` locale) are already available in the project.

