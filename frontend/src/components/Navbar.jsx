import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MdMenu,
  MdArrowBack,
  MdSearch,
  MdOutlineFactCheck,
  MdChatBubbleOutline,
  MdPersonOutline,
  MdLogout,
  MdHistory,
  MdLogin
} from 'react-icons/md';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const guestName = localStorage.getItem('guestName');

  // Keep the navbar hidden on auth pages or if no valid session/guest exists
  if (
    location.pathname === '/' ||
    location.pathname.startsWith('/set-password') ||
    (!token && !guestName)
  ) {
    return null;
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-40 p-3 bg-[#AF0000] text-white rounded-full shadow-lg hover:shadow-xl hover:bg-[#8A0000] hover:scale-105 transition-all"
      >
        <MdMenu size={28} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-72 bg-[#AF0000]/95 backdrop-blur-md text-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center p-6 mb-2">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-300 hover:-translate-x-1 transition-all p-1 rounded-full border-2 border-transparent hover:border-white/20"
          >
            <MdArrowBack size={28} />
          </button>
        </div>

        <nav className="flex flex-col space-y-1 px-4">
          <Link to="/lost" className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-light">
            <MdSearch size={22} />
            <span>LOST</span>
          </Link>

          <Link to="/found" className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-light">
            <MdOutlineFactCheck size={22} />
            <span>FOUND</span>
          </Link>

          {/* Protected Links (Students, Staff, Admins) */}
          {token && (
            <Link to="/support" className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-light">
              <MdChatBubbleOutline size={22} />
              <span>SUPPORT</span>
            </Link>
          )}

          {/* Strictly Admin-Only Links */}
          {token && role === 'ADMIN' && (
            <div className="mt-4 border-t border-white/20 pt-4 space-y-1">
              <Link to="/reports" className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-bold text-yellow-300">
                <MdOutlineFactCheck size={22} />
                <span>REPORTS</span>
              </Link>
              <Link to="/history" className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-bold text-yellow-300">
                <MdHistory size={22} />
                <span>HISTORY</span>
              </Link>
            </div>
          )}

          {/* Bottom Controls */}
          {token ? (
            <div className="mt-8 border-t border-white/20 pt-6 space-y-1">
              <Link to="/account" className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-light">
                <MdPersonOutline size={22} />
                <span>ACCOUNT</span>
              </Link>

              <button onClick={handleLogout} className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-light text-left w-full">
                <MdLogout size={22} />
                <span>LOGOUT</span>
              </button>
            </div>
          ) : (
            <div className="mt-8 border-t border-white/20 pt-6">
              <button onClick={handleLogout} className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-lg tracking-wider font-light text-left w-full">
                <MdLogin size={22} />
                <span>EXIT GUEST</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}