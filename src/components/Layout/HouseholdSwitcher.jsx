import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChevronDown, Plus, LogIn, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HouseholdSwitcher = () => {
  const { userHouseholds, userProfile, switchHousehold } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userProfile) {
    return null; // Don't show if not logged in
  }

  // Fallback to active household if collection group query is still loading/failing
  const fallbackActive = userProfile.householdId ? {
    householdId: userProfile.householdId,
    householdName: 'My Household',
    role: 'member'
  } : null;

  const activeHousehold = userHouseholds.find(h => h.householdId === userProfile.householdId) || fallbackActive;
  const otherHouseholds = userHouseholds.filter(h => h.householdId !== userProfile.householdId);

  // If no active household and no fallback, hide button
  if (!activeHousehold) {
    return null;
  }

  const handleSwitch = (householdId) => {
    switchHousehold(householdId);
    setIsOpen(false);
  };

  const handleCreateOrJoin = () => {
    navigate('/setup?action=new');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 hover:bg-accent rounded-lg transition-colors border border-border"
      >
        <Home size={16} className="text-primary" />
        <span className="text-sm font-medium hidden sm:inline max-w-[120px] truncate">
          {activeHousehold ? activeHousehold.householdName : 'Select Household'}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 origin-top-left"
          >
            <div className="p-2 border-b border-border/50 bg-accent/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Your Households
              </p>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto py-1">
              {/* Active Household */}
              {activeHousehold && (
                <div className="px-2 py-1.5 flex items-center justify-between text-sm text-primary font-medium bg-primary/5">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="truncate">{activeHousehold.householdName}</span>
                  </div>
                  <Check size={14} className="flex-shrink-0 ml-2" />
                </div>
              )}

              {/* Other Households */}
              {otherHouseholds.map(household => (
                <button
                  key={household.householdId}
                  onClick={() => handleSwitch(household.householdId)}
                  className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-accent transition-colors text-left"
                >
                  <span className="truncate text-foreground/80">{household.householdName}</span>
                  {household.role === 'manager' && (
                    <span className="text-[10px] uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                      Mgr
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-border bg-accent/30">
              <button
                onClick={handleCreateOrJoin}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
              >
                <Plus size={16} />
                Join or Create New
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HouseholdSwitcher;
