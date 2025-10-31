// Navigation bar component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, LogOut, Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';

const Navbar = ({ onMenuToggle }) => {
  const { currentUser, signOut } = useAuth();
  const { household } = useHousehold();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMenuToggle) onMenuToggle(!mobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-foreground hover:text-primary transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <span className="text-3xl">৳</span>
              </motion.div>
              <div>
                <h1 className="text-lg font-bold">
                  {language === 'bn' ? 'খাবার ট্র্যাকার' : 'Meal Tracker'}
                </h1>
                {household && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {household.name}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              icon={<Languages size={18} />}
              className="hidden sm:flex"
            >
              <span className="hidden md:inline">
                {language === 'bn' ? 'English' : 'বাংলা'}
              </span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              icon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              className="hidden sm:flex"
            >
              <span className="hidden md:inline">
                {theme === 'light' ? (language === 'bn' ? 'ডার্ক' : 'Dark') : (language === 'bn' ? 'লাইট' : 'Light')}
              </span>
            </Button>

            {/* User Menu */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {currentUser.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium hidden md:inline">
                    {currentUser.displayName}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  icon={<LogOut size={18} />}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <span className="hidden lg:inline">{t('logout')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                icon={<Languages size={18} />}
                className="w-full justify-start"
              >
                {language === 'bn' ? 'English' : 'বাংলা'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                icon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                className="w-full justify-start"
              >
                {theme === 'light' ? (language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode') : (language === 'bn' ? 'লাইট মোড' : 'Light Mode')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

