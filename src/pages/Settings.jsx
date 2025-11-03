// Settings page for household and user preferences
import React from 'react';
import { Settings as SettingsIcon, Home, Users, Bell, Info, Github, Globe, Linkedin, Facebook, Instagram, ExternalLink } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useTheme } from '../context/ThemeContext';
import Loading from '../components/ui/Loading';

const Settings = () => {
  const { currentUser } = useAuth();
  const { household, members, getUserRole } = useHousehold();
  const { theme } = useTheme();
  const role = getUserRole();

  if (!household) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading settings..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your household and preferences
          </p>
        </div>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={24} />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-16 h-16 rounded-full border-2 border-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{currentUser?.displayName}</h3>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  Role: {role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home size={24} />
              Household Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Household Name</p>
              <p className="text-lg font-semibold">{household.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invite Code</p>
              <p className="text-lg font-mono font-semibold text-primary">
                {household.inviteCode}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-lg font-semibold">{members.length} / 10</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-lg font-semibold">
                {new Date(household.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon size={24} />
              Appearance
            </CardTitle>
            <CardDescription>
              Your theme preference is currently set to {theme} mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the theme toggle in the navigation bar to switch between light and dark modes
            </p>
          </CardContent>
        </Card>

        {/* Developer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info size={24} />
              Developer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-lg font-semibold">Hey, I'm Mehedi Hasan Rohan</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I'm a CSE student at Daffodil International University. I built this project out of curiosity and
                a genuine need—managing a student household is tough! Use this app to make your day-to-day easier.
                It's currently focused on the essentials, so please don't try to break it. If you run into any issues
                or have suggestions, feel free to reach out.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/rav3n70-1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                title="GitHub"
              >
                <Github size={18} />
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a
                href="https://ravensportfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                title="Portfolio"
              >
                <Globe size={18} />
                <span className="text-sm font-medium">Portfolio</span>
              </a>
              <a
                href="https://www.linkedin.com/in/mehedi-hasan-rohan-62b5512aa/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                title="LinkedIn"
              >
                <Linkedin size={18} />
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a
                href="https://www.facebook.com/rav3n69"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                title="Facebook"
              >
                <Facebook size={18} />
                <span className="text-sm font-medium">Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/ig_r4v39"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                title="Instagram"
              >
                <Instagram size={18} />
                <span className="text-sm font-medium">Instagram</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* App Version */}
        <Card>
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            Meal Expense Tracker v1.0.0
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;

