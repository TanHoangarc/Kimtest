
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-cover bg-center relative text-white text-center py-10 px-5">
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('https://picsum.photos/1200/400?image=1043')" }}
      ></div>
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-shadow">
        Welcome, Kimberryline!
      </h1>
    </header>
  );
};

export default Header;
