import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Marker, Label } from './ui';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Briefcase, 
  ChefHat, 
  Users, 
  LogOut, 
  Lock,
  Menu,
  X
} from 'lucide-react';

const ADMIN_PWD = "chef"; // Hardcoded for demo

export const AdminLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('chef_admin_session') === 'true') {
      setIsAuthenticated(true);
      if (location.pathname === '/admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [location.pathname, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PWD) {
      localStorage.setItem('chef_admin_session', 'true');
      setIsAuthenticated(true);
      navigate('/admin/dashboard');
    } else {
      alert("Accès refusé");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chef_admin_session');
    setIsAuthenticated(false);
    navigate('/admin');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <form onSubmit={handleLogin} className="bg-white p-12 max-w-sm w-full space-y-8 border border-stone-200">
          <div className="text-center">
            <Lock className="w-8 h-8 mx-auto text-stone-400 mb-4" strokeWidth={1} />
            <h1 className="font-serif text-2xl text-stone-900">Admin Portal</h1>
            <p className="text-stone-500 text-sm mt-2 font-light">Accès sécurisé réservé.</p>
          </div>
          <Input 
            type="password" 
            placeholder="Mot de passe" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="text-center"
            autoFocus
          />
          <Button type="submit" className="w-full">Entrer</Button>
        </form>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Demandes', path: '/admin/requests', icon: MessageSquare },
    { label: 'Missions', path: '/admin/missions', icon: Briefcase },
    { label: 'Chefs', path: '/admin/chefs', icon: ChefHat },
    { label: 'Clients', path: '/admin/clients', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-stone-900 text-white rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-8 border-b border-stone-100">
            <span className="font-serif text-xl text-stone-900 tracking-tight">CHEF TALENTS</span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 block mt-1">Back-Office</span>
         </div>
         
         <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-stone-300' : 'text-stone-400'}`} />
                  {item.label}
                </Link>
              );
            })}
         </nav>

         <div className="p-4 border-t border-stone-100">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-stone-500 hover:text-red-600 w-full px-4 py-2"
            >
              <LogOut className="w-3 h-3" /> Déconnexion
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen p-8 lg:p-12 overflow-x-hidden">
        <div className="max-w-[100rem] mx-auto">
           <Outlet />
        </div>
      </main>
    </div>
  );
};