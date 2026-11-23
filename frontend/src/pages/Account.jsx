import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Account() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });
  
  const [userData, setUserData] = useState({
    full_name: '',
    role: '',
    email: '',
    id_number: '',
    username: '',
    contact_number: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    const fetchProfile = async () => {
      try {
        const response = await api.get('users/profile/');
        setUserData(response.data);
        setStatus(prev => ({ ...prev, loading: false }));
      } catch (error) {
        setStatus(prev => ({ ...prev, loading: false, error: 'Failed to load profile.' }));
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSave = async () => {
    setStatus(prev => ({ ...prev, saving: true, error: '', success: '' }));
    try {
      await api.put('users/profile/', {
        full_name: userData.full_name,
        contact_number: userData.contact_number
      });
      setStatus(prev => ({ ...prev, saving: false, success: 'Profile updated successfully!' }));
      setIsEditing(false);
      
      setTimeout(() => setStatus(prev => ({ ...prev, success: '' })), 3000);
    } catch (error) {
      setStatus(prev => ({ ...prev, saving: false, error: 'Failed to save changes.' }));
    }
  };

  if (status.loading) return <div className="min-h-screen bg-black/10 flex items-center justify-center font-bold">Loading...</div>;

  return (
    <div 
      className="min-h-screen bg-fixed bg-cover bg-center relative flex items-center justify-center p-4"
      style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      {/* Added space-y-4 to create that fair space between the containers */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-4 pt-10">
        
        {/* TOP CONTAINER: Changed to w-full to perfectly match the bottom container's width */}
        <div className="bg-white w-full py-4 px-6 rounded-[2rem] shadow-xl text-center z-20">
          <h1 className="text-xl font-bold text-black tracking-wide">ACCOUNT</h1>
          <p className="text-[11px] sm:text-xs text-black font-medium mt-1">
            Please fill in the necessary personal details
          </p>
        </div>

        {/* BOTTOM CONTAINER: Removed the negative margin (-mt-6) to stop the collision */}
        <div className="bg-white w-full rounded-[2rem] p-8 shadow-2xl relative">
          
          {/* Edit Button (Pencil Icon) */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-8 right-8 text-gray-400 hover:text-[#AF0000] transition-colors"
            title="Edit Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>

          {/* Status Notifications */}
          {status.success && <div className="mb-4 p-2 bg-green-100 text-green-800 text-xs rounded-xl text-center font-bold">{status.success}</div>}
          {status.error && <div className="mb-4 p-2 bg-red-100 text-red-800 text-xs rounded-xl text-center font-bold">{status.error}</div>}

          <div className="w-full flex flex-col items-center space-y-5 text-center mt-2">
            
            {/* FULL NAME */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Full Name</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={userData.full_name} 
                  onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                  className="w-full max-w-[250px] border border-black rounded-sm px-2 py-1 outline-none focus:ring-1 focus:ring-[#AF0000] text-center text-sm font-bold"
                  placeholder="e.g. Juan Dela Cruz"
                />
              ) : (
                <h2 className="text-xl font-bold text-black uppercase">{userData.full_name || "NAME NOT SET"}</h2>
              )}
            </div>

            {/* ROLE */}
            <div>
              <p className="text-xs font-semibold text-gray-500 tracking-widest uppercase">{userData.role}</p>
            </div>

            {/* EMAIL (Read-Only) */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">School Email</label>
              <p className="text-sm font-medium text-black">{userData.email}</p>
            </div>

            {/* ID NUMBER (Read-Only) */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">ID Number</label>
              <p className="text-sm font-medium text-black">{userData.id_number || "Not assigned"}</p>
            </div>

            {/* CONTACT NUMBER */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Contact Number</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={userData.contact_number} 
                  onChange={(e) => setUserData({...userData, contact_number: e.target.value})}
                  className="w-full max-w-[250px] border border-black rounded-sm px-2 py-1 outline-none focus:ring-1 focus:ring-[#AF0000] text-center text-sm font-medium"
                  placeholder="09123456789"
                />
              ) : (
                <p className="text-sm font-medium text-black">{userData.contact_number || "Not provided"}</p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {(isEditing || userData.role === 'ADMIN') && (
              <div className="pt-4 flex justify-center w-full">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    disabled={status.saving}
                    className="px-10 py-3 bg-green-700 text-white font-bold text-xs rounded-full shadow-md hover:bg-green-800 transition-colors disabled:opacity-50 tracking-wider w-[80%]"
                  >
                    {status.saving ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/history')}
                    className="px-10 py-3 bg-[#AF0000] text-white font-bold text-xs rounded-full shadow-md hover:bg-[#8A0000] transition-colors tracking-wider w-[80%]"
                  >
                    ACCOUNT HISTORY
                  </button>
                )}
              </div>
            )}
            </div>

          </div>
        </div>

      </div>
  );
}