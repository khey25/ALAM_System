import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MdAdd, MdArrowBack, MdDeleteOutline } from 'react-icons/md';

export default function FoundItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const role = localStorage.getItem('role'); 

  // Bulk Delete States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [studentForm, setStudentForm] = useState({ name: '', itemLost: '', lastSeen: '', dateLost: '', timeLost: '' });
  const [adminForm, setAdminForm] = useState({ name: '', itemFound: '', locationFound: '', currentOffice: '', dateFound: '', timeFound: '' });

  const fetchItems = async () => {
    try {
      const response = await api.get('items/?found=true');
      setItems(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  useEffect(() => {
    fetchItems();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB'); 
  };

  // --- CARD CLICK LOGIC (Selection Mode Only) ---
  const handleCardClick = (item) => {
    if (role !== 'ADMIN' || !isSelectionMode) return;

    if (selectedIds.includes(item.id)) {
      setSelectedIds(selectedIds.filter(id => id !== item.id));
    } else {
      setSelectedIds([...selectedIds, item.id]);
    }
  };

  // --- BULK DELETE ---
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete these ${selectedIds.length} claimed items?`)) {
      try {
        await api.post('items/bulk-delete/', { item_ids: selectedIds });
        setSelectedIds([]);
        setIsSelectionMode(false);
        fetchItems();
      } catch (error) {
        alert("Failed to delete items.");
      }
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const compiledDescription = `Reported by: ${studentForm.name} | Date Lost: ${studentForm.dateLost} | Time: ${studentForm.timeLost}`;
    const payload = {
      item_name: studentForm.itemLost,
      location_found: studentForm.lastSeen,
      description: compiledDescription,
      category: 'OTHER',
      status: 'LOST_REPORTED'
    };

    try {
      await api.post('items/', payload);
      setShowModal(false);
      setStudentForm({ name: '', itemLost: '', lastSeen: '', dateLost: '', timeLost: '' });
      alert("Report submitted successfully! Admins will review it.");
      fetchItems(); 
    } catch (error) {
      alert("Failed to submit the report.");
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const compiledDescription = `Surrendered by: ${adminForm.name} | Holding Office: ${adminForm.currentOffice} | Date: ${adminForm.dateFound} | Time: ${adminForm.timeFound}`;
    const correctStatus = adminForm.currentOffice === 'CSA Office' ? 'AVAILABLE_CSA' : 'AVAILABLE_MAIN';
    
    const payload = {
      item_name: adminForm.itemFound,
      location_found: adminForm.locationFound,
      description: compiledDescription,
      category: 'OTHER',
      status: correctStatus
    };

    try {
      await api.post('items/', payload);
      setShowModal(false);
      setAdminForm({ name: '', itemFound: '', locationFound: '', currentOffice: '', dateFound: '', timeFound: '' });
      alert("Item added successfully. It is now visible on the Lost page.");
      fetchItems(); 
    } catch (error) {
      alert("Failed to log the item.");
    }
  };

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center relative" style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full min-h-screen flex flex-col justify-center pt-24 pb-24 px-4 sm:px-8">
        
        {/* Bulk Delete Toolbar */}
        {isSelectionMode && (
          <div className="absolute top-24 left-0 right-0 flex justify-center z-20 fade-in px-4">
            <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
              <span className="font-bold text-gray-700">{selectedIds.length} Selected</span>
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-sm sm:text-base">
                DELETE SELECTED
              </button>
              <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 text-sm sm:text-base">
                CANCEL
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-white text-xl py-10 font-bold drop-shadow-md">Loading items...</div>
        ) : (
          <div className="w-full max-w-7xl mx-auto">
            {items.length === 0 ? (
              <div className="text-center text-white text-lg py-6 px-12 font-medium bg-black/60 mx-auto rounded-2xl backdrop-blur-md w-fit shadow-2xl border border-white/10">
                No items have been retrieved yet.
              </div>
            ) : (
              // THE FIX: Changed from flex overflow-x-auto to responsive Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleCardClick(item)}
                    className={`bg-white rounded-[2rem] shadow-2xl overflow-hidden opacity-90 grayscale-[10%] transform transition-all w-full
                      ${role === 'ADMIN' && isSelectionMode ? 'cursor-pointer hover:scale-105 hover:shadow-[0_10px_40px_rgba(175,0,0,0.3)]' : ''}
                      ${selectedIds.includes(item.id) ? 'ring-4 ring-[#AF0000] scale-105 grayscale-0 opacity-100' : ''}`} 
                    style={{ minHeight: '180px' }}
                  >
                    <div className="p-6 text-sm text-gray-900 font-medium space-y-2 flex flex-col h-full justify-center">
                      <p className="text-green-600 font-black tracking-widest uppercase text-lg mb-2">RETRIEVED</p>
                      <p className="text-lg font-bold">{item.item_name}</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Date logged: {formatDate(item.date_logged)}</p>
                        <p>Location: {item.location_found}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      {role && !showModal && !isSelectionMode && (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
          {role === 'ADMIN' && (
            <button 
              onClick={() => setIsSelectionMode(true)} 
              className="p-4 bg-[#AF0000] text-white rounded-full shadow-lg hover:bg-[#8A0000] hover:scale-110 transition-all flex items-center justify-center"
              title="Select Multiple Items to Delete"
            >
              <MdDeleteOutline size={28} />
            </button>
          )}
          <button 
            onClick={() => setShowModal(true)} 
            className="p-4 bg-[#AF0000] text-white rounded-full shadow-lg hover:bg-[#8A0000] hover:scale-110 transition-all flex items-center justify-center"
            title="Add Item"
          >
            <MdAdd size={32} />
          </button>
        </div>
      )}

      {/* SMART MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl mx-4 transform transition-all">
            <button onClick={() => setShowModal(false)} className="absolute top-6 left-6 text-black hover:text-gray-600 transition-colors">
              <MdArrowBack size={28} />
            </button>
            <div className="h-8"></div>

            {role === 'ADMIN' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Name (Finder)</label>
                  <input type="text" required value={adminForm.name} onChange={(e) => setAdminForm({...adminForm, name: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Item Found</label>
                  <input type="text" required value={adminForm.itemFound} onChange={(e) => setAdminForm({...adminForm, itemFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Where did you find it?</label>
                  <input type="text" required value={adminForm.locationFound} onChange={(e) => setAdminForm({...adminForm, locationFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Current Holding Office</label>
                  <select required value={adminForm.currentOffice} onChange={(e) => setAdminForm({...adminForm, currentOffice: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors bg-white cursor-pointer">
                    <option value="" disabled>Select holding office...</option>
                    <option value="CSA Office">CSA Office</option>
                    <option value="Main Security Office">Main Security Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Date found</label>
                  <input type="date" required value={adminForm.dateFound} onChange={(e) => setAdminForm({...adminForm, dateFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Estimated Time you found it</label>
                  <input type="time" required value={adminForm.timeFound} onChange={(e) => setAdminForm({...adminForm, timeFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div className="pt-4 flex justify-center">
                  <button type="submit" className="px-10 py-3 bg-[#AF0000] text-white font-bold text-xl rounded-2xl shadow-md hover:shadow-lg hover:bg-[#8A0000] transition-all">TURN IN</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Name</label>
                  <input type="text" required value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Item Lost</label>
                  <input type="text" required value={studentForm.itemLost} onChange={(e) => setStudentForm({...studentForm, itemLost: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Item last seen (Give more details)</label>
                  <input type="text" required value={studentForm.lastSeen} onChange={(e) => setStudentForm({...studentForm, lastSeen: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Date lost</label>
                  <input type="date" required value={studentForm.dateLost} onChange={(e) => setStudentForm({...studentForm, dateLost: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Estimated Time you lost it</label>
                  <input type="time" required value={studentForm.timeLost} onChange={(e) => setStudentForm({...studentForm, timeLost: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] focus:border-[#AF0000] transition-colors" />
                </div>
                <div className="pt-4 flex justify-center">
                  <button type="submit" className="px-10 py-3 bg-[#AF0000] text-white font-bold text-xl rounded-2xl shadow-md hover:shadow-lg hover:bg-[#8A0000] transition-all">SUBMIT REPORT</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}