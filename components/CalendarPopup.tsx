import React, { useState, useEffect, useCallback } from 'react';

interface CalendarPopupProps {
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const monthsVN = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const CalendarPopup: React.FC<CalendarPopupProps> = ({ onSelectDate, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<React.ReactNode[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDayClick = useCallback((day: number) => {
    const selected = new Date(year, month, day);
    onSelectDate(selected);
  }, [year, month, onSelectDate]);

  const renderCalendar = useCallback((yearParam: number, monthParam: number) => {
    const firstDay = new Date(yearParam, monthParam, 1).getDay();
    const daysInMonth = new Date(yearParam, monthParam + 1, 0).getDate();
    const prevMonthDays = new Date(yearParam, monthParam, 0).getDate();
    const today = new Date();
    
    const calendarDays: React.ReactNode[] = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push(
        <div key={`prev-${i}`} className="p-3 text-center rounded-full text-gray-300">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month's days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && monthParam === today.getMonth() && yearParam === today.getFullYear();
      const isSunday = new Date(yearParam, monthParam, d).getDay() === 0;
      calendarDays.push(
        <div
          key={`current-${d}`}
          onClick={() => handleDayClick(d)}
          className={`
            p-3 text-center rounded-full transition-all duration-200 cursor-pointer
            ${isToday ? 'bg-[#5c9ead] text-white font-bold' : 'hover:bg-[#a8d0a2] hover:text-white'}
            ${isSunday && !isToday ? 'text-red-500' : ''}
          `}
        >
          {d}
        </div>
      );
    }
     // Next month's days
    const totalCells = firstDay + daysInMonth;
    const remaining = 42 - totalCells;
    for (let d = 1; d <= remaining; d++) {
        calendarDays.push(
            <div key={`next-${d}`} className="p-3 text-center rounded-full text-gray-300">
                {d}
            </div>
        );
    }
    setDays(calendarDays);
  }, [handleDayClick]);

  useEffect(() => {
    renderCalendar(year, month);
  }, [year, month, renderCalendar]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-sm font-sans text-gray-800 animate-fade-in relative" onClick={e => e.stopPropagation()}>
         <div className="flex items-center justify-between gap-3 mb-5">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <h3 className="font-bold text-lg">{`${monthsVN[month]} ${year}`}</h3>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
         </div>
         <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 absolute top-2 right-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
         <div className="grid grid-cols-7 text-center gap-2">
            {dayNames.map((day, index) => (
                <div key={day} className={`font-bold text-gray-500 text-xs ${index === 0 ? 'text-red-500' : ''}`}>{day}</div>
            ))}
            {days}
         </div>
      </div>
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
       `}</style>
    </div>
  );
};

export default CalendarPopup;
