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
        <div key={`prev-${i}`} className="p-3 text-center rounded-full text-white/20 text-sm">
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
            p-3 text-center rounded-full transition-all duration-200 text-sm
            ${isToday ? 'bg-green-500 text-white font-bold shadow-lg shadow-green-500/50' : 'text-white/90'}
            ${!isToday ? 'hover:bg-white/20 cursor-pointer' : ''}
            ${isSunday && !isToday ? 'text-red-300' : ''}
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
            <div key={`next-${d}`} className="p-3 text-center rounded-full text-white/20 text-sm">
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

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 w-full text-white shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className="flex justify-center gap-3 w-full">
            <select value={month} onChange={handleMonthChange} className="bg-transparent text-white font-bold text-center outline-none cursor-pointer appearance-none hover:text-green-300 transition-colors">
                {monthsVN.map((m, i) => <option key={i} value={i} className="text-gray-800">{m}</option>)}
            </select>
            <span className="text-white/50">/</span>
            <select value={year} onChange={handleYearChange} className="bg-transparent text-white font-bold text-center outline-none cursor-pointer appearance-none hover:text-green-300 transition-colors">
                {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map(y => <option key={y} value={y} className="text-gray-800">{y}</option>)}
            </select>
        </div>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 text-center gap-2 mb-4">
        {dayNames.map((day, index) => (
          <div key={day} className={`font-bold text-xs uppercase tracking-wider ${index === 0 ? 'text-red-300' : 'text-white/50'}`}>{day}</div>
        ))}
        {days}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <h3 className="font-bold text-green-300 text-sm mb-3 flex items-center gap-2">
            <span>📢</span> Thông báo
        </h3>
        <ul className="text-sm text-gray-200 space-y-2 leading-relaxed">
          <li>• Lịch làm việc: T2-T6, sáng T7.</li>
          <li>• Hoàn cược: 1-2 tuần sau khi nhận hồ sơ.</li>
          <li className="bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-yellow-200 font-bold block mb-1">Lịch nghỉ Tết</span>
            Nghỉ: <b>14/02/2026</b> <br/>
            Làm lại: <b>23/02/2026</b>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Calendar;