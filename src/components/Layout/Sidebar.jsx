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
  Target,
  Repeat,
  PiggyBank,
  Package,
  Calendar,
  BarChart3
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

  const navigationItems = [
    { path: '/dashboard', label: t('dashboard'), icon: Home, category: 'main' },
    { path: '/profile', label: 'My Profile', icon: UserCircle, category: 'main' },
    { path: '/personal-expenses', label: 'Personal Expenses', icon: Wallet, category: 'main' },
    { path: '/expenses', label: t('expenses'), icon: Receipt, category: 'expenses' },
    { path: '/recurring', label: 'Recurring', icon: Repeat, category: 'expenses' },
    { path: '/debts', label: 'Debts', icon: DollarSign, category: 'expenses' },
    { path: '/budget', label: 'Budget', icon: Target, category: 'planning' },
    { path: '/savings', label: 'Savings Goals', icon: PiggyBank, category: 'planning' },
    { path: '/inventory', label: 'Inventory', icon: Package, category: 'planning' },
    { path: '/calendar', label: 'Calendar', icon: Calendar, category: 'insights' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, category: 'insights' },
    { path: '/reports', label: t('reports'), icon: TrendingUp, category: 'insights' },
    { path: '/members', label: t('members'), icon: Users, category: 'household' },
    { path: '/activity', label: t('activity'), icon: FileText, category: 'household' },
    { path: '/settings', label: t('settings'), icon: Settings, category: 'household' },
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

          {/* Group navigation items by category */}
          {['main', 'expenses', 'planning', 'insights', 'household'].map((category) => {
            const categoryItems = navigationItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            const categoryLabels = {
              main: 'Overview',
              expenses: 'Expenses',
              planning: 'Planning',
              insights: 'Insights',
              household: 'Household'
            };

            return (
              <div key={category} className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">
                  {categoryLabels[category]}
                </p>
                {categoryItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-accent text-foreground'
                      }`}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;

