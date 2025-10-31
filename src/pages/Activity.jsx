// Activity log page showing recent actions
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  Calendar,
  FileText
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useHousehold } from '../context/HouseholdContext';
import Loading from '../components/ui/Loading';

const Activity = () => {
  const { expenses, members, loading } = useHousehold();

  // Create member lookup
  const memberLookup = useMemo(() => {
    const lookup = {};
    members.forEach(member => {
      lookup[member.uid] = member;
    });
    return lookup;
  }, [members]);

  // Generate activity log from expenses
  const activities = useMemo(() => {
    const acts = [];

    expenses.forEach(expense => {
      const creator = memberLookup[expense.createdBy];
      
      // Expense created
      acts.push({
        id: `${expense.id}-created`,
        type: 'created',
        expense,
        user: creator,
        timestamp: expense.createdAt,
        icon: Plus,
        color: 'text-blue-500'
      });

      // Expense approved/rejected
      if (expense.status !== 'pending' && expense.approvedAt) {
        const approver = memberLookup[expense.approvedBy];
        acts.push({
          id: `${expense.id}-${expense.status}`,
          type: expense.status,
          expense,
          user: approver,
          timestamp: expense.approvedAt,
          icon: expense.status === 'approved' ? CheckCircle : XCircle,
          color: expense.status === 'approved' ? 'text-green-500' : 'text-red-500'
        });
      }
    });

    // Sort by timestamp descending
    acts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return acts;
  }, [expenses, memberLookup]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading activity..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
          <p className="text-muted-foreground">
            Recent actions and changes in your household
          </p>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-accent rounded-lg"
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-background flex items-center justify-center ${activity.color}`}>
                        <Icon size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">
                              {activity.type === 'created' && (
                                <>
                                  <span className="text-foreground">{activity.user?.name || 'Someone'}</span>
                                  {' added '}
                                  <span className="text-primary">{activity.expense.item}</span>
                                </>
                              )}
                              {activity.type === 'approved' && (
                                <>
                                  <span className="text-foreground">{activity.user?.name || 'Someone'}</span>
                                  {' approved '}
                                  <span className="text-primary">{activity.expense.item}</span>
                                </>
                              )}
                              {activity.type === 'rejected' && (
                                <>
                                  <span className="text-foreground">{activity.user?.name || 'Someone'}</span>
                                  {' rejected '}
                                  <span className="text-primary">{activity.expense.item}</span>
                                </>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              ${parseFloat(activity.expense.amount).toFixed(2)} • {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          
                          {/* Status Badge */}
                          <Badge 
                            variant={
                              activity.type === 'created' ? 'default' :
                              activity.type === 'approved' ? 'success' : 'danger'
                            }
                          >
                            {activity.type}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Activity;

