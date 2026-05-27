"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  selectedDate?: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  selectedDate = new Date(),
  onSelect,
  onClose,
}: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);

  const [tempDate, setTempDate] = useState(selectedDate);

  const currentMonth = tempDate.getMonth();
  const currentYear = tempDate.getFullYear();

  const today = new Date();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, [onClose]);

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

    const prevMonthDays = new Date(
      currentYear,
      currentMonth,
      0
    ).getDate();

    const calendarDays = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push({
        date: prevMonthDays - i,
        currentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        date: i,
        currentMonth: true,
      });
    }

    while (calendarDays.length < 42) {
      calendarDays.push({
        date: calendarDays.length - (firstDay + daysInMonth) + 1,
        currentMonth: false,
      });
    }

    return calendarDays;
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    setTempDate(
      new Date(currentYear, currentMonth - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setTempDate(
      new Date(currentYear, currentMonth + 1, 1)
    );
  };

  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    let date;

    if (isCurrentMonth) {
      date = new Date(currentYear, currentMonth, day);
    } else if (day > 20) {
      date = new Date(currentYear, currentMonth - 1, day);
    } else {
      date = new Date(currentYear, currentMonth + 1, day);
    }

    setTempDate(date);
  };

  const handleDone = () => {
    onSelect(tempDate);
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 mt-2 w-[350px] rounded-2xl border border-pneutral-100 bg-white px-4 pt-4 pb-3 shadow-xl"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-pneutral-200"
        >
          <img
            src="/icons/CalendarLeft.svg"
            className="h-4 w-4"
          />
        </button>

        <h2 className="text-lg font-medium text-pneutral-900">
          {tempDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          type="button"
          onClick={handleNextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-pneutral-200"
        >
          <img
            src="/icons/CalendarRight.svg"
            className="h-4 w-4"
          />
        </button>
      </div>

      {/* Week Labels */}
      <div className="mb-3 grid grid-cols-7">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm text-pneutral-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-y-2">
        {days.map((dayObj, index) => {
          const isSelected =
            dayObj.date === tempDate.getDate() &&
            dayObj.currentMonth;

          const isToday =
            dayObj.date === today.getDate() &&
            dayObj.currentMonth &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <button
              key={index}
              type="button"
              onClick={() =>
                handleDateClick(
                  dayObj.date,
                  dayObj.currentMonth
                )
              }
              className={`
                mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-base
                ${
                  isSelected
                    ? "bg-primary-900 text-white"
                    : isToday
                    ? "bg-pneutral-100 text-pneutral-900"
                    : dayObj.currentMonth
                    ? "text-pneutral-900"
                    : "text-primary-100"
                }
              `}
            >
              {dayObj.date}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end gap-2 border-t border-pneutral-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-pneutral-200 px-4 text-pneutral-900"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDone}
          className="h-10 rounded-xl bg-primary-900 px-4 text-white shadow-[inset_0px_-2px_2px_0px_#3030301A,inset_0px_12px_12px_0px_#FFFFFF1F]"
        >
          Done
        </button>
      </div>
    </div>
  );
}