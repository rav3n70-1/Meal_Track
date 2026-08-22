// Sidebar navigation component
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Receipt, 
  Users, 
  Settings, 
  TrendingUp,
  FileText,
  UserCircle,
  DollarSign,
  Wallet,
  Building2,
  ListTodo,
  CalendarDays,
  Package
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHousehold } from '../../context/HouseholdContext';
import { useLanguage } from '../../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserRole } = useHousehold();
  const { t } = useLanguage();
  const role = getUserRole();

  // Track if we're on mobile/tablet for responsive sidebar
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navigationGroups = [
    {
      label: 'Main',
      items: [
        { path: '/dashboard', label: t('dashboard'), icon: Home }
      ]
    },
    {
      label: 'Household Operations',
      items: [
        { path: '/shopping-list', label: 'Shopping List', icon: ListTodo },
        { path: '/meal-plan', label: 'Meal Plan', icon: CalendarDays },
        { path: '/pantry', label: 'Pantry / Inventory', icon: Package },
        { path: '/members', label: t('members'), icon: Users }
      ]
    },
    {
      label: 'Finances',
      items: [
        { path: '/expenses', label: t('expenses'), icon: Receipt },
        { path: '/debts', label: 'Debts', icon: DollarSign },
        { path: '/rent-bills', label: 'Rent & Bills', icon: Building2 },
        { path: '/personal-expenses', label: 'Personal Expenses', icon: Wallet }
      ]
    },
    {
      label: 'Other',
      items: [
        { path: '/activity', label: t('activity'), icon: FileText },
        ...(role === 'manager' ? [{ path: '/reports', label: t('reports'), icon: TrendingUp }] : []),
        { path: '/profile', label: 'My Profile', icon: UserCircle },
        { path: '/settings', label: t('settings'), icon: Settings }
      ]
    }
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
          x: isMobile ? (isOpen ? 0 : -280) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border z-40 overflow-y-auto"
      >
        <nav className="p-4 space-y-2">
          {role && (
            <motion.div 
              className="mb-4 p-3 bg-primary/10 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Your Role
              </p>
              <p className="text-sm font-semibold text-primary capitalize">
                {role === 'manager' ? t('manager') : t('member')}
              </p>
            </motion.div>
          )}

          {navigationGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "pt-2 border-t border-border mt-2" : ""}>
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-accent text-foreground'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <Icon size={20} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;

