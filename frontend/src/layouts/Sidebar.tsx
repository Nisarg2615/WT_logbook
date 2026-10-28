import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Server, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  CheckSquare, 
  Factory,
  LogOut,
  History,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const navigate = useNavigate();

  // Retrieve user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = user.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user.email ? user.email.slice(0, 2).toUpperCase() : 'OP');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userRole = (user.role || 'operator').toLowerCase();

  // Navigation structure tailored to role
  const getNavigation = () => {
    if (userRole === 'operator') {
      return [
        {
          group: 'OPERATIONS',
          items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'My Logbooks', href: '/logbooks', icon: ClipboardList },
            { name: 'Equipment Fleet', href: '/equipment', icon: Server },
            { name: 'Active Alerts', href: '/alerts', icon: AlertTriangle },
          ],
        },
        {
          group: 'TASKS',
          items: [
            { name: 'Shift Handover', href: '/handovers', icon: ShieldCheck },
          ],
        },
      ];
    }

    if (userRole === 'supervisor') {
      return [
        {
          group: 'SUPERVISION',
          items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Review Queue', href: '/reviews', icon: CheckSquare },
            { name: 'Alerts & Actions', href: '/alerts', icon: AlertTriangle },
            { name: 'Plant Equipment', href: '/equipment', icon: Server },
            { name: 'Logbook Archive', href: '/logbooks', icon: ClipboardList },
          ],
        },
        {
          group: 'COMPLIANCE',
          items: [
            { name: 'Shift Handovers', href: '/handovers', icon: ShieldCheck },
            { name: 'Audit Trail', href: '/audit', icon: History },
            { name: 'Compliance Reports', href: '/compliance', icon: FileText },
          ],
        },
      ];
    }

    // Manager / Admin role
    return [
      {
        group: 'OVERVIEW',
        items: [{ name: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard }],
      },
      {
        group: 'OPERATIONS',
        items: [
          { name: 'Logbook Repository', href: '/logbooks', icon: ClipboardList },
          { name: 'Equipment Fleet', href: '/equipment', icon: Server },
          { name: 'Review & Approvals', href: '/reviews', icon: CheckSquare },
          { name: 'Critical Alerts', href: '/alerts', icon: AlertTriangle },
        ],
      },
      {
        group: 'MANAGEMENT',
        items: [
          { name: 'Plant Analytics', href: '/analytics', icon: BarChart3 },
          { name: 'Shift Handovers', href: '/handovers', icon: ShieldCheck },
          { name: 'Audit Trail', href: '/audit', icon: History },
          { name: 'Compliance Reports', href: '/compliance', icon: FileText },
        ],
      },
    ];
  };

  const navigation = getNavigation();

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-full shadow-xl z-20 flex-shrink-0 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-primary-foreground/10">
        <Factory className="w-8 h-8 text-accent mr-3" />
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">eLogBook</h1>
          <p className="text-[10px] text-primary-foreground/70 tracking-widest uppercase">Industrial Operations</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {navigation.map((group) => (
          <div key={group.group} className="mb-6">
            <h3 className="px-6 text-xs font-semibold text-primary-foreground/50 tracking-wider mb-2">
              {group.group}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center px-6 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent/20 text-accent border-r-2 border-accent'
                          : 'text-primary-foreground/80 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-primary-foreground/10 flex items-center justify-between">
         <div className="flex items-center min-w-0 pr-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
               {userInitials}
            </div>
            <div className="ml-3 truncate">
               <p className="text-sm font-medium truncate">{user.name || user.full_name || 'Logged In User'}</p>
               <p className="text-xs text-primary-foreground/60 capitalize truncate">{user.role || 'Operator'}</p>
            </div>
         </div>
         <button
           onClick={handleLogout}
           title="Sign Out"
           className="p-1.5 rounded-lg text-primary-foreground/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
         >
           <LogOut className="w-4 h-4" />
         </button>
      </div>
    </aside>
  );
}
