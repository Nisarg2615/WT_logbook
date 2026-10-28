import { useState, useEffect } from 'react';
import { Menu, Bell, CheckCircle2, LogOut, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openAlerts, setOpenAlerts] = useState<any[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Breadcrumb logic
  const pathName = location.pathname.split('/')[1] || 'dashboard';
  const pageTitle = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  const fetchAlertsCount = async () => {
    try {
      const res = await apiClient.get('/alerts?status=Open');
      setOpenAlerts(res.data);
    } catch (err) {
      // silently handle
    }
  };

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 z-10 relative">
      <div className="flex items-center">
        <button
          type="button"
          className="text-secondary hover:text-primary focus:outline-none mr-4 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center text-sm">
          <span className="text-muted-foreground hidden sm:inline-block">eLogBook</span>
          <span className="text-muted-foreground mx-2 hidden sm:inline-block">/</span>
          <span className="font-semibold text-primary">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        <div className="hidden md:flex items-center text-xs font-semibold uppercase tracking-wider text-secondary">
          <span>Pune Operations Facility • Unit 1</span>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden sm:flex items-center text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Live Synced
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="text-secondary hover:text-primary relative p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            title="Active Plant Alerts"
          >
            <Bell className="h-5 w-5" />
            {openAlerts.length > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-critical"></span>
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-border py-2 z-50">
              <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-primary">
                  Active Alerts ({openAlerts.length})
                </span>
                <span className="text-[10px] text-secondary">Live System Feed</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
                {openAlerts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-secondary">
                    <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                    All equipment running nominally.
                  </div>
                ) : (
                  openAlerts.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setShowNotificationMenu(false);
                        navigate('/alerts');
                      }}
                      className="p-3 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${a.severity === 'Critical' ? 'text-critical' : 'text-warning'}`} />
                        <span className="font-bold text-xs text-primary">{a.equipment?.equipment_id}</span>
                        <span className="text-[10px] text-secondary ml-auto">{new Date(a.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-secondary truncate">
                        {a.parameter} exceeded {a.severity.toLowerCase()} limit ({a.reading} / {a.threshold})
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-border bg-muted/20 text-center">
                <button
                  onClick={() => {
                    setShowNotificationMenu(false);
                    navigate('/alerts');
                  }}
                  className="text-xs text-accent font-semibold flex items-center justify-center w-full hover:underline"
                >
                  View All Active Alerts <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <button
          onClick={handleLogout}
          className="flex items-center text-xs font-medium text-secondary hover:text-critical transition-colors py-1.5 px-2 rounded-md hover:bg-critical/5"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
