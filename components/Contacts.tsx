
import React from 'react';

const contactsData = [
  {
    name: "Tú - Documents",
    imgSrc: "https://i.ibb.co/md9ChwW/tu.jpg",
    phone: "0799 218 368",
    zalo: "https://zalo.me/0799218368",
  },
  {
    name: "Vi - Documents",
    imgSrc: "https://i.ibb.co/gF6mj6W8/Vi.jpg",
    phone: "076 339 5504",
    zalo: "https://zalo.me/0763395504",
  },
  {
    name: "Hoàng - Finance",
    imgSrc: "https://i.ibb.co/9kMcsknM/Hoang.jpg",
    phone: "0867 141 877",
    zalo: "https://zalo.me/0867141877",
  },
];

const ContactCard: React.FC<typeof contactsData[0]> = ({ name, imgSrc, phone, zalo }) => {
  return (
    <div className="bg-white rounded-2xl p-5 w-56 text-center shadow-md transition-transform duration-300 hover:-translate-y-1.5 flex-shrink-0">
      <img src={imgSrc} alt="avatar" className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-gray-200" />
      <h3 className="mb-3 text-lg font-bold text-[#184d47]">{name}</h3>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => alert(`📞 ${phone}`)}
          className="bg-gray-100 text-gray-700 w-12 h-12 flex items-center justify-center rounded-full text-2xl transition-colors duration-300 hover:bg-[#a8d0a2] hover:text-white"
        >
          📞
        </button>
        <button
          onClick={() => window.open(zalo, '_blank')}
          className="bg-gray-100 text-gray-700 w-12 h-12 flex items-center justify-center rounded-full text-2xl transition-colors duration-300 hover:bg-[#a8d0a2] hover:text-white"
        >
          💬
        </button>
      </div>
    </div>
  );
};

const Contacts: React.FC = () => {
  return (
    <div className="flex justify-center gap-6 my-10 flex-wrap px-4">
      {contactsData.map((contact) => (
        <ContactCard key={contact.name} {...contact} />
      ))}
    </div>
  );
};

export default Contacts;
