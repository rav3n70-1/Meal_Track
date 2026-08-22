import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useActivity } from '../../context/ActivityContext';
import { useHousehold } from '../../context/HouseholdContext';
import toast from 'react-hot-toast';

const NoticeBoard = () => {
  const { notices, addNotice, removeNotice } = useActivity();
  const { getUserRole } = useHousehold();
  const role = getUserRole();
  const isManager = role === 'manager';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      await addNotice(newNotice.title, newNotice.content);
      toast.success('Notice pinned successfully!');
      setIsModalOpen(false);
      setNewNotice({ title: '', content: '' });
    } catch (error) {
      toast.error('Failed to pin notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (noticeId) => {
    if (window.confirm('Are you sure you want to remove this notice?')) {
      try {
        await removeNotice(noticeId);
        toast.success('Notice removed');
      } catch (error) {
        toast.error('Failed to remove notice');
      }
    }
  };

  if (notices.length === 0 && !isManager) {
    return null; // Don't show anything to regular members if there are no notices
  }

  return (
    <>
      <Card className="mb-6 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Pin size={20} className="text-primary" />
            Notice Board
          </CardTitle>
          {isManager && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
              className="bg-background/50 hover:bg-background"
            >
              Pin Notice
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No notices pinned yet.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {notices.map((notice, idx) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 sm:p-4 bg-background/60 backdrop-blur-sm rounded-lg border border-border shadow-sm flex flex-col sm:flex-row justify-between gap-4 group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">
                        {notice.title}
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {notice.content}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground/70 flex items-center gap-2">
                        <span>Pinned by {notice.authorName}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(notice.createdAt), 'MMM dd, yyyy - HH:mm')}
                        </span>
                      </div>
                    </div>
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(notice.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-500/10 self-start mt-[-4px] mr-[-4px]"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Pin New Notice"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Important: Rent is due"
            value={newNotice.title}
            onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
            required
            autoFocus
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Content</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="What do you want to tell the household?"
              rows={4}
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Pinning...' : 'Pin Notice'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default NoticeBoard;
