// src/pages/trips/TripInstanceDetail.jsx
import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  CircleDollarSign,
  Plus,
  Trash2,
  ExternalLink,
  BedDouble,
  Plane,
  CarFront,
  Ticket,
  Utensils,
  Package,
  CheckCircle2,
  Pencil,
  X,
  FileText,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { TripOptionSkeleton } from "@/components/skeletons/AppSkeletons.jsx";
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [editingHeaderField, setEditingHeaderField] = useState(null);
  const [activeCategory, setActiveCategory] = useState("lodging");
  const [expandedItemKey, setExpandedItemKey] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(!stateData.trip || !stateData.instance);
  const savedSignatureRef = useRef("");
  const autoSaveTimerRef = useRef(null);
  const saveSequenceRef = useRef(0);
  const savingSignatureRef = useRef("");
  const latestFormDataRef = useRef(null);
  const latestSignatureRef = useRef("");
  const hydratedInstanceSignatureRef = useRef("");

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
  const purchaseStatusLabels = {
    considering: "Not booked",
    booked: "Booked",
    purchased: "Purchased",
  };
  const purchaseStatusOptions = Object.entries(purchaseStatusLabels).map(([value, label]) => ({
    value,
    label,
  }));

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

  const compareSetLabel = (category) => {
    if (category === "lodging") return "Stay option group";
    if (category === "flight") return "Flight option group";
    if (category === "car") return "Transportation option group";
    if (category === "tickets") return "Ticket option group";
    if (category === "food") return "Food option group";
    return "Option group";
  };

  const compareSetHelp = (category) => {
    if (category === "lodging") return "Name the set of places you are choosing between, like Hotel options or Beach stay.";
    if (category === "flight") return "Name the set of flights you are choosing between, like Morning flight or Main route.";
    if (category === "car") return "Name the set of transportation choices, like Rental car or Airport transfer.";
    if (category === "tickets") return "Name the set of tickets you are choosing between, like Park tickets or Museum passes.";
    if (category === "food") return "Name the food budget this belongs to, like Restaurants or Groceries.";
    return "Name the set this item belongs to.";
  };

  const normalizeGroupName = useCallback(
    (item) => String(item.group_name || defaultGroupName(item.category || "other")).trim(),
    [defaultGroupName]
  );
  const categoryAllowsMultipleIncluded = (category) =>
    ["tickets", "food", "other"].includes(category);

  const groupHasSelectedItem = (items, category, groupName, ignoredIndex = -1) =>
    !categoryAllowsMultipleIncluded(category) &&
    items.some(
      (item, index) =>
        index !== ignoredIndex &&
        item.category === category &&
        normalizeGroupName(item) === groupName &&
        item.is_selected !== false
    );

  const updateCostItem = (index, key, value) => {
    setSaveStatus("");
    setFormData((prev) => {
      const nextData = {
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
                if (key === "ticket_day_mode") {
                  nextItem.ticket_days = Math.max(1, Number(nextItem.ticket_days) || 1);
                  nextItem.selected_dates =
                    value === "exact_days" ? nextItem.selected_dates || [""] : [];
                  if (value === "one_day") nextItem.end_date = "";
                }
                if (key === "ticket_days") {
                  const nextCount = Math.max(1, Number(value) || 1);
                  nextItem.ticket_days = nextCount;
                  nextItem.selected_dates = Array.from({ length: nextCount }, (_, dateIndex) =>
                    nextItem.selected_dates?.[dateIndex] || ""
                  );
                }

                return nextItem;
              })()
            : item
        ),
      };
      persistTripOption(nextData);
      return nextData;
    });
  };

  const addCostItem = (category = "other") => {
    setSaveStatus("");
    setFormData((prev) => {
      const nextData = {
        ...prev,
        cost_items: (() => {
        const existingItems = prev.cost_items || [];
        const existingCategoryItems = existingItems.filter((item) => item.category === category);
        const groupName = normalizeGroupName(
          existingCategoryItems[0] || { category, group_name: defaultGroupName(category) }
        );
        const isSelected = !groupHasSelectedItem(existingItems, category, groupName);
        const allowsMultiple = categoryAllowsMultipleIncluded(category);

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
          is_selected: allowsMultiple ? true : isSelected,
          purchase_status: "considering",
          confirmation_code: "",
          start_date: "",
          end_date: "",
          check_in_time: "",
          check_out_time: "",
          depart_time: "",
          arrive_time: "",
          return_depart_time: "",
          return_arrive_time: "",
          ticket_day_mode: category === "tickets" ? "one_day" : "",
          ticket_days: 1,
          selected_dates: [],
          notes: "",
          },
        ];
      })(),
      };
      persistTripOption(nextData);
      return nextData;
    });
  };

  const removeCostItem = (index) => {
    setSaveStatus("");
    setFormData((prev) => {
      const nextData = {
        ...prev,
        cost_items: (prev.cost_items || []).filter((_, itemIndex) => itemIndex !== index),
      };
      persistTripOption(nextData);
      return nextData;
    });
  };

  const setCostItemSelected = (index, selected) => {
    setSaveStatus("");
    setFormData((prev) => {
      const items = prev.cost_items || [];
      const target = items[index];
      if (!target) return prev;

      const targetGroup = normalizeGroupName(target);
      const nextData = {
        ...prev,
        cost_items: items.map((item, itemIndex) => {
          if (itemIndex === index) return { ...item, is_selected: selected };
          if (
            selected &&
            !categoryAllowsMultipleIncluded(target.category) &&
            item.category === target.category &&
            normalizeGroupName(item) === targetGroup
          ) {
            return { ...item, is_selected: false };
          }
          return item;
        }),
      };
      persistTripOption(nextData);
      return nextData;
    });
  };

  const updateCostItemSelectedDate = (index, dateIndex, value) => {
    setSaveStatus("");
    setFormData((prev) => {
      const nextData = {
        ...prev,
        cost_items: (prev.cost_items || []).map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          const ticketDays = Math.max(1, Number(item.ticket_days) || 1);
          const selectedDates = Array.from({ length: ticketDays }, (_, currentIndex) =>
            currentIndex === dateIndex ? value : item.selected_dates?.[currentIndex] || ""
          );
          return { ...item, selected_dates: selectedDates };
        }),
      };
      persistTripOption(nextData);
      return nextData;
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
  const formatTime = (value) => {
    if (!value) return "";
    const [hours, minutes] = String(value).split(":");
    const date = new Date();
    date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  const itemSummary = (item) => {
    const config = configFor(item.category);
    const basis =
      config.priceBasisOptions.find((option) => option.value === item.price_basis)?.label ||
      config.priceBasisOptions[0]?.label;
    const type =
      config.itemTypeOptions.find((option) => option.value === item.item_type)?.label ||
      config.itemTypeOptions[0]?.label;
    const ticketMode =
      item.category === "tickets" && item.ticket_day_mode === "exact_days"
        ? `${Math.max(1, Number(item.ticket_days) || 1)} exact day${Number(item.ticket_days) === 1 ? "" : "s"}`
        : item.category === "tickets" && item.ticket_day_mode === "multi_range"
        ? `${Math.max(1, Number(item.ticket_days) || 1)} day ticket`
        : "";
    return [type, basis, ticketMode, fmtRangeShort(item.start_date, item.end_date)]
      .filter(Boolean)
      .join(" · ");
  };
  const itemDetailRows = (item) => {
    const rows = [];
    const range = fmtRangeShort(item.start_date, item.end_date);
    if (range) rows.push({ label: "Dates", value: range });
    if (item.category === "lodging") {
      if (item.check_in_time) rows.push({ label: "Check-in", value: formatTime(item.check_in_time) });
      if (item.check_out_time) rows.push({ label: "Check-out", value: formatTime(item.check_out_time) });
    }
    if (item.category === "flight") {
      if (item.depart_time) rows.push({ label: "Depart", value: formatTime(item.depart_time) });
      if (item.arrive_time) rows.push({ label: "Land", value: formatTime(item.arrive_time) });
      if (item.return_depart_time) rows.push({ label: "Return", value: formatTime(item.return_depart_time) });
      if (item.return_arrive_time) rows.push({ label: "Return land", value: formatTime(item.return_arrive_time) });
    }
    if (item.category === "tickets" && Array.isArray(item.selected_dates) && item.selected_dates.length) {
      rows.push({
        label: "Visit days",
        value: item.selected_dates.map((date) => formatMMDDYYYYLocal(date)).filter(Boolean).join(", "),
      });
    }
    if (item.confirmation_code) rows.push({ label: "Confirmation", value: item.confirmation_code });
    if (item.notes) rows.push({ label: "Notes", value: item.notes });
    return rows.filter((row) => row.value);
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
          purchase_status: item.purchase_status || "considering",
          confirmation_code: item.confirmation_code || "",
          selected_dates: Array.isArray(item.selected_dates) ? item.selected_dates.filter(Boolean) : [],
          ticket_days: Math.max(1, Number(item.ticket_days) || 1),
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

  useEffect(() => {
    latestFormDataRef.current = formData;
    latestSignatureRef.current = currentSignature;
  }, [currentSignature, formData]);

  const persistTripOption = useCallback(
    async (source) => {
      const normalizedFormData = buildSavePayload(source);
      const signature = JSON.stringify(normalizedFormData);
      const requestId = saveSequenceRef.current + 1;
      saveSequenceRef.current = requestId;
      savingSignatureRef.current = signature;

      setSaveStatus("Saving...");

      try {
        const { data } = await axios.put(
          `/api/trips/boards/${tripId}/options/${instanceId}`,
          normalizedFormData,
          { headers: authHeaders }
        );

        if (requestId === saveSequenceRef.current) {
          if (data?.trip) setTrip(data.trip);
          savedSignatureRef.current = signature;
          setSaveStatus(
            latestSignatureRef.current === signature ? "Saved automatically" : "Saving..."
          );
          if (savingSignatureRef.current === signature) savingSignatureRef.current = "";
        }
      } catch (error) {
        console.error("Error updating trip instance:", error);
        if (requestId === saveSequenceRef.current) {
          setSaveStatus(error?.response?.data?.msg || "Autosave failed");
        }
        if (savingSignatureRef.current === signature) savingSignatureRef.current = "";
      }
    },
    [authHeaders, buildSavePayload, instanceId, tripId]
  );

  // -------- fetch --------
  useEffect(() => {
    const fetchTripInstance = async () => {
      if (globalLoading) return;
      if (!token) {
        setFetchLoading(false);
        return;
      }

      try {
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
    };
    fetchTripInstance();
  }, [tripId, instanceId, token, globalLoading, authHeaders]);

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
            purchase_status: item.purchase_status || "considering",
            confirmation_code: item.confirmation_code || "",
            start_date: toYmdLocal(item.start_date),
            end_date: toYmdLocal(item.end_date),
            check_in_time: item.check_in_time || "",
            check_out_time: item.check_out_time || "",
            depart_time: item.depart_time || "",
            arrive_time: item.arrive_time || "",
            return_depart_time: item.return_depart_time || "",
            return_arrive_time: item.return_arrive_time || "",
            ticket_day_mode: item.ticket_day_mode || (category === "tickets" ? "one_day" : ""),
            ticket_days: Math.max(1, Number(item.ticket_days) || 1),
            selected_dates: Array.isArray(item.selected_dates)
              ? item.selected_dates.map(toYmdLocal).filter(Boolean)
              : [],
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
      const nextSignature = JSON.stringify(buildSavePayload(nextFormData));
      if (hydratedInstanceSignatureRef.current === nextSignature) return;
      hydratedInstanceSignatureRef.current = nextSignature;

      setFormData(nextFormData);
      savedSignatureRef.current = nextSignature;
      setSaveStatus("");
      setFetchLoading(false);
    }
  }, [
    buildSavePayload,
    defaultGroupName,
    defaultItemType,
    instance,
    instanceId,
    isAutoQuantityBasis,
    legacyPriceBasis,
    multiplierForBasis,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges || fetchLoading || !token) return undefined;
    if (currentSignature === savingSignatureRef.current) return undefined;

    setSaveStatus("Saving...");
    autoSaveTimerRef.current = window.setTimeout(() => {
      persistTripOption(latestFormDataRef.current);
    }, 900);

    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [currentSignature, fetchLoading, formData, hasUnsavedChanges, persistTripOption, token]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (!expandedItemKey) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setExpandedItemKey(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedItemKey]);

  useEffect(() => {
    setExpandedItemKey(null);
  }, [activeCategory]);

  // -------- submit --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    await persistTripOption(formData);
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
    return <TripOptionSkeleton />;
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

  const activeCategoryConfig = configFor(activeCategory);
  const ActiveCategoryIcon = activeCategoryConfig.icon;
  const activeCategoryItems = (formData.cost_items || [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.category === activeCategory);
  const selectedItemCount = (formData.cost_items || []).filter(itemCountsInTotal).length;
  const totalItemCount = (formData.cost_items || []).length;
  const destinationLabel = formData.destination || trip.location_address || trip.board_title;

  // -------- UI --------
  return (
    <div className="gg-page">
      <div className="gg-container">
        <div className="mb-6">
          <BackButton label="Back" />
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/85 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur sm:rounded-[2rem]">
          <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
            <img
              src={instance.image_url || trip.image_url || "/getaway-genius-logo.png"}
              alt=""
              className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-35 lg:block"
              onError={(event) => {
                event.currentTarget.src = "/getaway-genius-logo.png";
                event.currentTarget.classList.remove("object-cover");
                event.currentTarget.classList.add("object-contain", "p-8");
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/70" />

            <div className="relative grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-end lg:p-7">
              <div className="min-w-0 pr-12">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {editingHeaderField === "status" ? (
                    <AppSelect
                      value={formData.status}
                      onChange={(value) => {
                        updateOptionField("status", value);
                        setEditingHeaderField(null);
                      }}
                      options={statusOptions}
                      className="w-44"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingHeaderField("status")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm"
                      title="Edit status"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                      {statusLabels[formData.status] || "Considering"}
                    </button>
                  )}
                  <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold uppercase text-white/70">
                    Trip option
                  </span>
                </div>

                {editingHeaderField === "option_title" ? (
                  <input
                    type="text"
                    value={formData.option_title}
                    onChange={(e) => updateOptionField("option_title", e.target.value)}
                    onBlur={() => setEditingHeaderField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
                    }}
                    autoFocus
                    className="w-full rounded-xl border border-white/30 bg-white px-3 py-2 text-2xl font-extrabold leading-tight text-slate-950 shadow-sm outline-none sm:text-3xl"
                    placeholder="Option name"
                  />
                ) : (
                  <div className="flex min-w-0 items-start gap-2">
                    <button
                      type="button"
                      className="block min-w-0 cursor-text text-left"
                      onClick={() => setEditingHeaderField("option_title")}
                      title="Edit option name"
                    >
                      <h1 className="line-clamp-2 text-3xl font-extrabold leading-[1.05] text-white sm:text-4xl lg:text-5xl">
                        {formData.option_title || destinationLabel || "Untitled option"}
                      </h1>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingHeaderField("option_title")}
                      className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                      aria-label="Edit option name"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur">
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <CircleDollarSign className="mb-1 h-4 w-4 text-teal-700" />
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total</p>
                  <p className="truncate text-sm font-extrabold text-slate-950 sm:text-base">{formatCurrency0(total)}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <CalendarIcon className="mb-1 h-4 w-4 text-blue-700" />
                  <p className="text-[10px] font-bold uppercase text-slate-400">Dates</p>
                  <p className="truncate text-sm font-extrabold text-slate-950 sm:text-base">
                    {fmtRangeShort(formData.trip_start, formData.trip_end) || "Not set"}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-slate-500">
                    {nights !== null ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Duration unknown"}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                  <FileText className="mb-1 h-4 w-4 text-rose-700" />
                  <p className="text-[10px] font-bold uppercase text-slate-400">Estimate</p>
                  <p className="truncate text-sm font-extrabold text-slate-950 sm:text-base">
                    {selectedItemCount}/{totalItemCount || 0}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-slate-500">items included</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeleteInstance}
              disabled={deleteLoading}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-rose-500 hover:text-white disabled:opacity-50 sm:right-5 sm:top-5"
              title="Delete option"
              type="button"
              aria-label="Delete option"
            >
              {deleteLoading ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </section>

          <form
            id="trip-option-detail-form"
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 lg:p-7"
          >
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Saved links and costs</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        saveStatus.toLowerCase().includes("failed")
                          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                          : saveStatus === "Saving..."
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      }`}
                    >
                      {saveStatus || "Autosaves"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick a category, add the options you are comparing, and choose what counts in the total.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addCostItem(activeCategory)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/15 transition hover:brightness-105 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add {activeCategoryConfig.singular}
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
                <nav className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0" aria-label="Cost categories">
                  <div className="flex w-max gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:block lg:w-auto">
                  {itemCategories.map((category) => {
                    const config = configFor(category.value);
                    const Icon = config.icon;
                    const categoryItems = (formData.cost_items || []).filter(
                      (item) => item.category === category.value
                    );
                    const isActive = activeCategory === category.value;

                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setActiveCategory(category.value)}
                        className={`flex min-w-[9.25rem] items-center gap-2 rounded-xl px-3 py-3 text-left transition lg:mb-1 lg:w-full lg:min-w-0 lg:gap-3 lg:last:mb-0 ${
                          isActive
                            ? "bg-slate-950 text-white shadow-md"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 lg:h-10 lg:w-10 ${
                            isActive ? "bg-white/15 text-white ring-white/20" : config.accent
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold lg:text-base">{config.label}</span>
                          <span className={`block text-xs ${isActive ? "text-white/70" : "text-slate-500"}`}>
                            {categoryItems.length} item{categoryItems.length === 1 ? "" : "s"} · {formatCurrency0(categoryTotal(category.value))}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  </div>
                </nav>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 sm:h-12 sm:w-12 ${activeCategoryConfig.accent}`}>
                        <ActiveCategoryIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-950 sm:text-xl">{activeCategoryConfig.label}</h3>
                        <p className="mt-1 text-sm text-slate-500">{activeCategoryConfig.description}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-slate-200 sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category total</p>
                      <p className="text-xl font-extrabold text-slate-950 sm:text-2xl">{formatCurrency0(categoryTotal(activeCategory))}</p>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {activeCategoryItems.map(({ item, index }) => {
                      const itemKey = item._id || `${activeCategory}-${index}`;
                      const isExpanded = expandedItemKey === itemKey;
                      const detailRows = itemDetailRows(item);
                      const purchaseStatus = item.purchase_status || "considering";

                      return (
                        <article
                          key={itemKey}
                          className={`overflow-hidden rounded-2xl border bg-white transition ${
                            isExpanded
                              ? "border-slate-300 shadow-md"
                              : "border-slate-200 shadow-sm hover:border-slate-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                            className="grid w-full gap-4 p-4 text-left sm:grid-cols-[minmax(0,1fr)_170px_110px_auto]"
                          >
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="min-w-0 truncate text-base font-bold text-slate-950">
                                  {item.name || `New ${activeCategoryConfig.singular}`}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                  {normalizeGroupName(item)}
                                </span>
                              </span>
                              <span className="mt-1 block truncate text-sm text-slate-500">
                                {itemSummary(item)}
                              </span>
                              {detailRows.length > 0 && (
                                <span className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {detailRows.map((row) => (
                                    <span key={`${row.label}-${row.value}`} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                                      <span className="block text-[10px] font-bold uppercase text-slate-400">
                                        {row.label}
                                      </span>
                                      <span className="mt-0.5 block truncate text-xs font-semibold text-slate-700">
                                        {row.value}
                                      </span>
                                    </span>
                                  ))}
                                </span>
                              )}
                            </span>
                            <span className="grid gap-2 sm:self-start">
                              <span
                                className={`rounded-xl px-3 py-2 ring-1 ${
                                  itemCountsInTotal(item)
                                    ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                                    : "bg-slate-50 text-slate-600 ring-slate-200"
                                }`}
                              >
                                <span className="block text-[10px] font-bold uppercase">
                                  Estimate
                                </span>
                                <span className="mt-0.5 block text-xs font-bold">
                                  {itemCountsInTotal(item) ? "Included" : "Not included"}
                                </span>
                              </span>
                              <span
                                className={`rounded-xl px-3 py-2 ring-1 ${
                                  purchaseStatus === "considering"
                                    ? "bg-white text-slate-600 ring-slate-200"
                                    : "bg-teal-50 text-teal-800 ring-teal-100"
                                }`}
                              >
                                <span className="block text-[10px] font-bold uppercase">Booking</span>
                                <span className="mt-0.5 block text-xs font-bold">
                                  {purchaseStatusLabels[purchaseStatus]}
                                </span>
                              </span>
                            </span>
                            <span className="flex items-end justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 sm:block sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                              <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Total
                              </span>
                              <span className="text-base font-extrabold text-slate-950">
                                {formatCurrency0(itemTotal(item))}
                              </span>
                            </span>
                            <span className="flex items-center justify-between gap-2 sm:justify-end">
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700"
                                  aria-label="Open link"
                                  title="Open link"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                              <span className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                Edit
                              </span>
                            </span>
                          </button>

                          {isExpanded && createPortal(
                            <div
                              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-sm transition-opacity sm:p-6"
                              role="dialog"
                              aria-modal="true"
                              aria-labelledby={`item-editor-title-${index}`}
                              onClick={() => setExpandedItemKey(null)}
                            >
                              <div
                                className="flex h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-transform sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-3xl"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                                      Edit {activeCategoryConfig.singular}
                                    </p>
                                    <h3 id={`item-editor-title-${index}`} className="mt-1 truncate text-lg font-bold text-slate-950">
                                      {item.name || `New ${activeCategoryConfig.singular}`}
                                    </h3>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{normalizeGroupName(item)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedItemKey(null)}
                                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                                    aria-label="Close item editor"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>

                                <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
                                  <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
                                    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                                      <p className="text-xs font-semibold text-slate-500">Item total</p>
                                      <p className="mt-1 text-xl font-extrabold text-slate-950">
                                        {formatCurrency0(itemTotal(item))}
                                      </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                                      <p className="text-xs font-semibold text-slate-500">Booking</p>
                                      <p className="mt-1 text-base font-bold text-slate-950">
                                        {purchaseStatusLabels[item.purchase_status || "considering"]}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                                <div className="mx-auto w-full max-w-2xl space-y-4 pb-2">
                                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold text-slate-500">
                                      {activeCategoryConfig.label === "Flights" ? "Airline or route" : "Name"}
                                    </span>
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => updateCostItem(index, "name", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                      placeholder={activeCategoryConfig.namePlaceholder}
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold text-slate-500">Link</span>
                                    <input
                                      type="url"
                                      value={item.url}
                                      onChange={(e) => updateCostItem(index, "url", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                      placeholder="https://..."
                                    />
                                  </label>
                                  </div>

                                  <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold text-slate-500">
                                      {activeCategoryConfig.priceLabel}
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.price}
                                      onChange={(e) => updateCostItem(index, "price", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                      placeholder="0.00"
                                    />
                                  </label>

                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold text-slate-500">
                                      {quantityLabelFor(
                                        activeCategoryConfig,
                                        item.price_basis || defaultPriceBasis(activeCategory)
                                      )}
                                    </span>
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      value={isAutoQuantityBasis(item.price_basis || defaultPriceBasis(activeCategory))
                                        ? multiplierForBasis(
                                            activeCategory,
                                            item.price_basis || defaultPriceBasis(activeCategory),
                                            item
                                          )
                                        : item.quantity}
                                      onChange={(e) => updateCostItem(index, "quantity", e.target.value)}
                                      disabled={isAutoQuantityBasis(item.price_basis || defaultPriceBasis(activeCategory))}
                                      className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm ${
                                        isAutoQuantityBasis(item.price_basis || defaultPriceBasis(activeCategory))
                                          ? "bg-slate-100 text-slate-400"
                                          : ""
                                      }`}
                                      placeholder="1"
                                    />
                                  </label>

                                  <AppSelect
                                    label="Price basis"
                                    value={item.price_basis || defaultPriceBasis(activeCategory)}
                                    onChange={(value) => updateCostItem(index, "price_basis", value)}
                                    options={activeCategoryConfig.priceBasisOptions}
                                  />
                                  </div>

                                  {(activeCategory !== "tickets" || (item.ticket_day_mode || "one_day") !== "exact_days") && (
                                  <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                                    <label className="block">
                                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                                        {activeCategory === "tickets"
                                          ? item.ticket_day_mode === "multi_range"
                                            ? "Valid from"
                                            : "Start day"
                                          : "Start date"}
                                      </span>
                                      <input
                                        type="date"
                                        min={boardStartYmd || undefined}
                                        max={item.end_date || boardEndYmd || undefined}
                                        value={item.start_date || ""}
                                        onChange={(e) => updateCostItem(index, "start_date", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                      />
                                    </label>

                                    {activeCategory !== "tickets" || item.ticket_day_mode === "multi_range" ? (
                                      <label className="block">
                                        <span className="mb-1 block text-xs font-semibold text-slate-500">
                                          {activeCategory === "tickets" ? "Valid through" : "End date"}
                                        </span>
                                        <input
                                          type="date"
                                          min={item.start_date || boardStartYmd || undefined}
                                          max={boardEndYmd || undefined}
                                          value={item.end_date || ""}
                                          onChange={(e) => updateCostItem(index, "end_date", e.target.value)}
                                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                        />
                                      </label>
                                    ) : null}
                                  </div>
                                  )}

                                  {activeCategory === "lodging" && (
                                    <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                                      <label className="block">
                                        <span className="mb-1 block text-xs font-semibold text-slate-500">
                                          Check-in time
                                        </span>
                                        <input
                                          type="time"
                                          value={item.check_in_time || ""}
                                          onChange={(e) => updateCostItem(index, "check_in_time", e.target.value)}
                                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                        />
                                      </label>

                                      <label className="block">
                                        <span className="mb-1 block text-xs font-semibold text-slate-500">
                                          Check-out time
                                        </span>
                                        <input
                                          type="time"
                                          value={item.check_out_time || ""}
                                          onChange={(e) => updateCostItem(index, "check_out_time", e.target.value)}
                                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                        />
                                      </label>
                                    </div>
                                  )}

                                  {activeCategory === "flight" && (
                                    <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block">
                                          <span className="mb-1 block text-xs font-semibold text-slate-500">
                                            Depart time
                                          </span>
                                          <input
                                            type="time"
                                            value={item.depart_time || ""}
                                            onChange={(e) => updateCostItem(index, "depart_time", e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                          />
                                        </label>

                                        <label className="block">
                                          <span className="mb-1 block text-xs font-semibold text-slate-500">
                                            Land time
                                          </span>
                                          <input
                                            type="time"
                                            value={item.arrive_time || ""}
                                            onChange={(e) => updateCostItem(index, "arrive_time", e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                          />
                                        </label>
                                      </div>

                                      {(item.item_type || defaultItemType(activeCategory)) !== "one_way" && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                          <label className="block">
                                            <span className="mb-1 block text-xs font-semibold text-slate-500">
                                              Return depart
                                            </span>
                                            <input
                                              type="time"
                                              value={item.return_depart_time || ""}
                                              onChange={(e) => updateCostItem(index, "return_depart_time", e.target.value)}
                                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                            />
                                          </label>

                                          <label className="block">
                                            <span className="mb-1 block text-xs font-semibold text-slate-500">
                                              Return land
                                            </span>
                                            <input
                                              type="time"
                                              value={item.return_arrive_time || ""}
                                              onChange={(e) => updateCostItem(index, "return_arrive_time", e.target.value)}
                                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                            />
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {activeCategory === "tickets" && (
                                    <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <AppSelect
                                          label="Ticket dates"
                                          value={item.ticket_day_mode || "one_day"}
                                          onChange={(value) => updateCostItem(index, "ticket_day_mode", value)}
                                          options={[
                                            { value: "one_day", label: "One day" },
                                            { value: "multi_range", label: "Multi-day range" },
                                            { value: "exact_days", label: "Exact days" },
                                          ]}
                                        />

                                        {(item.ticket_day_mode || "one_day") !== "one_day" && (
                                          <label className="block">
                                            <span className="mb-1 block text-xs font-semibold text-slate-500">
                                              Park days
                                            </span>
                                            <input
                                              type="number"
                                              min="1"
                                              step="1"
                                              value={Math.max(1, Number(item.ticket_days) || 1)}
                                              onChange={(e) => updateCostItem(index, "ticket_days", e.target.value)}
                                              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                            />
                                          </label>
                                        )}
                                      </div>

                                      {(item.ticket_day_mode || "one_day") === "exact_days" && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                          {Array.from({ length: Math.max(1, Number(item.ticket_days) || 1) }, (_, dateIndex) => (
                                            <label key={dateIndex} className="block">
                                              <span className="mb-1 block text-xs font-semibold text-slate-500">
                                                Day {dateIndex + 1}
                                              </span>
                                              <input
                                                type="date"
                                                min={boardStartYmd || undefined}
                                                max={boardEndYmd || undefined}
                                                value={item.selected_dates?.[dateIndex] || ""}
                                                onChange={(e) =>
                                                  updateCostItemSelectedDate(index, dateIndex, e.target.value)
                                                }
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                              />
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px]">
                                    <label className="block">
                                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                                        {compareSetLabel(activeCategory)}
                                      </span>
                                      <input
                                        type="text"
                                        value={normalizeGroupName(item)}
                                        onChange={(e) => updateCostItem(index, "group_name", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                        placeholder={defaultGroupName(activeCategory)}
                                      />
                                      <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                                        {compareSetHelp(activeCategory)}
                                      </span>
                                    </label>

                                    <AppSelect
                                      label="Estimate"
                                      value={itemCountsInTotal(item) ? "selected" : "candidate"}
                                      onChange={(value) => setCostItemSelected(index, value === "selected")}
                                      options={[
                                        { value: "selected", label: "Included" },
                                        { value: "candidate", label: "Not included" },
                                      ]}
                                    />

                                    <AppSelect
                                      label="Type"
                                      value={item.item_type || defaultItemType(activeCategory)}
                                      onChange={(value) => updateCostItem(index, "item_type", value)}
                                      options={activeCategoryConfig.itemTypeOptions}
                                    />
                                  </div>

                                  <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                                    <AppSelect
                                      label="Booking status"
                                      value={item.purchase_status || "considering"}
                                      onChange={(value) => updateCostItem(index, "purchase_status", value)}
                                      options={purchaseStatusOptions}
                                    />

                                    <label className="block">
                                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                                        Confirmation code
                                      </span>
                                      <input
                                        type="text"
                                        value={item.confirmation_code || ""}
                                        onChange={(e) => updateCostItem(index, "confirmation_code", e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                        placeholder="Hotel, flight, ticket, or rental code"
                                      />
                                    </label>
                                  </div>

                                  <label className="block">
                                    <span className="mb-1 block text-xs font-semibold text-slate-500">Notes</span>
                                    <input
                                      type="text"
                                      value={item.notes}
                                      onChange={(e) => updateCostItem(index, "notes", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                                      placeholder="Fees, cancellation, inclusions..."
                                    />
                                  </label>
                                </div>

                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_24px_-20px_rgba(15,23,42,0.45)] sm:px-5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeCostItem(index);
                                      setExpandedItemKey(null);
                                    }}
                                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedItemKey(null)}
                                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            </div>
                          , document.body)}
                        </article>
                      );
                    })}

                    {!activeCategoryItems.length && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center xl:col-span-2">
                        <div className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl ring-1 ${activeCategoryConfig.accent}`}>
                          <ActiveCategoryIcon className="h-5 w-5" />
                        </div>
                        <p className="font-semibold text-slate-950">No {activeCategoryConfig.label.toLowerCase()} items yet</p>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                          Add one when you have a link, price, or estimate to compare for this option.
                        </p>
                        <button
                          type="button"
                          onClick={() => addCostItem(activeCategory)}
                          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" />
                          Add {activeCategoryConfig.singular}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>

          </form>
        </div>
      </div>
    </div>
  );
};

export default TripInstanceDetail;
