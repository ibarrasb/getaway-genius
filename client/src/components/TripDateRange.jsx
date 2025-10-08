// TripDateRange.jsx (JSX)
import * as React from "react";
import { format, parse, isBefore, startOfToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import * as Popover from "@radix-ui/react-popover";

function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width:${breakpointPx - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [breakpointPx]);
  return isMobile;
}

export default function TripDateRange({ newInstance, setNewInstance, className = "" }) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const today = startOfToday();

  // Parse saved yyyy-MM-dd as local dates (avoids UTC shift showing previous day)
  const committed =
    newInstance?.trip_start && newInstance?.trip_end
      ? {
          from: parse(newInstance.trip_start, "yyyy-MM-dd", new Date()),
          to: parse(newInstance.trip_end, "yyyy-MM-dd", new Date()),
        }
      : undefined;

  const [draft, setDraft] = React.useState(committed);

  // Reset draft from committed when opening
  React.useEffect(() => {
    if (open) setDraft(committed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = committed
    ? `${format(committed.from, "PPP")} → ${format(committed.to, "PPP")}`
    : "Pick a date range";

  // Prevent past dates & backwards selection
  const handleSelect = (next) => {
    if (!next) return setDraft(undefined);

    let { from, to } = next;

    // If a start is set and the user taps an earlier day as the "second" click,
    // treat it as starting a NEW range at that earlier day (no backwards ranges).
    if (draft?.from && !draft?.to && from && to && isBefore(to, draft.from)) {
      setDraft({ from }); // start over at the earlier day
      return;
    }

    setDraft({ from, to });
  };

  const handleApply = () => {
    if (draft?.from && draft?.to) {
      // Save as local yyyy-MM-dd to avoid timezone off-by-one
      setNewInstance((prev) => ({
        ...prev,
        trip_start: format(draft.from, "yyyy-MM-dd"),
        trip_end: format(draft.to, "yyyy-MM-dd"),
      }));
      setOpen(false);
    }
  };

  const handleClear = () => setDraft(undefined);

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">Trip Dates</label>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
            {label}
          </Button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={10}
            avoidCollisions
            collisionPadding={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`z-[90] rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 ${
              isMobile ? "w-[calc(100vw-1.5rem)] p-3" : "w-auto p-3"
            }`}
          >
            <div className={isMobile ? "max-h-[70vh] overflow-y-auto space-y-3" : "space-y-3"}>
              <Calendar
                mode="range"
                numberOfMonths={isMobile ? 1 : 2}
                selected={draft}
                onSelect={handleSelect}
                defaultMonth={draft?.from || committed?.from || today}
                // 🔒 Disable past days
                disabled={(date) => isBefore(date, today)}
                className="rounded-md border bg-white p-3"
              />

              {/* Actions / helper text */}
              <div className={isMobile ? "mt-1 flex flex-col-reverse gap-2" : "mt-1 flex items-center justify-between gap-2"}>
                <div className="text-xs text-slate-500">
                  {draft?.from
                    ? draft?.to
                      ? `${format(draft.from, "MMM d")} → ${format(draft.to, "MMM d, yyyy")}`
                      : `Start: ${format(draft.from, "MMM d, yyyy")} — pick an end date`
                    : "Pick a start date"}
                </div>

                <div className={isMobile ? "flex w-full gap-2" : "flex items-center gap-2"}>
                  <Button type="button" variant="outline" className={isMobile ? "h-10 flex-1" : "h-8 px-3"} onClick={handleClear}>
                    Clear
                  </Button>
                  <Button
                    type="button"
                    className={isMobile ? "h-10 flex-1" : "h-8 px-3"}
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
