// Setup page for creating or joining a household
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Users, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import NicknameModal from '../components/ui/NicknameModal';
import toast from 'react-hot-toast';

const Setup = () => {
  const { currentUser, userProfile } = useAuth();
  const { createHousehold, joinHousehold, household, loading } = useHousehold();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  useEffect(() => {
    // If user already has a household, redirect to dashboard
    if (!loading && userProfile?.householdId) {
      navigate('/dashboard');
    }
  }, [userProfile, loading, navigate]);

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    if (!householdName.trim()) {
      toast.error('Please enter a household name');
      return;
    }

    setSubmitting(true);
    try {
      await createHousehold(householdName);
      toast.success('Household created successfully!');
      // Show nickname modal
      setShowNicknameModal(true);
    } catch (error) {
      toast.error('Failed to create household');
      setSubmitting(false);
    }
  };

  const handleJoinHousehold = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setSubmitting(true);
    try {
      await joinHousehold(inviteCode);
      toast.success('Joined household successfully!');
      // Show nickname modal
      setShowNicknameModal(true);
    } catch (error) {
      toast.error(error.message || 'Failed to join household');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {!mode ? (
          <div className="space-y-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Let's Get Started</h1>
              <p className="text-muted-foreground">
                Create a new household or join an existing one
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  hover 
                  onClick={() => setMode('create')}
                  className="cursor-pointer h-full"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-3">
                      <Home size={24} />
                    </div>
                    <CardTitle>Create Household</CardTitle>
                    <CardDescription>
                      Start a new household and invite members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• You'll be the household manager</li>
                      <li>• Approve expense submissions</li>
                      <li>• Invite up to 10 members</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  hover 
                  onClick={() => setMode('join')}
                  className="cursor-pointer h-full"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-3">
                      <Users size={24} />
                    </div>
                    <CardTitle>Join Household</CardTitle>
                    <CardDescription>
                      Join an existing household with an invite code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Get invite code from manager</li>
                      <li>• Submit expense requests</li>
                      <li>• View household balances</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        ) : mode === 'create' ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Household</CardTitle>
              <CardDescription>
                Choose a name for your household
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHousehold} className="space-y-4">
                <Input
                  label="Household Name"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g., Apartment name"
                  icon={<Home size={18} />}
                  required
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Creating...' : 'Create Household'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Join a Household</CardTitle>
              <CardDescription>
                Enter the invite code provided by the household manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinHousehold} className="space-y-4">
                <Input
                  label="Invite Code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  icon={<Key size={18} />}
                  required
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Joining...' : 'Join Household'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Nickname Setup Modal */}
      <NicknameModal
        isOpen={showNicknameModal}
        onClose={() => {
          setShowNicknameModal(false);
          setSubmitting(false);
          navigate('/dashboard');
        }}
        currentUser={currentUser}
        userProfile={userProfile}
        household={household}
        onSuccess={() => navigate('/dashboard')}
      />
    </div>
  );
};

export default Setup;

