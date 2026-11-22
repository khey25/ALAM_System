import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MdAdd, MdArrowBack, MdDeleteOutline } from 'react-icons/md';

export default function LostItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem('role'); 

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionItem, setActionItem] = useState(null); 
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Bulk Delete States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Forms
  const [studentForm, setStudentForm] = useState({ name: '', itemLost: '', lastSeen: '', dateLost: '', timeLost: '' });
  const [adminForm, setAdminForm] = useState({ name: '', itemFound: '', locationFound: '', currentOffice: '', dateFound: '', timeFound: '' });
  const [claimForm, setClaimForm] = useState({ name: '', email: '', date: '', time: '', location: '' });

  const fetchItems = async () => {
    try {
      const response = await api.get('items/?public=true');
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

  // --- CARD CLICK LOGIC ---
  const handleCardClick = (item) => {
    if (role !== 'ADMIN') return;

    if (isSelectionMode) {
      if (selectedIds.includes(item.id)) {
        setSelectedIds(selectedIds.filter(id => id !== item.id));
      } else {
        setSelectedIds([...selectedIds, item.id]);
      }
      return;
    }

    if (item.status === 'CLAIMED') return; 
    setActionItem(item);
  };

  // --- SINGLE DELETE ---
  const handleSingleDelete = async () => {
    if (!actionItem) return;
    try {
      await api.delete(`items/${actionItem.id}/`);
      setActionItem(null);
      fetchItems();
    } catch (error) {
      alert("Failed to delete item.");
    }
  };

  // --- BULK DELETE ---
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
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

  // --- SUBMIT CLAIM ---
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`items/${actionItem.id}/`, {
        status: 'CLAIMED',
        claimed_by_name: claimForm.name,
        claimed_by_email: claimForm.email,
        claimed_date: claimForm.date,
        claimed_time: claimForm.time,
        claimed_location: claimForm.location
      });
      setShowClaimModal(false);
      setActionItem(null);
      setClaimForm({ name: '', email: '', date: '', time: '', location: '' });
      fetchItems();
    } catch (error) {
      alert("Failed to process claim.");
    }
  };

  // --- ORIGINAL ADD LOGIC ---
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
      setShowAddModal(false);
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
      setShowAddModal(false);
      setAdminForm({ name: '', itemFound: '', locationFound: '', currentOffice: '', dateFound: '', timeFound: '' });
      fetchItems(); 
    } catch (error) {
      alert("Failed to log the item.");
    }
  };

  return (
    <div className="min-h-screen bg-fixed bg-cover bg-center relative" style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

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
                No LOST items are currently reported.
              </div>
            ) : (
              // THE FIX: Changed from flex overflow-x-auto to responsive Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleCardClick(item)}
                    className={`bg-white rounded-[2rem] shadow-2xl overflow-hidden transform transition-all w-full
                      ${role === 'ADMIN' && item.status !== 'CLAIMED' ? 'cursor-pointer hover:scale-105 hover:shadow-[0_10px_40px_rgba(175,0,0,0.3)]' : ''} 
                      ${selectedIds.includes(item.id) ? 'ring-4 ring-[#AF0000] scale-105' : ''}
                      ${item.status === 'CLAIMED' ? 'opacity-80 grayscale-[20%]' : ''}`}
                    style={{ minHeight: '180px' }}
                  >
                    <div className="p-6 text-sm text-gray-900 font-medium space-y-2 flex flex-col h-full justify-center">
                      {item.status === 'CLAIMED' ? (
                         <p className="text-green-600 font-black tracking-widest uppercase text-lg mb-2">RETRIEVED</p>
                      ) : (
                         <p className="text-[#AF0000] font-bold">
                           Status: {item.status === 'AVAILABLE_CSA' ? 'Available at CSA' : 'Available at Main Security'}
                         </p>
                      )}
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
      {role && !showAddModal && !actionItem && !isSelectionMode && (
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
            onClick={() => setShowAddModal(true)} 
            className="p-4 bg-[#AF0000] text-white rounded-full shadow-lg hover:bg-[#8A0000] hover:scale-110 transition-all flex items-center justify-center"
            title="Add Item"
          >
            <MdAdd size={32} />
          </button>
        </div>
      )}

      {/* ACTION MODAL: To Be Claimed vs Remove */}
      {actionItem && !showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center relative shadow-2xl mx-4">
            <h2 className="text-xl font-bold text-black mb-6">Manage Item</h2>
            <p className="text-gray-600 mb-8 font-medium">{actionItem.item_name}</p>
            
            <div className="flex flex-col gap-4">
              <button onClick={() => { setShowClaimModal(true); }} className="w-full py-3 bg-green-700 text-white font-bold rounded-2xl hover:bg-green-800 transition-colors">
                TO BE CLAIMED
              </button>
              <button onClick={handleSingleDelete} className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors">
                REMOVE
              </button>
              <button onClick={() => setActionItem(null)} className="w-full py-3 bg-gray-200 text-gray-800 font-bold rounded-2xl hover:bg-gray-300 transition-colors mt-2">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLAIM RECEIPT MODAL */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity overflow-y-auto pt-10 pb-10">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl my-auto mx-4">
            <button onClick={() => { setShowClaimModal(false); setActionItem(null); }} className="absolute top-6 left-6 text-black hover:text-gray-600 transition-colors">
              <MdArrowBack size={28} />
            </button>
            
            <h2 className="text-center text-xl font-bold text-green-700 mb-6 mt-2">CLAIM RECEIPT</h2>
            
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-900 mb-1">Claimer Name</label>
                <input type="text" required value={claimForm.name} onChange={(e) => setClaimForm({...claimForm, name: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-900 mb-1">Claimer Email</label>
                <input type="email" required value={claimForm.email} onChange={(e) => setClaimForm({...claimForm, email: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-900 mb-1">Retrieval Office</label>
                <select required value={claimForm.location} onChange={(e) => setClaimForm({...claimForm, location: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 bg-white">
                  <option value="" disabled>Select office...</option>
                  <option value="CSA Office">CSA Office</option>
                  <option value="Main Security Office">Main Security Office</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm text-gray-900 mb-1">Date</label>
                  <input type="date" required value={claimForm.date} onChange={(e) => setClaimForm({...claimForm, date: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm text-gray-900 mb-1">Time</label>
                  <input type="time" required value={claimForm.time} onChange={(e) => setClaimForm({...claimForm, time: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700" />
                </div>
              </div>
              <div className="pt-4 flex justify-center">
                <button type="submit" className="px-10 py-3 bg-green-700 text-white font-bold text-lg rounded-2xl hover:bg-green-800 transition-all">FINALIZE CLAIM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDARD ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl mx-4">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 left-6 text-black hover:text-gray-600 transition-colors">
              <MdArrowBack size={28} />
            </button>
            <div className="h-8"></div>

            {role === 'ADMIN' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Name (Finder)</label>
                  <input type="text" required value={adminForm.name} onChange={(e) => setAdminForm({...adminForm, name: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Item Found</label>
                  <input type="text" required value={adminForm.itemFound} onChange={(e) => setAdminForm({...adminForm, itemFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Where did you find it?</label>
                  <input type="text" required value={adminForm.locationFound} onChange={(e) => setAdminForm({...adminForm, locationFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Current Holding Office</label>
                  <select required value={adminForm.currentOffice} onChange={(e) => setAdminForm({...adminForm, currentOffice: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000] bg-white">
                    <option value="" disabled>Select office...</option>
                    <option value="CSA Office">CSA Office</option>
                    <option value="Main Security Office">Main Security Office</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm text-gray-900 mb-1">Date</label>
                    <input type="date" required value={adminForm.dateFound} onChange={(e) => setAdminForm({...adminForm, dateFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm text-gray-900 mb-1">Time</label>
                    <input type="time" required value={adminForm.timeFound} onChange={(e) => setAdminForm({...adminForm, timeFound: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                  </div>
                </div>
                <div className="pt-4 flex justify-center">
                  <button type="submit" className="px-10 py-3 bg-[#AF0000] text-white font-bold text-xl rounded-2xl hover:bg-[#8A0000] transition-all">TURN IN</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Name</label>
                  <input type="text" required value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Item Lost</label>
                  <input type="text" required value={studentForm.itemLost} onChange={(e) => setStudentForm({...studentForm, itemLost: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-900 mb-1">Last Seen</label>
                  <input type="text" required value={studentForm.lastSeen} onChange={(e) => setStudentForm({...studentForm, lastSeen: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm text-gray-900 mb-1">Date lost</label>
                    <input type="date" required value={studentForm.dateLost} onChange={(e) => setStudentForm({...studentForm, dateLost: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm text-gray-900 mb-1">Time lost</label>
                    <input type="time" required value={studentForm.timeLost} onChange={(e) => setStudentForm({...studentForm, timeLost: e.target.value})} className="w-full border border-black rounded px-3 py-2 outline-none focus:ring-1 focus:ring-[#AF0000]" />
                  </div>
                </div>
                <div className="pt-4 flex justify-center">
                  <button type="submit" className="px-10 py-3 bg-[#AF0000] text-white font-bold text-xl rounded-2xl hover:bg-[#8A0000] transition-all">SUBMIT REPORT</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}