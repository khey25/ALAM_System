import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import Support from './pages/Support'; 
import Reports from './pages/Reports'; 
import Account from './pages/Account'; 
import History from './pages/History'; // <-- ADDED THIS IMPORT

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        
        {/* Core Pages */}
        <Route path="/lost" element={<LostItems />} />
        <Route path="/found" element={<FoundItems />} />
        
        {/* Admin & Account Pages */}
        <Route path="/support" element={<Support />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/account" element={<Account />} />
        
        {/* THE MISSING LINK: The new Activity Log route */}
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;