import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notification, setNotification] = useState(null); 
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);
    
    if (password !== confirmPassword) {
      setNotification({ type: 'error', text: "Passwords do not match!" });
      return;
    }

    try {
      await api.post('users/set-password/', {
        token: token,
        password: password
      });
      
      setNotification({ type: 'success', text: "Password saved! Redirecting to login..." });
      setTimeout(() => navigate('/'), 2000); // Wait 2 seconds so they can read the success message
      
    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', text: "Failed to set password. The link may be invalid or expired." });
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      
      {/* LEFT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          
          <div className="mb-8 text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set New Password</h1>
            <h2 className="text-2xl text-gray-900">Secure your ALAM System account</h2>
          </div>

          {notification && (
            <div className={`mb-6 p-4 text-sm rounded-xl border ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {notification.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-2">New Password</label>
              <input 
                type="password" required 
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}"
                title="Must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] outline-none transition-colors" 
                placeholder="••••••••"
              />
              <p className="mt-2 text-[11px] text-gray-500 leading-tight">
                Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (!@#$%^&*).
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-2">Confirm Password</label>
              <input 
                type="password" required 
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] outline-none transition-colors" 
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full py-3 text-white bg-[#AF0000] hover:bg-[#8A0000] rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all"
              >
                SAVE & LOGIN
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* RIGHT SIDE: Presentation Image */}
      <div 
        className="hidden lg:flex w-1/2 relative bg-gray-900 bg-cover bg-center"
        style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }} 
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 flex flex-col justify-center items-end w-full h-full p-16 text-right">
          <h3 className="text-sm font-semibold text-white tracking-widest uppercase mb-1">
            ALAM System
          </h3>
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
            <span className="text-[#AF0000]">LPU - C</span> LOST & FOUND
          </h1>
          <p className="text-sm text-gray-200 max-w-md leading-relaxed">
            securely log in to our integrated recovery network and take the first step toward turning a missing item into a successful return.
          </p>
        </div>
      </div>

    </div>
  );
}