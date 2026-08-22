import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  Calendar,
  FileText,
  Receipt,
  UserPlus,
  UserMinus,
  Activity as ActivityIcon
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useActivity } from '../context/ActivityContext';
import Loading from '../components/ui/Loading';
import { useLanguage } from '../context/LanguageContext';

const Activity = () => {
  const { activities, loading } = useActivity();
  const { t } = useLanguage();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading timeline..." />
        </div>
      </Layout>
    );
  }

  // Get icon and color based on activity type
  const getActivityStyling = (type) => {
    switch (type) {
      case 'expense_added':
        return { icon: Plus, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'expense_approved':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'expense_rejected':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'member_joined':
        return { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'member_left':
        return { icon: UserMinus, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'debt_settled':
        return { icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      default:
        return { icon: ActivityIcon, color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ActivityIcon className="text-primary" size={28} />
            Household Timeline
          </h1>
          <p className="text-muted-foreground">
            Audit trail of all recent activities in the household
          </p>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="mx-auto mb-4 text-muted-foreground/50" size={48} />
                <p className="text-muted-foreground text-lg">No activity recorded yet</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Activities like adding expenses or approving them will appear here.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-border ml-4 sm:ml-6 space-y-8 py-4">
                <AnimatePresence>
                  {activities.map((activity, index) => {
                    const { icon: Icon, color, bg } = getActivityStyling(activity.type);
                    
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-6 sm:pl-8"
                      >
                        {/* Timeline Node */}
                        <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 border-background ${bg} flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
                        </div>

                        {/* Content Card */}
                        <div className="bg-accent/50 hover:bg-accent transition-colors border border-border rounded-xl p-4 shadow-sm group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`mt-0.5 p-2 rounded-lg ${bg} ${color}`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base font-medium text-foreground leading-snug">
                                  {activity.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {format(new Date(activity.timestamp), 'MMM dd, yyyy - hh:mm a')}
                                  </span>
                                  <span>•</span>
                                  <span className="font-medium">by {activity.actorName}</span>
                                </div>
                                
                                {/* Metadata Badges */}
                                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {activity.metadata.totalAmount && (
                                      <Badge variant="outline" className="bg-background">
                                        Amount: ৳{parseFloat(activity.metadata.totalAmount).toFixed(2)}
                                      </Badge>
                                    )}
                                    {activity.metadata.itemCount && (
                                      <Badge variant="outline" className="bg-background">
                                        {activity.metadata.itemCount} items
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Activity;
