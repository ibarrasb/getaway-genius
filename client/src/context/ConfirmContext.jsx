import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ConfirmContext } from "./ConfirmContextBase";

export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setRequest({
        title: options.title || "Are you sure?",
        description: options.description || "",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        tone: options.tone || "danger",
        resolve,
      });
    });
  }, []);

  const close = useCallback(
    (value) => {
      if (request?.resolve) request.resolve(value);
      setRequest(null);
    },
    [request]
  );

  const value = useMemo(() => ({ confirm }), [confirm]);
  const isDanger = request?.tone !== "default";

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    isDanger ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="confirm-title" className="text-base font-semibold text-slate-950">
                    {request.title}
                  </h2>
                  {request.description && (
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {request.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => close(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {request.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${
                  isDanger ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
