import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MdDeleteOutline, MdAdd, MdArrowBack } from 'react-icons/md';

export default function Reports() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    surrenderedBy: '',
    itemName: '',
    locationFound: '',
    currentOffice: '',
    dateFound: '',
    timeFound: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      navigate('/lost');
    }
  }, [navigate]);

  const fetchItems = async () => {
    try {
      // THE FIX: Asks Django specifically for the inbox, excluding Admin walk-ins
      const response = await api.get('items/?reports=true'); 
      setItems(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate('/');
      } else if (error.response && error.response.status === 403) {
  navigate('/lost');
    
      }
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`items/${id}/`, { status: newStatus });
      fetchItems(); 
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report? This cannot be undone.")) {
      try {
        await api.delete(`items/${id}/`);
        fetchItems(); 
      } catch (error) {
        alert("Failed to delete the report.");
      }
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const compiledDescription = `Surrendered by: ${formData.surrenderedBy} | Holding Office: ${formData.currentOffice} | Date: ${formData.dateFound} | Time: ${formData.timeFound}`;

    const correctStatus = formData.currentOffice === 'CSA Office' ? 'AVAILABLE_CSA' : 'AVAILABLE_MAIN';

    const payload = {
      item_name: formData.itemName,
      location_found: formData.locationFound,
      description: compiledDescription,
      category: 'OTHER', 
      status: correctStatus
    };

    try {
      await api.post('items/', payload);
      setShowModal(false);
      setFormData({ surrenderedBy: '', itemName: '', locationFound: '', currentOffice: '', dateFound: '', timeFound: '' });
      fetchItems(); 
    } catch (error) {
      alert("Failed to log the item. Please try again.");
    }
  };

  return (
    <div 
      className="min-h-screen bg-fixed bg-cover bg-center relative pb-10"
      style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto pt-24 px-6 md:px-12">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Admin Reports</h1>
            <p className="text-gray-300 mt-2 font-light">Manage, update, and resolve all campus lost and found tickets.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500 font-medium">Loading reports...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-500 font-medium">No reports have been filed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-5">Item Name</th>
                    <th className="p-5">Location</th>
                    <th className="p-5">Date Logged</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-5 font-medium text-gray-900">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-base">{item.item_name}</span>
                          
                          {/* Cryptographically verified email badge */}
                          {item.reporter_email && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 tracking-wide uppercase">
                              ID: {item.reporter_email}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 font-normal mt-2 max-w-xs truncate" title={item.description}>
                          {item.description}
                        </div>
                      </td>
                      <td className="p-5 text-gray-700">{item.location_found}</td>
                      <td className="p-5 text-gray-700">{formatDate(item.date_logged)}</td>
                      <td className="p-5">
                        <select 
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${
                            item.status === 'LOST_REPORTED' ? 'bg-red-100 text-red-800 border-red-200' :
                            item.status === 'CLAIMED' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          <option value="LOST_REPORTED">Missing Report (Private)</option>
                          <option value="AVAILABLE_CSA">Found (At CSA)</option>
                          <option value="AVAILABLE_MAIN">Found (At Main Security)</option>
                          <option value="CLAIMED">Claimed / Resolved</option>
                        </select>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Ticket"
                        >
                          <MdDeleteOutline size={22} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (+) for Admins */}
      {!showModal && (
        <button 
          onClick={() => setShowModal(true)}
          className="fixed bottom-8 right-8 z-40 p-4 bg-[#AF0000] text-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:bg-[#8A0000] hover:scale-110 transition-all flex items-center justify-center"
          title="Log Walk-In Item"
        >
          <MdAdd size={32} />
        </button>
      )}

      {/* ADMIN LOG ITEM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl transform transition-all">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 left-6 text-black hover:text-gray-600 transition-colors"
            >
              <MdArrowBack size={28} />
            </button>
            <div className="h-8"></div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#AF0000] mb-2 uppercase tracking-wide border-b pb-1">
                  Log Office Walk-In
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-1">Name (Finder/Surrenderer)</label>
                <input type="text" required value={formData.surrenderedBy} onChange={(e) => setFormData({...formData, surrenderedBy: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-1">Item Surrendered</label>
                <input type="text" required value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-1">Where was it found?</label>
                <input type="text" required value={formData.locationFound} onChange={(e) => setFormData({...formData, locationFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-1">Current Holding Office</label>
                <select required value={formData.currentOffice} onChange={(e) => setFormData({...formData, currentOffice: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors bg-white cursor-pointer">
                  <option value="" disabled>Select holding office...</option>
                  <option value="CSA Office">CSA Office</option>
                  <option value="Main Security Office">Main Security Office</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm text-gray-900 mb-1">Date Found</label>
                  <input type="date" required value={formData.dateFound} onChange={(e) => setFormData({...formData, dateFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm text-gray-900 mb-1">Time Found</label>
                  <input type="time" required value={formData.timeFound} onChange={(e) => setFormData({...formData, timeFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button type="submit" className="px-10 py-3 bg-[#AF0000] text-white font-bold text-xl rounded-2xl shadow-md hover:shadow-lg hover:bg-[#8A0000] transition-all">ADD TO SYSTEM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}