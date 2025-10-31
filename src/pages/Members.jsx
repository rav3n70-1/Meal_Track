// Members page showing all household members
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Mail, Crown } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useHousehold } from '../context/HouseholdContext';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const Members = () => {
  const { household, members, loading } = useHousehold();
  const [copied, setCopied] = useState(false);

  const handleCopyInviteCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
                  <div className="flex items-center gap-4">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.name}</h3>
                        {member.role === 'manager' && (
                          <Crown className="text-yellow-500" size={16} />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail size={14} />
                        {member.email}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <Badge 
                    variant={member.role === 'manager' ? 'success' : 'default'}
                  >
                    {member.role}
                  </Badge>
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
    </Layout>
  );
};

export default Members;

