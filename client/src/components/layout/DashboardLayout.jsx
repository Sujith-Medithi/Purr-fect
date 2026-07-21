import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopNav from './TopNav.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const backgroundStyle = user?.dashboardBackground
    ? {
        backgroundImage: `linear-gradient(rgba(15, 15, 26, 0.85), rgba(15, 15, 26, 0.90)), url(${user.dashboardBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {};

  const wallpaperClass = user?.dashboardBackground ? 'has-wallpaper' : '';

  return (
    <div 
      className={`flex h-screen overflow-hidden bg-[#0F0F1A] p-2.5 sm:p-4 lg:p-5 gap-2.5 sm:gap-4 lg:gap-5 transition-all duration-500 ${wallpaperClass}`} 
      style={backgroundStyle}
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Floating Main Content Panel Frame with Surrounding Gap */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#14142B]/30 shadow-2xl backdrop-blur-md min-w-0">
        <TopNav onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        {/* Reusable Dashboard Content Container */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-6 bg-transparent">
          <div key={window.location.pathname} className="w-full max-w-[1440px] animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
