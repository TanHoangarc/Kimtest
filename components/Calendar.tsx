
import React, { useState, useEffect, useCallback } from 'react';

const monthsVN = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<React.ReactNode[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const renderCalendar = useCallback((yearParam: number, monthParam: number) => {
    const firstDay = new Date(yearParam, monthParam, 1).getDay();
    const daysInMonth = new Date(yearParam, monthParam + 1, 0).getDate();
    const prevMonthDays = new Date(yearParam, monthParam, 0).getDate();
    const today = new Date();
    
    const calendarDays: React.ReactNode[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push(
        <div key={`prev-${i}`} className="p-3 text-center rounded-full text-gray-300">
          {prevMonthDays - i}
        </div>
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && monthParam === today.getMonth() && yearParam === today.getFullYear();
      const isSunday = new Date(yearParam, monthParam, d).getDay() === 0;
      calendarDays.push(
        <div
          key={`current-${d}`}
          className={`
            p-3 text-center rounded-full transition-all duration-200
            ${isToday ? 'bg-[#5c9ead] text-white font-bold' : ''}
            ${!isToday ? 'hover:bg-[#a8d0a2] hover:text-white cursor-pointer' : ''}
            ${isSunday && !isToday ? 'text-red-500' : ''}
          `}
        >
          {d}
        </div>
      );
    }

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
  }, []);

  useEffect(() => {
    renderCalendar(year, month);
  }, [year, month, renderCalendar]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(year, parseInt(e.target.value), 1));
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), month, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 w-full font-sans text-gray-800">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className="flex justify-center gap-3 w-full">
            <select value={month} onChange={handleMonthChange} className="border-none bg-gray-100 rounded-lg p-2 text-sm font-semibold outline-none cursor-pointer w-full">
                {monthsVN.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={handleYearChange} className="border-none bg-gray-100 rounded-lg p-2 text-sm font-semibold outline-none cursor-pointer w-full">
                {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 text-center gap-2">
        {dayNames.map((day, index) => (
          <div key={day} className={`font-bold text-gray-500 text-xs ${index === 0 ? 'text-red-500' : ''}`}>{day}</div>
        ))}
        {days}
      </div>
      <div className="mt-5 text-left bg-[#ceffe5] rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-800 text-base mb-2">🗒️ Thông báo</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Lịch làm việc của Kimberry từ T2-T6, sáng T7 hàng tuần.</li>
          <li>Kimberry sẽ Hoàn cược 1-2 tuần khi nhận được hồ sơ hoàn cược.</li>
          <li>
            Thông báo nghỉ Tết.<br />
            - Thời gian nghỉ: <b>14/02/2026</b> (Dương lịch).<br />
            - Thời làm lại: <b>23/02/2026</b> (Dương lịch)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Calendar;
