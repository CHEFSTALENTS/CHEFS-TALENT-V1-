
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Conciergeries from './pages/Conciergeries';
import PrivateClients from './pages/PrivateClients';
import Chefs from './pages/Chefs';
import Request from './pages/Request';
// ApplyChef is deprecated for public use, replaced by Chef Portal
import Insights from './pages/Insights';
import InsightPost from './pages/InsightPost';
import { Legal } from './pages/Legal';

// Admin Portal
import { AdminLayout } from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Requests from './pages/admin/Requests';
import Missions from './pages/admin/Missions';
import AdminChefs from './pages/admin/Chefs';
import Clients from './pages/admin/Clients';

// Chef Portal
import ChefSignup from './pages/ChefSignup';
import ChefLogin from './pages/ChefLogin';
import ChefDashboard from './pages/ChefDashboard';

// Chef Profile Pages
import ChefProfile from './pages/chef/Profile';
import ChefExperience from './pages/chef/Experience';
import ChefPortfolio from './pages/chef/Portfolio';
import ChefAvailability from './pages/chef/Availability';
import ChefCoverage from './pages/chef/Coverage';
import ChefPreferences from './pages/chef/Preferences';
import ChefSettings from './pages/chef/Settings';
import ChefMissions from './pages/chef/Missions';
import ChefEarnings from './pages/chef/Earnings';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes with Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/conciergeries" element={<Layout><Conciergeries /></Layout>} />
        <Route path="/private-clients" element={<Layout><PrivateClients /></Layout>} />
        <Route path="/chefs" element={<Layout><Chefs /></Layout>} /> 
        
        {/* Request Flow */}
        <Route path="/request" element={<Layout><Request /></Layout>} />
        
        {/* Insights */}
        <Route path="/insights" element={<Layout><Insights /></Layout>} />
        <Route path="/insights/:slug" element={<Layout><InsightPost /></Layout>} />
        
        {/* Legal */}
        <Route path="/terms" element={<Layout><Legal /></Layout>} />
        <Route path="/privacy" element={<Layout><Legal /></Layout>} />
        <Route path="/legal" element={<Layout><Legal /></Layout>} />
        
        {/* Admin Portal */}
        <Route path="/admin" element={
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        }>
           <Route path="dashboard" element={<Dashboard />} />
           <Route path="requests" element={<Requests />} />
           <Route path="missions" element={<Missions />} />
           <Route path="chefs" element={<AdminChefs />} />
           <Route path="clients" element={<Clients />} />
        </Route>

        {/* Chef Portal Routes */}
        <Route path="/chef/signup" element={<ChefSignup />} />
        <Route path="/chef/login" element={<ChefLogin />} />
        
        {/* Protected Chef Dashboard */}
        <Route path="/chef/dashboard" element={<ChefDashboard />} />
        <Route path="/chef/profile" element={<ChefProfile />} />
        <Route path="/chef/experience" element={<ChefExperience />} />
        <Route path="/chef/portfolio" element={<ChefPortfolio />} />
        <Route path="/chef/availability" element={<ChefAvailability />} />
        <Route path="/chef/coverage" element={<ChefCoverage />} />
        <Route path="/chef/preferences" element={<ChefPreferences />} />
        <Route path="/chef/settings" element={<ChefSettings />} />
        <Route path="/chef/missions" element={<ChefMissions />} />
        <Route path="/chef/earnings" element={<ChefEarnings />} />
      </Routes>
    </Router>
  );
};

export default App;