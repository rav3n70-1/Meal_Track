// Modal component for sending manual WhatsApp messages to members
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, X, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { sendWhatsAppMessage, testWhatsAppCredentials } from '../../utils/whatsappService';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const SendWhatsAppModal = ({ isOpen, onClose, members = [], selectedMembers = [], bill = null }) => {
  const [message, setMessage] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState({}); // Track status for each member

  // Filter members with phone numbers
  const membersWithPhone = members.filter(m => m.mobileNumber);

  // Debug: Log when modal opens and on mount
  useEffect(() => {
    console.log('📱 SendWhatsAppModal component rendered/mounted', {
      isOpen,
      membersCount: members.length,
      membersWithPhoneCount: membersWithPhone.length,
      selectedMembersCount: selectedMembers.length,
      hasBill: !!bill
    });
    
    if (isOpen) {
      console.log('🔓 SendWhatsAppModal opened', {
        membersCount: members.length,
        membersWithPhoneCount: membersWithPhone.length,
        selectedMembersCount: selectedMembers.length,
        hasBill: !!bill,
        phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
        hasAccessToken: !!import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
        accessTokenLength: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN?.length || 0
      });
      
      // Test if console is working
      console.log('✅ Console is working! If you see this, console logging is enabled.');
      console.warn('⚠️ This is a warning test');
      console.error('❌ This is an error test (not a real error)');
    }
  }, [isOpen, members.length, membersWithPhone.length, selectedMembers.length, bill]);

  // Helper function to format bill information for a member
  const getBillInfoForMember = (member) => {
    if (!bill || !member) return null;

    const memberAmounts = bill.memberCategoryAmounts?.[member.uid];
    if (!memberAmounts) return null;

    const memberTotal = Object.values(memberAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
    if (memberTotal <= 0) return null;

    // Get category breakdown
    let categoryBreakdown = '';
    if (bill.categories && memberAmounts) {
      const categories = bill.categories.filter(cat => parseFloat(memberAmounts[cat]) > 0);
      if (categories.length > 0) {
        categoryBreakdown = '\n\nBreakdown:\n';
        categories.forEach(category => {
          const amount = parseFloat(memberAmounts[category]) || 0;
          if (amount > 0) {
            categoryBreakdown += `• ${category}: ৳${amount.toFixed(2)}\n`;
          }
        });
      }
    }

    // Get payment status
    const memberPayments = bill.memberCategoryPayments?.[member.uid] || {};
    const paidAmount = Object.values(memberPayments).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
    const remainingAmount = Math.max(0, memberTotal - paidAmount);
    const paymentStatus = paidAmount >= memberTotal - 0.01 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';

    return {
      totalAmount: memberTotal,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      paymentStatus: paymentStatus,
      dueDate: dueDate,
      categoryBreakdown: categoryBreakdown,
      billDescription: bill.description || 'Bill'
    };
  };

  // Initialize selected members
  useEffect(() => {
    if (selectedMembers && selectedMembers.length > 0) {
      // If specific members are passed, select only those with phone numbers
      const validIds = selectedMembers
        .filter(m => m.mobileNumber)
        .map(m => m.uid || m.id);
      setSelectedMemberIds(validIds);
    } else if (membersWithPhone.length > 0) {
      // If no specific members, select all members with phone numbers by default
      setSelectedMemberIds(membersWithPhone.map(m => m.uid || m.id));
    }
  }, [selectedMembers, membersWithPhone]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setSendStatus({});
      setSelectedMemberIds([]);
    }
  }, [isOpen]);

  const handleMemberToggle = (memberId) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.length === membersWithPhone.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(membersWithPhone.map(m => m.uid || m.id));
    }
  };

  const handleSend = async (e) => {
    // Prevent form submission if called from form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🖱️ handleSend function called!', {
      message: message.trim(),
      selectedMemberIds,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    if (!message.trim()) {
      console.warn('⚠️ Message is empty');
      toast.error('Please enter a message');
      return;
    }

    if (selectedMemberIds.length === 0) {
      console.warn('⚠️ No members selected');
      toast.error('Please select at least one member');
      return;
    }

    console.log('🚀 Starting to send WhatsApp messages...', {
      selectedMemberIds,
      messageLength: message.length,
      membersCount: selectedMemberIds.length,
      messagePreview: message.substring(0, 50)
    });

    setSending(true);
    setSendStatus({});

    const selectedMembersList = membersWithPhone.filter(m => 
      selectedMemberIds.includes(m.uid || m.id)
    );

    console.log('📋 Selected members:', selectedMembersList.map(m => ({
      name: getDisplayName(m),
      uid: m.uid,
      mobileNumber: m.mobileNumber
    })));

    // Test credentials first (only in development)
    if (import.meta.env.DEV) {
      try {
        console.log('🧪 Testing credentials before sending...');
        const credentialTest = await testWhatsAppCredentials();
        if (!credentialTest.success) {
          toast.error(`Credentials test failed: ${credentialTest.message}. Check console for details.`, { duration: 8000 });
          console.error('❌ Credentials test failed:', credentialTest);
          setSending(false);
          return;
        }
        console.log('✅ Credentials test passed:', credentialTest.details);
      } catch (error) {
        console.error('❌ Error testing credentials:', error);
        toast.error('Failed to verify credentials. Please check the console.', { duration: 6000 });
        setSending(false);
        return;
      }
    }

    let successCount = 0;
    let failCount = 0;

    // Send messages sequentially to avoid rate limiting
    for (const member of selectedMembersList) {
      try {
        // Personalize message for each member if bill context exists
        let messageToSend = message.trim();
        const memberName = member.nickname || member.name || 'Member';
        
        // If bill exists, personalize the message with member-specific data
        if (bill) {
          const billInfo = getBillInfoForMember(member);
          if (billInfo) {
            // Replace placeholders first
            messageToSend = messageToSend.replace(/\{memberName\}/g, memberName);
            messageToSend = messageToSend.replace(/\{totalAmount\}/g, `৳${billInfo.totalAmount.toFixed(2)}`);
            messageToSend = messageToSend.replace(/\{paidAmount\}/g, `৳${billInfo.paidAmount.toFixed(2)}`);
            messageToSend = messageToSend.replace(/\{remainingAmount\}/g, `৳${billInfo.remainingAmount.toFixed(2)}`);
            messageToSend = messageToSend.replace(/\{dueDate\}/g, billInfo.dueDate);
            messageToSend = messageToSend.replace(/\{billDescription\}/g, billInfo.billDescription);
            messageToSend = messageToSend.replace(/\{paymentStatus\}/g, 
              billInfo.paymentStatus === 'paid' ? 'Paid' : 
              billInfo.paymentStatus === 'partial' ? 'Partial Payment' : 'Unpaid');
            messageToSend = messageToSend.replace(/\{categoryBreakdown\}/g, billInfo.categoryBreakdown || '');
            
            // Auto-replace amounts in template messages (detect if message contains bill data patterns)
            // Replace Total Amount with member-specific amount and breakdown
            if (messageToSend.includes('*Total Amount:*')) {
              // Replace Total Amount line and any following breakdown lines until next *field* or blank line
              const totalAmountPattern = /\*Total Amount:\*[^\n]*(?:\n(?!\*)[^\n]*)*/g;
              const replacement = `*Total Amount:* ৳${billInfo.totalAmount.toFixed(2)}${billInfo.categoryBreakdown}`;
              messageToSend = messageToSend.replace(totalAmountPattern, replacement);
            }
            
            // Replace Amount Paid
            if (messageToSend.includes('*Amount Paid:*')) {
              messageToSend = messageToSend.replace(
                /\*Amount Paid:\*[^\n]*/g,
                `*Amount Paid:* ৳${billInfo.paidAmount.toFixed(2)}`
              );
            }
            
            // Replace Remaining Amount
            if (messageToSend.includes('*Remaining Amount:*')) {
              messageToSend = messageToSend.replace(
                /\*Remaining Amount:\*[^\n]*/g,
                `*Remaining Amount:* ৳${billInfo.remainingAmount.toFixed(2)}`
              );
            }
            
            // Replace Payment Status
            if (messageToSend.includes('*Payment Status:*')) {
              const statusText = billInfo.paymentStatus === 'paid' ? 'Paid' : 
                               billInfo.paymentStatus === 'partial' ? 'Partial Payment' : 'Unpaid';
              messageToSend = messageToSend.replace(
                /\*Payment Status:\*[^\n]*/g,
                `*Payment Status:* ${statusText}`
              );
            }
            
            // Replace Due Date
            if (messageToSend.includes('*Due Date:*')) {
              messageToSend = messageToSend.replace(
                /\*Due Date:\*[^\n]*/g,
                `*Due Date:* ${billInfo.dueDate}`
              );
            }
            
            // Replace Description
            if (messageToSend.includes('*Description:*')) {
              messageToSend = messageToSend.replace(
                /\*Description:\*[^\n]*/g,
                `*Description:* ${billInfo.billDescription}`
              );
            }
            
            // Replace Bill description in "Bill: *description*" format
            if (messageToSend.includes('Bill: *')) {
              messageToSend = messageToSend.replace(
                /Bill: \*[^\*]+\*/g,
                `Bill: *${billInfo.billDescription}*`
              );
            }
          }
        } else {
          // Even without bill context, replace member name placeholder
          messageToSend = messageToSend.replace(/\{memberName\}/g, memberName);
        }
        
        console.log(`📤 Sending message to ${getDisplayName(member)}...`, {
          member: getDisplayName(member),
          mobileNumber: member.mobileNumber,
          messageLength: messageToSend.length
        });

        const result = await sendWhatsAppMessage(member.mobileNumber, messageToSend);
        
        console.log(`📥 Result for ${getDisplayName(member)}:`, result);
        
        setSendStatus(prev => ({
          ...prev,
          [member.uid || member.id]: result?.success ? 'success' : 'error'
        }));

        if (result?.success) {
          successCount++;
          console.log(`✅ Successfully sent to ${getDisplayName(member)}`);
        } else {
          failCount++;
          console.error(`❌ Failed to send to ${getDisplayName(member)}`);
        }

        // Small delay between messages to avoid rate limiting
        if (selectedMembersList.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to send message to ${member.name}:`, error);
        const errorMessage = error.message || 'Unknown error occurred';
        toast.error(`Failed to send to ${getDisplayName(member)}: ${errorMessage}`, {
          duration: 5000
        });
        setSendStatus(prev => ({
          ...prev,
          [member.uid || member.id]: 'error'
        }));
        failCount++;
      }
    }

    setSending(false);

    if (successCount > 0 && failCount === 0) {
      toast.success(`Message sent successfully to ${successCount} member(s)`);
      onClose();
    } else if (successCount > 0 && failCount > 0) {
      toast.error(`Message sent to ${successCount} member(s), failed for ${failCount} member(s)`);
    } else {
      toast.error('Failed to send message to all members');
    }
  };

  const getStatusIcon = (memberId) => {
    const status = sendStatus[memberId];
    if (status === 'success') {
      return <CheckCircle size={16} className="text-green-500" />;
    } else if (status === 'error') {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Message"
      size="lg"
    >
      <div className="space-y-6">
        {/* Member Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">
              Select Members ({selectedMemberIds.length} selected)
            </label>
            {membersWithPhone.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedMemberIds.length === membersWithPhone.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {membersWithPhone.length === 0 ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No members with phone numbers found. Please add phone numbers to members first.
              </p>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-2">
              {membersWithPhone.map((member) => {
                const isSelected = selectedMemberIds.includes(member.uid || member.id);
                const status = sendStatus[member.uid || member.id];
                
                return (
                  <motion.div
                    key={member.uid || member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-accent border-border hover:bg-accent/80'
                    } ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !sending && handleMemberToggle(member.uid || member.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {isSelected && (
                            <CheckCircle size={14} className="text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-muted-foreground" />
                            <span className="font-medium">{getDisplayName(member)}</span>
                            {getStatusIcon(member.uid || member.id)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone size={14} className="text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{member.mobileNumber}</span>
                          </div>
                        </div>
                      </div>
                      {status === 'success' && (
                        <span className="text-xs text-green-600">Sent</span>
                      )}
                      {status === 'error' && (
                        <span className="text-xs text-red-600">Failed</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          {bill && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>Note:</strong> When sending to multiple members, each member will automatically receive personalized amounts, dates, and breakdowns based on their bill allocation.
              </p>
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows="6"
            className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={sending}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {message.length} characters
          </p>
        </div>

        {/* Message Templates (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Quick Templates (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {bill ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Get bill info for first selected member (as template)
                    const firstMember = membersWithPhone.find(m => selectedMemberIds.includes(m.uid || m.id));
                    const billInfo = firstMember ? getBillInfoForMember(firstMember) : null;
                    
                    if (billInfo) {
                      let message = `🏠 *Bill Reminder*\n\n` +
                        `This is a reminder regarding your bill:\n\n` +
                        `*Description:* ${billInfo.billDescription}\n` +
                        `*Total Amount:* ৳${billInfo.totalAmount.toFixed(2)}${billInfo.categoryBreakdown}` +
                        `*Due Date:* ${billInfo.dueDate}\n\n` +
                        `*Payment Status:* ${billInfo.paymentStatus === 'paid' ? 'Paid' : billInfo.paymentStatus === 'partial' ? 'Partial Payment' : 'Unpaid'}\n`;
                      
                      if (billInfo.paymentStatus !== 'paid') {
                        message += `*Remaining Amount:* ৳${billInfo.remainingAmount.toFixed(2)}\n\n`;
                      }
                      
                      message += `Please ensure payment is made by the due date.\n\nThank you!`;
                      setMessage(message);
                    } else {
                      const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A';
                      setMessage(`🏠 *Bill Reminder*\n\n` +
                        `This is a reminder regarding your bill:\n\n` +
                        `*Description:* ${bill.description || 'Bill'}\n` +
                        `*Due Date:* ${dueDate}\n\n` +
                        `Please ensure payment is made by the due date.\n\nThank you!`);
                    }
                  }}
                  disabled={sending}
                >
                  Bill Reminder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const firstMember = membersWithPhone.find(m => selectedMemberIds.includes(m.uid || m.id));
                    const billInfo = firstMember ? getBillInfoForMember(firstMember) : null;
                    
                    if (billInfo && billInfo.paymentStatus !== 'paid') {
                      let message = `📋 *Payment Status Update*\n\n` +
                        `Bill: *${billInfo.billDescription}*\n\n` +
                        `*Total Amount:* ৳${billInfo.totalAmount.toFixed(2)}${billInfo.categoryBreakdown}` +
                        `*Amount Paid:* ৳${billInfo.paidAmount.toFixed(2)}\n` +
                        `*Remaining Amount:* ৳${billInfo.remainingAmount.toFixed(2)}\n` +
                        `*Due Date:* ${billInfo.dueDate}\n\n` +
                        `Please arrange payment for the remaining amount.\n\nThank you!`;
                      setMessage(message);
                    } else if (billInfo && billInfo.paymentStatus === 'paid') {
                      let message = `📋 *Payment Status Update*\n\n` +
                        `Bill: *${billInfo.billDescription}*\n\n` +
                        `*Total Amount:* ৳${billInfo.totalAmount.toFixed(2)}${billInfo.categoryBreakdown}` +
                        `*Amount Paid:* ৳${billInfo.paidAmount.toFixed(2)}\n` +
                        `*Payment Status:* Paid\n` +
                        `*Due Date:* ${billInfo.dueDate}\n\n` +
                        `Thank you for your payment!`;
                      setMessage(message);
                    } else {
                      const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A';
                      setMessage(`📋 *Payment Status Update*\n\n` +
                        `Bill: *${bill.description || 'Bill'}*\n\n` +
                        `*Due Date:* ${dueDate}\n\n` +
                        `Please check your payment status in the app.\n\nThank you!`);
                    }
                  }}
                  disabled={sending}
                >
                  Payment Status
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const firstMember = membersWithPhone.find(m => selectedMemberIds.includes(m.uid || m.id));
                    const billInfo = firstMember ? getBillInfoForMember(firstMember) : null;
                    
                    if (billInfo) {
                      let message = `📊 *Bill Details*\n\n` +
                        `*Description:* ${billInfo.billDescription}\n` +
                        `*Total Amount:* ৳${billInfo.totalAmount.toFixed(2)}${billInfo.categoryBreakdown}` +
                        `*Due Date:* ${billInfo.dueDate}\n` +
                        `*Payment Status:* ${billInfo.paymentStatus === 'paid' ? 'Paid' : billInfo.paymentStatus === 'partial' ? 'Partial Payment' : 'Unpaid'}\n`;
                      
                      if (billInfo.paymentStatus === 'partial') {
                        message += `*Amount Paid:* ৳${billInfo.paidAmount.toFixed(2)}\n` +
                          `*Remaining Amount:* ৳${billInfo.remainingAmount.toFixed(2)}\n`;
                      } else if (billInfo.paymentStatus === 'unpaid') {
                        message += `*Remaining Amount:* ৳${billInfo.remainingAmount.toFixed(2)}\n`;
                      }
                      
                      message += `\nPlease review the details and ensure timely payment.\n\nThank you!`;
                      setMessage(message);
                    } else {
                      const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A';
                      setMessage(`📊 *Bill Details*\n\n` +
                        `*Description:* ${bill.description || 'Bill'}\n` +
                        `*Due Date:* ${dueDate}\n\n` +
                        `Please review the bill details in the app.\n\nThank you!`);
                    }
                  }}
                  disabled={sending}
                >
                  Bill Details
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A';
                    setMessage(`⏰ *Payment Due Reminder*\n\n` +
                      `Bill: *${bill.description || 'Bill'}*\n` +
                      `*Due Date:* ${dueDate}\n\n` +
                      `This is a reminder that payment is due soon. Please ensure timely payment to avoid any inconvenience.\n\nThank you for your cooperation!`);
                  }}
                  disabled={sending}
                >
                  Due Date Reminder
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('📋 *Payment Reminder*\n\n' +
                    'This is a reminder regarding your pending payments.\n\n' +
                    'Please review your account in the app and ensure all outstanding amounts are settled.\n\n' +
                    'Thank you for your prompt attention to this matter.')}
                  disabled={sending}
                >
                  Payment Reminder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('📊 *Account Status Update*\n\n' +
                    'Please check your account status in the app for the latest bill information and payment details.\n\n' +
                    'If you have any questions or concerns, please contact the manager.\n\n' +
                    'Thank you!')}
                  disabled={sending}
                >
                  Account Status
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('💰 *Payment Update Request*\n\n' +
                    'Please update your payment status in the app if you have made any recent payments.\n\n' +
                    'This will help us maintain accurate records and ensure proper account reconciliation.\n\n' +
                    'Thank you for your cooperation!')}
                  disabled={sending}
                >
                  Payment Update
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('📱 *App Notification*\n\n' +
                    'Please check the app for any new bills, payment updates, or important notifications.\n\n' +
                    'All billing information and payment details are available in your account.\n\n' +
                    'Thank you!')}
                  disabled={sending}
                >
                  App Notification
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('🔔 *General Reminder*\n\n' +
                    'This is a general reminder to review your bills and payment status in the app.\n\n' +
                    'Please ensure all payments are up to date. If you have any outstanding amounts, please arrange payment at your earliest convenience.\n\n' +
                    'Thank you for your attention to this matter!')}
                  disabled={sending}
                >
                  General Reminder
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={(e) => {
              console.log('🔴 Send button clicked!', {
                sending,
                selectedMemberIdsLength: selectedMemberIds.length,
                messageLength: message.trim().length,
                disabled: sending || selectedMemberIds.length === 0 || !message.trim()
              });
              handleSend(e);
            }}
            disabled={sending || selectedMemberIds.length === 0 || !message.trim()}
            className="flex-1"
            icon={<Send size={18} />}
          >
            {sending ? `Sending... (${Object.keys(sendStatus).length}/${selectedMemberIds.length})` : `Send to ${selectedMemberIds.length} Member(s)`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={sending}
            icon={<X size={18} />}
          >
            Cancel
          </Button>
        </div>
        
        {/* Debug Info (Development Only) */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs space-y-1">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>Phone Number ID: {import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID ? `✓ ${import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID}` : '✗ Missing'}</p>
            <p>Access Token: {import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN ? `✓ Configured (${import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN.length} chars)` : '✗ Missing'}</p>
            <p>API Version: {import.meta.env.VITE_WHATSAPP_API_VERSION || 'v21.0 (default)'}</p>
            <p>Members with phone: {membersWithPhone.length}</p>
            <p>Selected members: {selectedMemberIds.length}</p>
            <p className="mt-2 text-muted-foreground italic">
              ⚠️ Check browser console (F12) for detailed API logs and errors
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🧪 Test Console button clicked - Console is working!');
                  console.log('Current state:', {
                    message,
                    selectedMemberIds,
                    sending,
                    membersWithPhoneCount: membersWithPhone.length
                  });
                  alert('Console test: Check the browser console (F12) - you should see log messages!');
                }}
              >
                Test Console
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🧪 Testing credentials...');
                  console.log('Environment variables:', {
                    phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
                    hasAccessToken: !!import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
                    accessTokenLength: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN?.length || 0,
                    apiVersion: import.meta.env.VITE_WHATSAPP_API_VERSION
                  });
                  try {
                    const result = await testWhatsAppCredentials();
                    console.log('Credentials test result:', result);
                    if (result.success) {
                      toast.success('Credentials are valid! ✅', { duration: 3000 });
                    } else {
                      toast.error(`Credentials test failed: ${result.message}`, { duration: 5000 });
                    }
                  } catch (error) {
                    console.error('Error testing credentials:', error);
                    toast.error('Error testing credentials. Check console.', { duration: 5000 });
                  }
                }}
              >
                Test Credentials
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SendWhatsAppModal;

