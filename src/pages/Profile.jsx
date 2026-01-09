// User Profile page with balance management
import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Award, TrendingUp, TrendingDown, Edit, Phone } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import NicknameModal from '../components/ui/NicknameModal';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateBalances, getExpenseTotalAmount } from '../utils/calculations';
import { getDisplayName, getFullName } from '../utils/displayName';
import Loading from '../components/ui/Loading';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const Profile = () => {
  const { currentUser, userProfile } = useAuth();
  const { household, members, expenses, debts, loading, getUserRole } = useHousehold();
  const { t } = useLanguage();
  const role = getUserRole();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Get current member data (includes nickname)
  const currentMember = useMemo(() => {
    return members.find(m => m.uid === currentUser?.uid);
  }, [members, currentUser]);

  // Calculate user's balance (including debts)
  const myBalance = useMemo(() => {
    if (!currentUser || !members.length) return null;
    const { memberBalances } = calculateBalances(expenses, members, debts);
    return memberBalances[currentUser.uid] || null;
  }, [currentUser, members, expenses, debts]);

  // Get user's expenses
  const myExpenses = useMemo(() => {
    if (!currentUser) return [];
    return expenses.filter(exp => exp.buyer === currentUser.uid || exp.createdBy === currentUser.uid);
  }, [currentUser, expenses]);

  const myApprovedExpenses = myExpenses.filter(exp => exp.status === 'approved');
  const myPendingExpenses = myExpenses.filter(exp => exp.status === 'pending');

  // Load phone number from member data
  useEffect(() => {
    if (currentMember?.mobileNumber) {
      setPhoneNumber(currentMember.mobileNumber);
    } else {
      setPhoneNumber('');
    }
  }, [currentMember]);

  const handleSavePhoneNumber = async () => {
    if (!household || !currentUser) return;

    // Validate phone number if provided
    if (phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(phoneNumber.trim())) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setSavingPhone(true);
    try {
      const memberRef = doc(db, 'households', household.id, 'members', currentUser.uid);
      await updateDoc(memberRef, {
        mobileNumber: phoneNumber.trim() || null,
        updatedAt: new Date().toISOString()
      });
      setEditingPhone(false);
      toast.success('Phone number updated successfully');
    } catch (error) {
      toast.error('Failed to update phone number');
      console.error(error);
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading profile..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            View your account details and expense summary
          </p>
        </motion.div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={24} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-24 h-24 rounded-full border-4 border-primary shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-semibold shadow-lg">
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <div>
                      {currentMember?.nickname && (
                        <p className="text-sm text-muted-foreground">Nickname:</p>
                      )}
                      <h2 className="text-2xl font-bold">
                        {getDisplayName(currentMember)}
                      </h2>
                      {currentMember?.nickname && (
                        <p className="text-sm text-muted-foreground">
                          Full name: {getFullName(currentMember)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNicknameModal(true)}
                      icon={<Edit size={16} />}
                      className="ml-auto"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Mail size={16} className="text-muted-foreground" />
                    <p className="text-muted-foreground">{currentUser?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Phone size={16} className="text-muted-foreground" />
                    {editingPhone ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+880 1XXX-XXXXXX or 01XXX-XXXXXX"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleSavePhoneNumber}
                          disabled={savingPhone}
                        >
                          {savingPhone ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPhone(false);
                            setPhoneNumber(currentMember?.mobileNumber || '');
                          }}
                          disabled={savingPhone}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <p className="text-muted-foreground">
                          {currentMember?.mobileNumber || 'No phone number'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPhone(true)}
                          icon={<Edit size={14} />}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Badge variant={role === 'manager' ? 'success' : 'default'} className="text-sm">
                    <Award size={14} className="mr-1" />
                    {role === 'manager' ? 'Manager' : 'Member'}
                  </Badge>
                  {household && (
                    <Badge variant="outline" className="text-sm">
                      <User size={14} className="mr-1" />
                      {household.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Summary */}
        {myBalance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Paid */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        ৳{myBalance.totalPaid.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {myBalance.expenseCount} expense(s)
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Share */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Share</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        ৳{myBalance.totalShare.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on shared expenses
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                      <span className="text-2xl">৳</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Net Balance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`bg-gradient-to-br ${
                myBalance.balance >= 0 
                  ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                  : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
                      <p className={`text-3xl font-bold ${
                        myBalance.balance >= 0 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {myBalance.balance >= 0 ? '+' : ''}৳{myBalance.balance.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {myBalance.balance >= 0 ? 'Others owe you' : 'You owe others'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      myBalance.balance >= 0 
                        ? 'bg-green-100 dark:bg-green-900/50'
                        : 'bg-red-100 dark:bg-red-900/50'
                    }`}>
                      {myBalance.balance >= 0 ? (
                        <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                      ) : (
                        <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approved Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Your Approved Expenses</CardTitle>
              <CardDescription>
                Expenses you've submitted that were approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myApprovedExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No approved expenses yet
                </p>
              ) : (
                <div className="space-y-3">
                  {myApprovedExpenses.slice(0, 5).map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-accent rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{expense.item || (expense.items && expense.items.length > 0 ? expense.items.map(i => i.name).join(', ') : 'Expense')}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                        </p>
                      </div>
                      <p className="font-bold text-primary">৳{getExpenseTotalAmount(expense).toFixed(2)}</p>
                    </motion.div>
                  ))}
                  {myApprovedExpenses.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {myApprovedExpenses.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Your Pending Expenses</CardTitle>
              <CardDescription>
                Waiting for manager approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myPendingExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending expenses
                </p>
              ) : (
                <div className="space-y-3">
                  {myPendingExpenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div>
                        <p className="font-medium">{expense.item || (expense.items && expense.items.length > 0 ? expense.items.map(i => i.name).join(', ') : 'Expense')}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">
                          ৳{getExpenseTotalAmount(expense).toFixed(2)}
                        </p>
                        <Badge variant="warning" className="text-xs mt-1">Pending</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nickname Modal */}
        <NicknameModal
          isOpen={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
          currentUser={currentUser}
          userProfile={userProfile}
          household={household}
          onSuccess={() => window.location.reload()}
        />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => window.location.href = '/expenses'}>
                View All Expenses
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/reports'}>
                View Reports
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/members'}>
                View Members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;

