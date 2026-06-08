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

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

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
    setTempDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setTempDate(new Date(currentYear, currentMonth + 1, 1));
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
      className="absolute z-50 mt-2 w-71 h-91 rounded-lg border border-pneutral-100 bg-white p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 border-pneutral-200 rounded-lg border flex items-center justify-center"
        >
          <img src="/icons/CalendarLeft.svg" className="h-4 w-4" />
        </button>

        <h2 className="text-p3 font-medium text-pneutral-900">
          {tempDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          type="button"
          onClick={handleNextMonth}
         className="w-8 h-8 border-pneutral-200 rounded-lg border flex items-center justify-center"
        >
          <img src="/icons/CalendarRight.svg" className="h-4 w-4" />
        </button>
      </div>

      {/* Week Labels */}
      <div className="grid grid-cols-7">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-p3 font-normal text-pneutral-400">
            {day}
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7">
        {days.map((dayObj, index) => {
          const isSelected =
            dayObj.date === tempDate.getDate() && dayObj.currentMonth;

          const isToday =
            dayObj.date === today.getDate() &&
            dayObj.currentMonth &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(dayObj.date, dayObj.currentMonth)}
              className={`
                mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-p3 font-medium text-pneutral-400
                ${
                  isSelected
                    ? "bg-primary-900 text-white"
                    : isToday
                      ? "bg-sneutral-100 text-pneutral-900"
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
      <div className="mt-2 flex justify-end gap-2 border-t border-pneutral-200 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="w-15.25 h-8 rounded-lg border border-pneutral-200"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDone}
          className="w-13 h-8 rounded-lg bg-primary-900 text-white shadow-[inset_0px_-2px_2px_0px_#3030301A,inset_0px_12px_12px_0px_#FFFFFF1F]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
