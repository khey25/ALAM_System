import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MdArrowBack } from 'react-icons/md';

export default function Login() {
  const [view, setView] = useState('login'); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [notification, setNotification] = useState(null); 
  
  const navigate = useNavigate();

  const handleViewChange = (newView) => {
    setView(newView);
    setNotification(null);
    setPassword(''); 
  };

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setNotification(null); 
    
    if (view === 'guest') {
  localStorage.clear();
  localStorage.setItem('guestName', name);
  navigate('/lost');
      
    } else if (view === 'setup') {
      try {
        await api.post('users/setup/', { email });
        setNotification({ type: 'success', text: `Success! A setup link has been sent to ${email}.` });
        setView('login');
      } catch (error) {
        setNotification({ type: 'error', text: "Failed to send request. Is the server running?" });
      }
      
    } else if (view === 'forgot') {
      try {
        await api.post('users/forgot-password/', { email });
        setNotification({ type: 'success', text: `If an account exists for ${email}, a reset link has been sent.` });
        setView('login');
      } catch (error) {
        setNotification({ type: 'error', text: "Failed to send request. Is the server running?" });
      }
      
    } else {
      try { 
        const response = await api.post('users/login/', { 
          email, 
          password 
        });
        
        const data = response.data;
        
        // --- THE FIX: We now save data.access instead of data.token ---
        localStorage.setItem('token', data.access); 
        localStorage.setItem('role', data.role);
        localStorage.setItem('loginTimestamp', Date.now()); 
        
        navigate('/lost');
        
      } catch (error) {
        console.error(error);
        setNotification({ type: 'error', text: "Invalid email or password. Please try again." });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      
      {/* LEFT SIDE: Form & Logic */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative">
        
        <div className="w-full max-w-md mx-auto lg:mx-0">
          
          {/* BACK ARROW BUTTON */}
          {view !== 'login' && (
            <button 
              type="button" 
              onClick={() => handleViewChange('login')} 
              className="mb-6 -ml-2 p-2 text-gray-900 hover:bg-gray-100 rounded-full transition-colors w-fit flex items-center justify-center"
              title="Back to Sign In"
            >
              <MdArrowBack size={28} />
            </button>
          )}
          
          {/* Dynamic Header */}
          <div className="mb-8 text-left">
            {view === 'login' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h1>
                <h2 className="text-2xl text-gray-900">Log in to your account</h2>
              </>
            )}
            {view === 'guest' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Guest Access</h1>
                <h2 className="text-2xl text-gray-900">Enter your details</h2>
              </>
            )}
            {view === 'setup' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">First time here?</h1>
                <h2 className="text-2xl text-gray-900">Set up your account</h2>
              </>
            )}
            {view === 'forgot' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
                <h2 className="text-2xl text-gray-900">Make sure to enter a valid email address</h2>
              </>
            )}
          </div>

          {/* INLINE NOTIFICATION */}
          {notification && (
            <div className={`mb-6 p-4 text-sm rounded-xl border ${
              notification.type === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {notification.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* EMAIL INPUT */}
            {view !== 'guest' && (
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-2">Email</label>
                <input 
                  type="email" required
                  pattern="[0-9]{4}-[0-9]-[0-9]{5}@lpunetwork\.edu\.ph"
                  title="Format: 0000-0-00000@lpunetwork.edu.ph"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] outline-none transition-colors" 
                  placeholder="@lpunetwork.edu.ph"
                />
              </div>
            )}

            {/* PASSWORD INPUT */}
            {view === 'login' && (
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-2">Password</label>
                <input 
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] outline-none transition-colors" 
                  placeholder="Enter your password"
                />
                
                <div className="flex justify-end mt-2">
                  <button 
                    type="button" 
                    onClick={() => handleViewChange('forgot')} 
                    className="text-sm text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {/* GUEST NAME INPUT */}
            {view === 'guest' && (
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-2">Full Name</label>
                <input 
                  type="text" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] outline-none transition-colors" 
                  placeholder="Juan Dela Cruz"
                />
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-32 py-3 text-white bg-[#AF0000] hover:bg-[#8A0000] rounded-xl font-bold tracking-wide shadow-md hover:shadow-lg transition-all"
              >
                {view === 'login' ? 'LOG IN' : 
                 view === 'guest' ? 'ENTER' : 
                 view === 'setup' ? 'SEND LINK' : 'RESET'}
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          {view === 'login' && (
            <div className="mt-16 flex flex-col items-start space-y-4">
              <button type="button" onClick={() => handleViewChange('guest')} className="text-sm text-gray-500 hover:underline transition-colors">
                Enter as a guest
              </button>
              <button type="button" onClick={() => handleViewChange('setup')} className="text-sm text-blue-600 hover:underline hover:text-blue-800 transition-colors">
                First time login? Setup Account
              </button>
            </div>
          )}

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
