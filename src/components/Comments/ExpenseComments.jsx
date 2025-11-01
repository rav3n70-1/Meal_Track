// Expense Comments Component
import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/displayName';
import Button from '../ui/Button';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ExpenseComments = ({ expenseId }) => {
  const { household, members } = useHousehold();
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Load comments
  useEffect(() => {
    if (!household || !expenseId) return;

    const commentsRef = collection(db, 'households', household.id, 'expenses', expenseId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [household, expenseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const commentsRef = collection(db, 'households', household.id, 'expenses', expenseId, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        createdAt: new Date().toISOString()
      });

      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const commentRef = doc(db, 'households', household.id, 'expenses', expenseId, 'comments', commentId);
      await deleteDoc(commentRef);
      toast.success('Comment deleted!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const getMemberByUid = (uid) => {
    return members.find(m => m.uid === uid);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={20} />
        <h3 className="font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {comments.map((comment) => {
            const member = getMemberByUid(comment.userId);
            const isOwn = comment.userId === currentUser.uid;

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-3 p-3 rounded-lg ${isOwn ? 'bg-primary/10' : 'bg-accent'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.userPhoto ? (
                    <img
                      src={comment.userPhoto}
                      alt={comment.userName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User size={20} />
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {getDisplayName(member) || comment.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                    {comment.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <Button
          type="submit"
          disabled={loading || !newComment.trim()}
          icon={<Send size={16} />}
          size="sm"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default ExpenseComments;

