// Sidebar navigation component
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Receipt, 
  Users, 
  Settings, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHousehold } from '../../context/HouseholdContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserRole } = useHousehold();
  const role = getUserRole();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/members', label: 'Members', icon: Users },
    { path: '/reports', label: 'Reports', icon: TrendingUp },
    { path: '/activity', label: 'Activity Log', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border z-40 overflow-y-auto lg:translate-x-0"
      >
        <nav className="p-4 space-y-2">
          {role && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Your Role
              </p>
              <p className="text-sm font-semibold text-primary capitalize">
                {role}
              </p>
            </div>
          )}

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;

