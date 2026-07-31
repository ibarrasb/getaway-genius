import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";

const AppSelect = ({
  value,
  options = [],
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className={`min-w-0 ${className}`}>
      {label && <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left text-base text-slate-900 shadow-inner outline-none transition hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-10 sm:py-2 sm:text-sm"
          >
            <span className="truncate">{activeOption?.label || "Select"}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            avoidCollisions
            collisionPadding={12}
            className="z-[80] max-h-[min(18rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-1rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-base transition sm:min-h-10 sm:py-2 sm:text-sm ${
                  selected ? "bg-slate-100 text-slate-950" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {selected && <Check className="h-4 w-4 text-teal-700" />}
              </button>
            );
          })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default AppSelect;
