// Members page showing all household members
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Mail, Crown, Edit, Trash2, UserPlus } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import MemberManagementModal from '../components/Members/MemberManagementModal';
import Modal from '../components/ui/Modal';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayName, getFullName } from '../utils/displayName';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const Members = () => {
  const { currentUser } = useAuth();
  const { household, members, loading, getUserRole, updateMember, removeMember } = useHousehold();
  const role = getUserRole();
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleCopyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleSaveMember = async (updates) => {
    try {
      await updateMember(selectedMember.uid, updates);
      toast.success('Member updated successfully!');
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveMember = (member) => {
    setSelectedMember(member);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveMember = async () => {
    try {
      await removeMember(selectedMember.uid);
      toast.success('Member removed successfully!');
      setShowRemoveConfirm(false);
      setSelectedMember(null);
    } catch (error) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading members..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">
            Manage household members and invite new ones
          </p>
        </div>

        {/* Invite Code Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={24} />
              Invite Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this code with others to invite them to your household
                </p>
                <div className="text-3xl font-bold text-primary tracking-wider">
                  {household?.inviteCode || 'N/A'}
                </div>
              </div>
              <Button
                onClick={handleCopyInviteCode}
                variant="outline"
                icon={copied ? <Check size={18} /> : <Copy size={18} />}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Household Members ({members.length}/10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member, index) => (
                <motion.div
                  key={member.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-12 h-12 rounded-full border-2 border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                        {member.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {getDisplayName(member)}
                            {member.role === 'manager' && (
                              <Crown className="text-yellow-500" size={16} />
                            )}
                            {member.uid === currentUser?.uid && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </h3>
                          {member.nickname && (
                            <p className="text-xs text-muted-foreground">
                              Full name: {getFullName(member)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Mail size={14} />
                        {member.email}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge and Actions */}
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={member.role === 'manager' ? 'success' : 'default'}
                    >
                      {member.role}
                    </Badge>

                    {/* Manager Controls */}
                    {role === 'manager' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit size={16} />}
                          onClick={() => handleEditMember(member)}
                        >
                          Edit
                        </Button>
                        {member.uid !== currentUser?.uid && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleRemoveMember(member)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {members.length < 10 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  You can add {10 - members.length} more member(s) to your household
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Member Modal */}
      <MemberManagementModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onSave={handleSaveMember}
      />

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setSelectedMember(null);
        }}
        title="Remove Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to remove <strong>{selectedMember?.name}</strong> from the household?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              icon={<Trash2 size={18} />}
              onClick={confirmRemoveMember}
              className="flex-1"
            >
              Remove Member
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveConfirm(false);
                setSelectedMember(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Members;

