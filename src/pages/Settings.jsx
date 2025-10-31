// Settings page for household and user preferences
import React from 'react';
import { Settings as SettingsIcon, Home, Users, Bell, Info } from 'lucide-react';
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

        {/* PWA Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info size={24} />
              Progressive Web App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This app can be installed on your device for a native app experience.
            </p>
            <div className="p-4 bg-accent rounded-lg space-y-2 text-sm">
              <p className="font-semibold">On Mobile:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Tap the share button in your browser</li>
                <li>Select "Add to Home Screen"</li>
                <li>The app will appear on your home screen</li>
              </ul>
            </div>
            <div className="p-4 bg-accent rounded-lg space-y-2 text-sm">
              <p className="font-semibold">On Desktop:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Look for the install icon in your browser's address bar</li>
                <li>Click it to install the app</li>
                <li>The app will open in its own window</li>
              </ul>
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

