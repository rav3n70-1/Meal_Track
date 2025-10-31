// Nickname setup modal component
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import toast from 'react-hot-toast';

const NicknameModal = ({ isOpen, onClose, currentUser, userProfile, household, onSuccess }) => {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    if (nickname.trim().length < 2) {
      toast.error('Nickname must be at least 2 characters');
      return;
    }

    if (nickname.trim().length > 20) {
      toast.error('Nickname must be less than 20 characters');
      return;
    }

    setLoading(true);
    try {
      // Update user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        nickname: nickname.trim()
      });

      // Update member document in household
      if (household?.id) {
        const memberRef = doc(db, 'households', household.id, 'members', currentUser.uid);
        await updateDoc(memberRef, {
          nickname: nickname.trim()
        });
      }

      toast.success('Nickname set successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error setting nickname:', error);
      toast.error('Failed to set nickname');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Set nickname to empty string to indicate user skipped
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <div className="text-center space-y-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center"
        >
          <Sparkles size={40} className="text-primary-foreground" />
        </motion.div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Set Your Nickname</h2>
          <p className="text-muted-foreground">
            Choose a friendly name that others will see in the app
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g., Short single name, Family name"
            icon={<User size={18} />}
            maxLength={20}
          />

          <p className="text-xs text-muted-foreground text-left">
            This nickname will be displayed everywhere in the app. Your full name will only appear in the top right corner.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={loading || !nickname.trim()}
              className="flex-1"
            >
              {loading ? 'Setting...' : 'Set Nickname'}
            </Button>
          </div>
        </form>

        {/* Info */}
        <div className="bg-accent p-4 rounded-lg text-sm text-left">
          <p className="font-semibold mb-2">💡 Why set a nickname?</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Easier for family members to identify you</li>
            <li>• Makes the app feel more personal</li>
            <li>• You can change it anytime in your profile</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default NicknameModal;

