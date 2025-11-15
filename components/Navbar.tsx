
import React from 'react';
import { ViewType } from '../types';

interface NavbarProps {
  setActiveView: (view: ViewType) => void;
}

const NavButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="bg-[#a8d0a2] text-gray-800 hover:bg-[#5c9ead] hover:text-white font-semibold m-2 px-5 py-3 rounded-lg text-sm transition-colors duration-300 shadow-sm"
  >
    {children}
  </button>
);

const Navbar: React.FC<NavbarProps> = ({ setActiveView }) => {
  return (
    <nav className="flex justify-center flex-wrap bg-white p-2 shadow-md sticky top-0 z-20">
      <NavButton onClick={() => setActiveView('tariff')}>Tariff Vietnam</NavButton>
      <NavButton onClick={() => setActiveView('handbook')}>Tài khoản Kimberry</NavButton>
      <NavButton onClick={() => setActiveView('policies')}>Hồ sơ Hoàn cược</NavButton>
      <NavButton onClick={() => setActiveView('template')}>File mẫu CVHC</NavButton>
      <NavButton onClick={() => setActiveView('marketing')}>Tra cứu Job</NavButton>
      <NavButton onClick={() => setActiveView('submission')}>Nộp hồ sơ</NavButton>
    </nav>
  );
};

export default Navbar;
