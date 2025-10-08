import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import * as Popover from "@radix-ui/react-popover";

export default function TripDateRange({ newInstance, setNewInstance, className = "" }) {
  const [open, setOpen] = React.useState(false);

  // committed (from parent)
  const committed =
    newInstance?.trip_start && newInstance?.trip_end
      ? { from: new Date(newInstance.trip_start), to: new Date(newInstance.trip_end) }
      : undefined;

  // local draft while popover is open
  const [draft, setDraft] = React.useState(committed);

  // sync draft whenever popover opens
  React.useEffect(() => {
    if (open) setDraft(committed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = committed
    ? `${format(committed.from, "PPP")} → ${format(committed.to, "PPP")}`
    : "Pick a date range";

  const handleApply = () => {
    if (draft?.from && draft?.to) {
      setNewInstance((prev) => ({
        ...prev,
        trip_start: draft.from.toISOString().slice(0, 10),
        trip_end: draft.to.toISOString().slice(0, 10),
      }));
      setOpen(false);
    }
  };

  const handleClear = () => setDraft(undefined);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">Trip Dates</label>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {label}
          </Button>
        </Popover.Trigger>

        {/* Portal + high z-index so it sits above modal/footer buttons */}
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={10}
            className="z-[90] bg-white p-3 rounded-xl shadow-2xl ring-1 ring-slate-200"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-3">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={draft}
                onSelect={setDraft} // click a new day after both selected to start a new range
                defaultMonth={draft?.from || committed?.from || new Date()}
                className="p-3 rounded-md border bg-white"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  {draft?.from
                    ? draft?.to
                      ? `${format(draft.from, "MMM d")} → ${format(draft.to, "MMM d, yyyy")}`
                      : `Start: ${format(draft.from, "MMM d, yyyy")} — pick an end date`
                    : "Pick a start date"}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-8 px-3" onClick={handleClear}>
                    Clear
                  </Button>
                  <Button
                    type="button"
                    className="h-8 px-3"
                    onClick={handleApply}
                    disabled={!draft?.from || !draft?.to}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
