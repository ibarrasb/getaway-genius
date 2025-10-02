// components/ui/calendar.jsx
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function Calendar({ className, ...props }) {
  return (
    <DayPicker
      className={`p-3 rounded-md bg-white border shadow ${className}`}
      {...props}
    />
  );
}
