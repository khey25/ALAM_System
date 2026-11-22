import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { MdArrowBack, MdHistory } from 'react-icons/md';

export default function History() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('items/activity-history/');
        setLogs(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load history:", error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTimestamp = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const getBadgeStyle = (actionType) => {
    switch(actionType) {
      case 'ADD_ITEM': return 'bg-green-100 text-green-800 border-green-200';
      case 'DELETE_ITEM': return 'bg-red-100 text-red-800 border-red-200';
      case 'BULK_DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'SUBMIT_TICKET': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUBMIT_REPORT': return 'bg-purple-100 text-purple-800 border-purple-200'; // Student Report Badge
      case 'EDIT_PROFILE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFriendlyActionName = (actionType) => {
    return actionType.replace('_', ' ');
  };

  return (
    <div 
      className="min-h-screen bg-fixed bg-cover bg-center relative flex justify-center items-start pt-24 pb-10 px-4 sm:px-8"
      style={{ backgroundImage: "url('https://github.com/khey25/ALAM_System/blob/main/images/alamsystem_bg.jpg?raw=true')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/account')}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
            >
              <MdArrowBack size={24} />
            </button>
            <div className="flex items-center gap-2 text-xl font-extrabold text-black tracking-wide">
              <MdHistory size={28} className="text-[#AF0000]" />
              <h2>ACCOUNT HISTORY</h2>
            </div>
          </div>
        </div>

        {/* Scrollable Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white">
          {loading ? (
            <div className="text-center font-bold text-gray-400 py-10">Loading timeline...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-20 flex flex-col items-center">
              <MdHistory size={64} className="text-gray-300 mb-4" />
              <p className="font-medium text-lg">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              
              {logs.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Timeline Node */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-[#AF0000] text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl shadow border border-gray-100 bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${getBadgeStyle(log.action_type)}`}>
                        {getFriendlyActionName(log.action_type)}
                      </span>
                      <time className="text-xs font-medium text-gray-400">{formatTimestamp(log.timestamp)}</time>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 font-medium leading-relaxed">{log.description}</p>
                  </div>

                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}