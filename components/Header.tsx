import React from 'react';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-cover bg-center relative text-white text-center py-10 px-5">
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('https://picsum.photos/1200/400?image=1043')" }}
      ></div>
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      
      {onLogout && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onLogout}
            className="bg-white/20 text-white hover:bg-white/40 font-semibold px-4 py-2 rounded-lg text-sm transition-colors duration-300 backdrop-blur-sm"
          >
            Đăng xuất
          </button>
        </div>
      )}

      <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-shadow">
        Welcome, Kimberryline!
      </h1>
    </header>
  );
};

export default Header;
