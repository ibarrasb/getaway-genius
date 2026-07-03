// src/pages/trips/TripInstanceDetail.jsx
import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Save,
  Calendar as CalendarIcon,
  Clock3,
  Plus,
  Trash2,
  ExternalLink,
  BedDouble,
  Plane,
  CarFront,
  Ticket,
  Utensils,
  Package,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import AppSelect from "@/components/ui/AppSelect";
import {
  toYmdLocal,
  formatMMDDYYYYLocal,
  fmtRangeShort,
  nightsBetween,
} from "../utils/localDates";
import { GlobalState } from "@/context/GlobalState.jsx";
import { useToast } from "@/context/ToastContext.jsx";
import { useConfirm } from "@/context/useConfirm";

const TripInstanceDetail = () => {
  const globalState = useContext(GlobalState);
  const { error: showError } = useToast();
  const { confirm } = useConfirm();
  const token = globalState?.token?.[0] ?? null;
  const globalLoading = globalState?.loading?.[0] ?? false;
  const { tripId, instanceId } = useParams();
  const locationState = useLocation();
  const navigate = useNavigate();
  const stateData = locationState.state || {};
  const authHeaders = useMemo(
    () => (token ? { Authorization: token } : undefined),
    [token]
  );

  const [trip, setTrip] = useState(stateData.trip || null);
  const [instance, setInstance] = useState(stateData.instance || null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [editingHeaderField, setEditingHeaderField] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(!stateData.trip || !stateData.instance);
  const savedSignatureRef = useRef("");

  const [formData, setFormData] = useState({
    option_title: "",
    destination: "",
    status: "considering",
    trip_start: "",
    trip_end: "",
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
    cost_items: [],
    notes: "",
    activities: [],
  });

  const itemCategories = [
    { value: "lodging", label: "Lodging" },
    { value: "flight", label: "Flights" },
    { value: "car", label: "Car" },
    { value: "tickets", label: "Tickets" },
    { value: "food", label: "Food" },
    { value: "other", label: "Other" },
  ];

  const categoryConfig = useMemo(() => ({
    lodging: {
      icon: BedDouble,
      label: "Lodging",
      singular: "stay",
      description: "Hotels, Airbnbs, resorts, and fees.",
      namePlaceholder: "Hotel, Airbnb, resort...",
      priceLabel: "Price",
      quantityLabel: "Qty",
      dateLabel: "Stay dates",
      accent: "bg-sky-50 text-sky-700 ring-sky-100",
      priceBasisOptions: [
        { value: "total", label: "Total stay" },
        { value: "per_night", label: "Per night" },
      ],
      itemTypeOptions: [
        { value: "hotel", label: "Hotel" },
        { value: "airbnb", label: "Airbnb" },
        { value: "resort", label: "Resort" },
        { value: "fees", label: "Fees" },
      ],
    },
    flight: {
      icon: Plane,
      label: "Flights",
      singular: "flight",
      description: "Airfare, baggage, seat fees, and transfers.",
      namePlaceholder: "Airline, route, confirmation...",
      priceLabel: "Fare",
      quantityLabel: "Travelers",
      dateLabel: "Flight dates",
      accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
      priceBasisOptions: [
        { value: "total", label: "Total fare" },
        { value: "per_person", label: "Per person" },
      ],
      itemTypeOptions: [
        { value: "round_trip", label: "Round trip" },
        { value: "one_way", label: "One way" },
        { value: "multi_city", label: "Multi-city" },
        { value: "fee", label: "Fee" },
      ],
    },
    car: {
      icon: CarFront,
      label: "Car",
      singular: "car item",
      description: "Rental cars, rideshares, parking, and gas.",
      namePlaceholder: "Rental company, parking, rideshare...",
      priceLabel: "Cost",
      quantityLabel: "Days/items",
      dateLabel: "Rental dates",
      accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      priceBasisOptions: [
        { value: "total", label: "Total" },
        { value: "per_day", label: "Per day" },
        { value: "per_ride", label: "Per ride" },
      ],
      itemTypeOptions: [
        { value: "rental", label: "Rental" },
        { value: "rideshare", label: "Rideshare" },
        { value: "parking", label: "Parking" },
        { value: "gas", label: "Gas" },
      ],
    },
    tickets: {
      icon: Ticket,
      label: "Tickets",
      singular: "ticket",
      description: "Theme parks, attractions, events, and passes.",
      namePlaceholder: "Disney, Universal, museum, event...",
      priceLabel: "Ticket price",
      quantityLabel: "Tickets",
      dateLabel: "Visit dates",
      accent: "bg-amber-50 text-amber-700 ring-amber-100",
      priceBasisOptions: [
        { value: "total", label: "Total tickets" },
        { value: "per_person", label: "Per person" },
        { value: "per_day", label: "Per day" },
      ],
      itemTypeOptions: [
        { value: "theme_park", label: "Theme park" },
        { value: "attraction", label: "Attraction" },
        { value: "event", label: "Event" },
        { value: "pass", label: "Pass" },
      ],
    },
    food: {
      icon: Utensils,
      label: "Food",
      singular: "food item",
      description: "Dining plans, groceries, reservations, and estimates.",
      namePlaceholder: "Dining plan, grocery run, reservation...",
      priceLabel: "Estimate",
      quantityLabel: "People/days",
      dateLabel: "Meal dates",
      accent: "bg-rose-50 text-rose-700 ring-rose-100",
      priceBasisOptions: [
        { value: "total", label: "Total" },
        { value: "per_person", label: "Per person" },
        { value: "per_day", label: "Per day" },
      ],
      itemTypeOptions: [
        { value: "restaurant", label: "Restaurant" },
        { value: "groceries", label: "Groceries" },
        { value: "dining_plan", label: "Dining plan" },
        { value: "snacks", label: "Snacks" },
      ],
    },
    other: {
      icon: Package,
      label: "Other",
      singular: "item",
      description: "Insurance, fees, gear, and anything else.",
      namePlaceholder: "Insurance, fees, gear...",
      priceLabel: "Cost",
      quantityLabel: "Qty",
      dateLabel: "Dates",
      accent: "bg-slate-100 text-slate-700 ring-slate-200",
      priceBasisOptions: [
        { value: "total", label: "Total" },
        { value: "per_item", label: "Per item" },
      ],
      itemTypeOptions: [
        { value: "fee", label: "Fee" },
        { value: "insurance", label: "Insurance" },
        { value: "gear", label: "Gear" },
        { value: "misc", label: "Misc" },
      ],
    },
  }), []);

  const statusLabels = {
    considering: "Considering",
    top_choice: "Top Choice",
    eliminated: "Eliminated",
    booked: "Booked",
  };

  const formatCurrency0 = (val) =>
    Number(val || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

  const updateOptionField = (key, value) => {
    setSaveStatus("");
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const configFor = useCallback(
    (category) => categoryConfig[category] || categoryConfig.other,
    [categoryConfig]
  );
  const defaultPriceBasis = useCallback(
    (category) => configFor(category).priceBasisOptions[0]?.value || "total",
    [configFor]
  );
  const defaultItemType = useCallback(
    (category) => configFor(category).itemTypeOptions[0]?.value || "misc",
    [configFor]
  );
  const legacyPriceBasis = useCallback((category, quantity) => {
    if (Number(quantity) <= 1) return defaultPriceBasis(category);
    const multiplierOption = configFor(category).priceBasisOptions.find(
      (option) => option.value !== "total"
    );
    return multiplierOption?.value || defaultPriceBasis(category);
  }, [configFor, defaultPriceBasis]);
  const multiplierForBasis = useCallback((category, basis, item = {}) => {
    if (basis === "total") return 1;
    if (basis === "per_person") return Math.max(1, Number(trip?.travelers) || 1);
    if (basis === "per_night") {
      return (
        nightsBetween(item.start_date, item.end_date) ||
        nightsBetween(formData.trip_start, formData.trip_end) ||
        1
      );
    }
    if (basis === "per_day") {
      const itemNights = nightsBetween(item.start_date, item.end_date);
      const tripNights = nightsBetween(formData.trip_start, formData.trip_end);
      return Math.max(1, itemNights || tripNights || 1);
    }
    return Math.max(1, Number(item.quantity) || 1);
  }, [formData.trip_end, formData.trip_start, trip?.travelers]);
  const isAutoQuantityBasis = useCallback(
    (basis) => ["total", "per_person", "per_night", "per_day"].includes(basis),
    []
  );
  const quantityLabelFor = (config, basis) => {
    if (basis === "total") return "Included";
    if (basis === "per_person") return "Travelers";
    if (basis === "per_night") return "Nights";
    if (basis === "per_day") return "Days";
    return config.quantityLabel;
  };
  const defaultGroupName = useCallback((category) => {
    if (category === "lodging") return "Stay 1";
    if (category === "flight") return "Flight choice";
    if (category === "tickets") return "Ticket choice";
    if (category === "car") return "Transportation choice";
    if (category === "food") return "Food budget";
    return "Other choice";
  }, []);

  const normalizeGroupName = useCallback(
    (item) => String(item.group_name || defaultGroupName(item.category || "other")).trim(),
    [defaultGroupName]
  );

  const groupHasSelectedItem = (items, category, groupName, ignoredIndex = -1) =>
    items.some(
      (item, index) =>
        index !== ignoredIndex &&
        item.category === category &&
        normalizeGroupName(item) === groupName &&
        item.is_selected !== false
    );

  const updateCostItem = (index, key, value) => {
    setSaveStatus("");
    setFormData((prev) => ({
      ...prev,
      cost_items: (prev.cost_items || []).map((item, itemIndex) =>
        itemIndex === index
          ? (() => {
              const nextCategory = key === "category" ? value : item.category;
              const nextGroup =
                key === "group_name"
                  ? String(value || defaultGroupName(nextCategory)).trim()
                  : normalizeGroupName({ ...item, category: nextCategory });
              const nextBasis =
                key === "category"
                  ? defaultPriceBasis(value)
                  : key === "price_basis"
                  ? value
                  : item.price_basis || defaultPriceBasis(nextCategory);
              const nextItem = {
                ...item,
                [key]: value,
                group_name: nextGroup,
                ...(key === "category"
                  ? {
                      price_basis: nextBasis,
                      item_type: defaultItemType(value),
                    }
                  : {}),
                ...(key === "group_name" && item.is_selected === false
                  ? {
                      is_selected: !groupHasSelectedItem(
                        prev.cost_items || [],
                        nextCategory,
                        nextGroup,
                        index
                      ),
                    }
                  : {}),
              };

              if (key === "category" || key === "price_basis") {
                nextItem.quantity = multiplierForBasis(nextCategory, nextBasis, nextItem);
              }
              if (
                (key === "start_date" || key === "end_date") &&
                ["per_night", "per_day"].includes(nextBasis)
              ) {
                nextItem.quantity = multiplierForBasis(nextCategory, nextBasis, nextItem);
              }

              return nextItem;
            })()
          : item
      ),
    }));
  };

  const addCostItem = (category = "other") => {
    setSaveStatus("");
    setFormData((prev) => ({
      ...prev,
      cost_items: (() => {
        const existingItems = prev.cost_items || [];
        const existingCategoryItems = existingItems.filter((item) => item.category === category);
        const groupName = normalizeGroupName(
          existingCategoryItems[0] || { category, group_name: defaultGroupName(category) }
        );
        const isSelected = !groupHasSelectedItem(existingItems, category, groupName);

        return [
          ...existingItems,
          {
          category,
          name: "",
          url: "",
          price: "",
          quantity: 1,
          price_basis: defaultPriceBasis(category),
          item_type: defaultItemType(category),
          group_name: groupName,
          is_selected: isSelected,
          start_date: "",
          end_date: "",
          notes: "",
          },
        ];
      })(),
    }));
  };

  const removeCostItem = (index) => {
    setSaveStatus("");
    setFormData((prev) => ({
      ...prev,
      cost_items: (prev.cost_items || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const setCostItemSelected = (index, selected) => {
    setSaveStatus("");
    setFormData((prev) => {
      const items = prev.cost_items || [];
      const target = items[index];
      if (!target) return prev;

      const targetGroup = normalizeGroupName(target);
      return {
        ...prev,
        cost_items: items.map((item, itemIndex) => {
          if (itemIndex === index) return { ...item, is_selected: selected };
          if (
            selected &&
            item.category === target.category &&
            normalizeGroupName(item) === targetGroup
          ) {
            return { ...item, is_selected: false };
          }
          return item;
        }),
      };
    });
  };

  const nights = nightsBetween(formData.trip_start, formData.trip_end);
  const legacyTotal =
    (Number(formData.stay_expense) || 0) +
    (Number(formData.travel_expense) || 0) +
    (Number(formData.car_expense) || 0) +
    (Number(formData.other_expense) || 0);
  const itemTotal = (item) => {
    const price = Number(item.price) || 0;
    const basis = item.price_basis || defaultPriceBasis(item.category || "other");
    if (basis === "total") return price;
    return price * multiplierForBasis(item.category || "other", basis, item);
  };
  const itemCountsInTotal = (item) => item.is_selected !== false;
  const lineItemTotal = (formData.cost_items || []).reduce(
    (sum, item) => sum + (itemCountsInTotal(item) ? itemTotal(item) : 0),
    0
  );
  const total = lineItemTotal || legacyTotal;
  const boardStartYmd = toYmdLocal(trip?.board_start || trip?.trip_start);
  const boardEndYmd = toYmdLocal(trip?.board_end || trip?.trip_end);
  const itemSummary = (item) => {
    const config = configFor(item.category);
    const basis =
      config.priceBasisOptions.find((option) => option.value === item.price_basis)?.label ||
      config.priceBasisOptions[0]?.label;
    const type =
      config.itemTypeOptions.find((option) => option.value === item.item_type)?.label ||
      config.itemTypeOptions[0]?.label;
    return [type, basis, fmtRangeShort(item.start_date, item.end_date)]
      .filter(Boolean)
      .join(" · ");
  };
  const categoryTotal = (category) =>
    (formData.cost_items || [])
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + (itemCountsInTotal(item) ? itemTotal(item) : 0), 0);

  const buildSavePayload = useCallback(
    (source) => ({
      ...source,
      cost_items: (source.cost_items || []).map((item) => {
        const basis = item.price_basis || defaultPriceBasis(item.category || "other");
        return {
          ...item,
          price_basis: basis,
          item_type: item.item_type || defaultItemType(item.category || "other"),
          group_name: normalizeGroupName(item),
          is_selected: item.is_selected !== false,
          quantity: isAutoQuantityBasis(basis)
            ? multiplierForBasis(item.category || "other", basis, item)
            : item.quantity,
        };
      }),
    }),
    [
      defaultItemType,
      defaultPriceBasis,
      isAutoQuantityBasis,
      multiplierForBasis,
      normalizeGroupName,
    ]
  );

  const currentSignature = useMemo(
    () => JSON.stringify(buildSavePayload(formData)),
    [buildSavePayload, formData]
  );
  const hasUnsavedChanges = Boolean(savedSignatureRef.current && currentSignature !== savedSignatureRef.current);

  // -------- fetch --------
  useEffect(() => {
    const fetchTripInstance = async () => {
      if (globalLoading) return;
      if (!token) {
        setFetchLoading(false);
        return;
      }

      if (!trip || !instance) {
        try {
          setFetchLoading(true);
          const { data } = await axios.get(`/api/trips/boards/${tripId}/options/${instanceId}`, {
            headers: authHeaders,
          });
          setTrip(data.trip);
          setInstance(data.instance);
        } catch (err) {
          console.error("Error fetching trip instance:", err);
        } finally {
          setFetchLoading(false);
        }
      }
    };
    fetchTripInstance();
  }, [tripId, instanceId, trip, instance, token, globalLoading, authHeaders]);

  // normalize instance -> form (as yyyy-MM-dd strings; no UTC conversion)
  useEffect(() => {
    if (instance) {
      const nextFormData = {
        option_title: instance.option_title || "",
        destination: instance.destination || "",
        status: instance.status || "considering",
        trip_start: toYmdLocal(instance.trip_start),
        trip_end: toYmdLocal(instance.trip_end),
        stay_expense: instance.stay_expense ?? 0,
        travel_expense: instance.travel_expense ?? 0,
        car_expense: instance.car_expense ?? 0,
        other_expense: instance.other_expense ?? 0,
        cost_items: (instance.cost_items || []).map((item) => {
          const category = item.category || "other";
          const priceBasis = item.price_basis || legacyPriceBasis(category, item.quantity);
          const normalizedItem = {
            ...item,
            price_basis: priceBasis,
            item_type: item.item_type || defaultItemType(category),
            group_name: item.group_name || defaultGroupName(category),
            is_selected: item.is_selected === undefined ? true : Boolean(item.is_selected),
            start_date: toYmdLocal(item.start_date),
            end_date: toYmdLocal(item.end_date),
          };
          return {
            ...normalizedItem,
            quantity: isAutoQuantityBasis(priceBasis)
              ? multiplierForBasis(category, priceBasis, normalizedItem)
              : normalizedItem.quantity,
          };
        }),
        notes: instance.notes || "",
        activities: instance.activities || [],
      };
      setFormData(nextFormData);
      savedSignatureRef.current = JSON.stringify(buildSavePayload(nextFormData));
      setSaveStatus("");
      setFetchLoading(false);
    }
  }, [
    buildSavePayload,
    defaultGroupName,
    defaultItemType,
    instance,
    isAutoQuantityBasis,
    legacyPriceBasis,
    multiplierForBasis,
  ]);

  // -------- submit --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Keep dates as 'yyyy-MM-dd' strings; let the server decide how to store them.
      const normalizedFormData = buildSavePayload(formData);

      const { data } = await axios.put(
        `/api/trips/boards/${tripId}/options/${instanceId}`,
        normalizedFormData,
        { headers: authHeaders }
      );
      if (data?.trip) setTrip(data.trip);
      savedSignatureRef.current = JSON.stringify(normalizedFormData);
      setInstance(data?.instance || ((prev) => ({ ...prev, ...normalizedFormData })));
      setSaveStatus("Saved");
    } catch (error) {
      console.error("Error updating trip instance:", error);
      setSaveStatus(error?.response?.data?.msg || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!instanceId || deleteLoading) return;
    const ok = await confirm({
      title: "Delete this option?",
      description: "This removes the option and all saved items inside it. This cannot be undone.",
      confirmLabel: "Delete Option",
    });
    if (!ok) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`/api/trips/boards/${tripId}/options/${instanceId}`, {
        headers: authHeaders,
      });
      navigate(`/trips/${tripId}`);
    } catch (error) {
      console.error("Error deleting trip option:", error);
      showError(error?.response?.data?.msg || "Failed to delete option. Try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip || !instance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Trip instance not found</h2>
        <Link to="/workbench" className="text-indigo-600 hover:text-indigo-700">Return to Workbench</Link>
        </div>
      </div>
    );
  }

  // -------- UI --------
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton label="Back" />
        </div>

        <div className="relative rounded-[28px] bg-white shadow-[0_10px_40px_-10px_rgba(2,6,23,0.12)] ring-1 ring-slate-100 overflow-hidden">
          {/* Banner */}
          <div className="relative h-48">
            <img
              src={instance.image_url || trip.image_url || "/getaway-genius-logo.png"}
              alt={formData.destination || trip.location_address}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Option actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleDeleteInstance}
                disabled={deleteLoading}
                className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-rose-500/80 disabled:opacity-50"
                title="Delete option"
                type="button"
              >
                {deleteLoading ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Title + total */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div className="min-w-0 text-white">
                <p className="text-xs tracking-[0.18em] font-semibold opacity-80">TRIP OPTION</p>
                {editingHeaderField === "option_title" ? (
                  <input
                    type="text"
                    value={formData.option_title}
                    onChange={(e) => updateOptionField("option_title", e.target.value)}
                    onBlur={() => setEditingHeaderField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        e.currentTarget.blur();
                      }
                    }}
                    autoFocus
                    className="mt-1 w-full max-w-xl rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-2xl font-bold leading-tight text-slate-950 shadow-sm outline-none md:text-3xl"
                    placeholder="Option name"
                  />
                ) : (
                  <h1
                    className="mt-1 cursor-text truncate text-2xl font-bold leading-tight md:text-3xl"
                    onDoubleClick={() => setEditingHeaderField("option_title")}
                    title="Double-click to edit"
                  >
                    {formData.option_title || formData.destination || "Untitled option"}
                  </h1>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {editingHeaderField === "status" ? (
                    <AppSelect
                      value={formData.status}
                      onChange={(value) => {
                        updateOptionField("status", value);
                        setEditingHeaderField(null);
                      }}
                      options={statusOptions}
                      className="w-48"
                    />
                  ) : (
                    <button
                      type="button"
                      onDoubleClick={() => setEditingHeaderField("status")}
                      className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-white/50"
                      title="Double-click to edit"
                    >
                      {statusLabels[formData.status] || "Considering"}
                    </button>
                  )}
                  <span className="truncate text-sm opacity-90">
                    {trip.board_title || trip.location_address}
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                <span className="rounded-full bg-indigo-50/90 px-4 py-2 text-indigo-700 text-sm font-semibold shadow-sm">
                  {formatCurrency0(total)} est.
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <form
            id="trip-option-detail-form"
            onSubmit={handleSubmit}
            className={`p-6 md:p-8 ${hasUnsavedChanges ? "pb-28 md:pb-32" : ""}`}
          >
            {/* Mobile total */}
            <div className="md:hidden mb-4">
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700 text-sm font-semibold shadow-sm">
                {formatCurrency0(total)} est.
              </span>
            </div>

            {/* ===== Dates section ===== */}
            <div className="rounded-2xl ring-1 ring-slate-100 bg-gradient-to-r from-indigo-50 to-white p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white shadow flex items-center justify-center ring-1 ring-slate-100">
                    <CalendarIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Trip Dates</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatMMDDYYYYLocal(formData.trip_start)} — {formatMMDDYYYYLocal(formData.trip_end)}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      <span>
                        {nights !== null ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Duration unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Saved links and costs ===== */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Saved links and costs</h2>
                  <p className="text-sm text-slate-500">
                    Keep hotels, Airbnbs, flights, tickets, rentals, and other links here.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {itemCategories.map((category) => {
                  const config = configFor(category.value);
                  const Icon = config.icon;
                  const categoryItems = (formData.cost_items || [])
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.category === category.value);

                  return (
                    <section
                      key={category.value}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${config.accent}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="font-semibold text-slate-900">{config.label}</h3>
                            <p className="text-sm text-slate-500">{config.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <p className="text-right">
                            <span className="block text-xs font-medium text-slate-500">
                              {categoryItems.length} item{categoryItems.length === 1 ? "" : "s"}
                            </span>
                            <span className="block text-lg font-bold text-slate-900">
                              {formatCurrency0(categoryTotal(category.value))}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => addCostItem(category.value)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 p-4 lg:grid-cols-2">
                        {categoryItems.map(({ item, index }) => (
                          <article
                            key={item._id || index}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-slate-900">
                                  {item.name || `New ${config.singular}`}
                                </p>
	                                <p className="mt-0.5 text-xs text-slate-500">
	                                  {itemSummary(item) || "Details not set"}
	                                </p>
	                                <span
	                                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
	                                    itemCountsInTotal(item)
	                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
	                                      : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
	                                  }`}
	                                >
	                                  {itemCountsInTotal(item) ? "Counts in total" : "Compare only"}
	                                </span>
	                              </div>
                              <div className="flex items-center gap-2">
                                <p className="mr-1 text-right">
                                  <span className="block text-xs text-slate-500">Item total</span>
                                  <span className="block font-semibold text-slate-900">
                                    {formatCurrency0(itemTotal(item))}
                                  </span>
                                </p>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                                    aria-label="Open link"
                                    title="Open link"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeCostItem(index)}
                                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Remove item"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
	                            </div>

	                            <div className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_170px]">
	                              <label className="block">
	                                <span className="mb-1 block text-xs font-semibold text-slate-500">
	                                  {category.value === "lodging" ? "Stay segment" : "Comparison group"}
	                                </span>
	                                <input
	                                  type="text"
	                                  value={normalizeGroupName(item)}
	                                  onChange={(e) => updateCostItem(index, "group_name", e.target.value)}
	                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
	                                  placeholder={defaultGroupName(category.value)}
	                                />
	                              </label>
	                              <AppSelect
	                                label="Total behavior"
	                                value={itemCountsInTotal(item) ? "selected" : "candidate"}
	                                onChange={(value) => setCostItemSelected(index, value === "selected")}
	                                options={[
	                                  { value: "selected", label: "Counts in total" },
	                                  { value: "candidate", label: "Compare only" },
	                                ]}
	                              />
	                            </div>

	                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  {config.label === "Flights" ? "Airline or route" : "Name"}
                                </span>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateCostItem(index, "name", e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  placeholder={config.namePlaceholder}
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  {config.priceLabel}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => updateCostItem(index, "price", e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  placeholder="0.00"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  {quantityLabelFor(
                                    config,
                                    item.price_basis || defaultPriceBasis(category.value)
                                  )}
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={isAutoQuantityBasis(item.price_basis || defaultPriceBasis(category.value))
                                    ? multiplierForBasis(
                                        category.value,
                                        item.price_basis || defaultPriceBasis(category.value),
                                        item
                                      )
                                    : item.quantity}
                                  onChange={(e) => updateCostItem(index, "quantity", e.target.value)}
                                  disabled={isAutoQuantityBasis(item.price_basis || defaultPriceBasis(category.value))}
                                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${
                                    isAutoQuantityBasis(item.price_basis || defaultPriceBasis(category.value))
                                      ? "bg-slate-100 text-slate-400"
                                      : ""
                                  }`}
                                  placeholder="1"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  Price basis
                                </span>
                                <AppSelect
                                  value={item.price_basis || defaultPriceBasis(category.value)}
                                  onChange={(value) => updateCostItem(index, "price_basis", value)}
                                  options={config.priceBasisOptions}
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  Type
                                </span>
                                <AppSelect
                                  value={item.item_type || defaultItemType(category.value)}
                                  onChange={(value) => updateCostItem(index, "item_type", value)}
                                  options={config.itemTypeOptions}
                                />
                              </label>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  {config.dateLabel} start
                                </span>
                                <input
                                  type="date"
                                  min={boardStartYmd || undefined}
                                  max={item.end_date || boardEndYmd || undefined}
                                  value={item.start_date || ""}
                                  onChange={(e) => updateCostItem(index, "start_date", e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  {config.dateLabel} end
                                </span>
                                <input
                                  type="date"
                                  min={item.start_date || boardStartYmd || undefined}
                                  max={boardEndYmd || undefined}
                                  value={item.end_date || ""}
                                  onChange={(e) => updateCostItem(index, "end_date", e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  Link
                                </span>
                                <input
                                  type="url"
                                  value={item.url}
                                  onChange={(e) => updateCostItem(index, "url", e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  placeholder="https://..."
                                />
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-slate-500">
                                  Notes
                                </span>
                                <input
                                  type="text"
                                  value={item.notes}
                                  onChange={(e) => updateCostItem(index, "notes", e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  placeholder="Fees, cancellation, inclusions..."
                                />
                              </label>
                            </div>
                          </article>
                        ))}

                        {!categoryItems.length && (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                            No {config.label.toLowerCase()} items yet.
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
              {saveStatus && (
                <p
                  className={`text-sm font-medium ${
                    saveStatus === "Saved" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {saveStatus}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Items
              </button>
            </div>

            {hasUnsavedChanges && (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Unsaved changes</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency0(total)} estimated total
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripInstanceDetail;
