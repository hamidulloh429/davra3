import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNavigation from '../components/BottomNavigation';
import UsernameSetupModal from '../components/UsernameSetupModal';
import MaintenancePage from '../components/MaintenancePage';
import './MainLayout.css';

export default function MainLayout() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('maintenance_mode')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data?.maintenance_mode) {
          setMaintenanceMode(true);
        }
      })
      .catch(() => {});
  }, []);

  if (maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <div className="main-layout">
      <Navbar />

      <main className="main-content">
        <Outlet />
      </main>

      <UsernameSetupModal />
      <Footer />
      <BottomNavigation />
    </div>
  );
}
