import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Support() {
  const navigate = useNavigate();
  
  // Notice there is no email state here! 
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });
  
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  // Security Check: Only logged-in users (Students or Admins) can be here
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });
    
    try {
      // This will hit our upcoming Django email endpoint
      await api.post('users/support/', formData);
      setStatus({ loading: false, success: true, error: '' });
      setFormData({ name: '', subject: '', message: '' }); // Clear form
      
      // Hide the success message after 4 seconds
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 4000);
    } catch (error) {
      setStatus({ loading: false, success: false, error: 'Failed to send message. Please try again later.' });
    }
  };

  return (
    <div 
      className="min-h-screen bg-fixed bg-cover bg-center relative flex items-center justify-center p-4"
      style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }}
    >
      {/* Subtle dark/blur overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-4 pt-10">
        
        {/* TOP CONTAINER: Changed from w-[85%] to w-full */}
        <div className="bg-white w-full py-4 px-6 rounded-[2rem] shadow-xl text-center z-20">
          <h1 className="text-xl font-bold text-black tracking-wide">SUPPORT</h1>
          <p className="text-[11px] sm:text-xs text-black font-medium mt-1">
            Your inquiries will be sent to the IT team
          </p>
        </div>

        {/* BOTTOM CONTAINER: Main Form */}
        <div className="bg-white w-full rounded-[2rem] p-8 shadow-2xl relative -mt-6">
          
          {/* Status Notifications */}
          {status.success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 text-sm rounded-xl text-center font-bold">
              Message sent successfully!
            </div>
          )}
          
          {status.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 text-sm rounded-xl text-center font-bold">
              {status.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            
            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Name</label>
              <input 
                type="text" required
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-black rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Subject</label>
              <input 
                type="text" required
                value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full border border-black rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-black mb-1">Message</label>
              <textarea 
                required rows="5"
                value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full border border-black rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] resize-none"
              ></textarea>
            </div>

            <div className="pt-2 flex justify-center">
              <button 
                type="submit" 
                disabled={status.loading}
                className="px-14 py-3 bg-[#AF0000] text-white font-bold text-sm rounded-2xl shadow-md hover:bg-[#8A0000] transition-colors disabled:opacity-50 tracking-wider"
              >
                {status.loading ? 'SENDING...' : 'SEND'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}