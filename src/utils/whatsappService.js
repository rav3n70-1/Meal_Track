// WhatsApp Business API Service Utility
// Uses Meta's WhatsApp Cloud API (free tier available)

/**
 * Format phone number to WhatsApp format (with country code, no + or spaces)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number (e.g., 8801712345678)
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If number starts with 0, replace with country code (default: 880 for Bangladesh)
  if (cleaned.startsWith('0')) {
    cleaned = '880' + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add it (default: 880 for Bangladesh)
  if (!cleaned.startsWith('880') && cleaned.length === 10) {
    cleaned = '880' + cleaned;
  }
  
  // Remove leading + if present (WhatsApp API doesn't need it)
  return cleaned;
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  const cleaned = phoneNumber.replace(/\D/g, '');
  // Basic validation: should be 10-15 digits after cleaning
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Test WhatsApp API credentials
 * @returns {Promise<{success: boolean, message: string, details?: any}>}
 */
export const testWhatsAppCredentials = async () => {
  const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
  const apiVersion = import.meta.env.VITE_WHATSAPP_API_VERSION || 'v21.0';
  
  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      message: 'Credentials not configured',
      details: {
        hasPhoneNumberId: !!phoneNumberId,
        hasAccessToken: !!accessToken
      }
    };
  }
  
  try {
    // Test by trying to get phone number info
    const testUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
    console.log('🧪 Testing WhatsApp credentials...', { testUrl });
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Credentials test successful:', data);
      return {
        success: true,
        message: 'Credentials are valid',
        details: data
      };
    } else {
      console.error('❌ Credentials test failed:', data);
      return {
        success: false,
        message: data.error?.message || 'Invalid credentials',
        details: data.error
      };
    }
  } catch (error) {
    console.error('❌ Credentials test error:', error);
    return {
      success: false,
      message: error.message || 'Failed to test credentials',
      details: { error: error.message }
    };
  }
};

/**
 * Send WhatsApp message using Meta's WhatsApp Cloud API
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<boolean>} - True if sent successfully
 */
export const sendWhatsAppMessage = async (to, message) => {
  if (!to || !message) {
    const error = 'Phone number and message are required';
    console.error(error);
    throw new Error(error);
  }
  
  if (!isValidPhoneNumber(to)) {
    const error = `Invalid phone number format: ${to}`;
    console.error(error);
    throw new Error(error);
  }
  
  const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
  const apiVersion = import.meta.env.VITE_WHATSAPP_API_VERSION || 'v21.0';
  
  // Check if credentials are configured
  if (!phoneNumberId || !accessToken) {
    const error = 'WhatsApp API credentials not configured. Please check your .env file.';
    console.error(error, {
      hasPhoneNumberId: !!phoneNumberId,
      hasAccessToken: !!accessToken,
      phoneNumberIdLength: phoneNumberId?.length || 0,
      accessTokenLength: accessToken?.length || 0
    });
    throw new Error(error);
  }
  
  try {
    const formattedTo = formatPhoneNumber(to);
    if (!formattedTo) {
      throw new Error(`Invalid phone number: ${to}`);
    }
    
    const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: formattedTo,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };
    
    console.log('🔵 Making WhatsApp API call...', {
      url: apiUrl,
      method: 'POST',
      to: formattedTo,
      originalTo: to,
      phoneNumberId,
      apiVersion,
      messageLength: message.length,
      messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      tokenPreview: accessToken.substring(0, 20) + '...' // Only show first 20 chars for security
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🟢 Received response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    let responseData;
    try {
      const responseText = await response.text();
      console.log('📄 Response body (raw):', responseText);
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      throw new Error(`Invalid response from WhatsApp API: ${response.status} ${response.statusText}`);
    }
    
    console.log('📦 Parsed response data:', responseData);
    
    if (!response.ok) {
      const errorMessage = responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      const errorCode = responseData.error?.code;
      const errorType = responseData.error?.type;
      const errorDetails = responseData.error?.error_subcode || responseData.error?.error_user_msg;
      const fbtraceId = responseData.error?.fbtrace_id;
      
      console.error('❌ WhatsApp API error:', {
        status: response.status,
        statusText: response.statusText,
        errorCode,
        errorType,
        errorMessage,
        errorDetails,
        fbtraceId,
        fullError: responseData.error,
        fullResponse: responseData
      });
      
      // Provide more detailed error messages
      let userFriendlyError = errorMessage;
      if (errorCode === 131047) {
        userFriendlyError = 'Recipient phone number is not registered on WhatsApp. Please verify the phone number.';
      } else if (errorCode === 131026) {
        userFriendlyError = 'Recipient phone number is invalid. Please check the phone number format.';
      } else if (errorCode === 190) {
        userFriendlyError = 'Access token is invalid or expired. Please check your WhatsApp API credentials and restart the server.';
      } else if (errorCode === 100) {
        userFriendlyError = `Invalid parameter: ${errorMessage}. Please check the phone number and message format.`;
      } else if (errorType === 'OAuthException') {
        userFriendlyError = `Authentication failed: ${errorMessage}. Please check your access token.`;
      } else if (errorCode === 131031) {
        userFriendlyError = 'Message template required. The recipient needs to have an active 24-hour session or you need to use a template message.';
      } else if (errorCode === 131051) {
        userFriendlyError = 'Recipient phone number is not a valid WhatsApp number.';
      }
      
      const fullError = new Error(userFriendlyError);
      fullError.errorCode = errorCode;
      fullError.errorType = errorType;
      fullError.errorDetails = errorDetails;
      fullError.fbtraceId = fbtraceId;
      throw fullError;
    }
    
    // Check if response indicates success
    if (responseData.messages && responseData.messages[0]?.id) {
      console.log('✅ WhatsApp message sent successfully!', {
        messageId: responseData.messages[0].id,
        to: formattedTo,
        status: 'sent',
        contact: responseData.contacts?.[0]
      });
      return { success: true, data: responseData };
    } else if (responseData.messages) {
      console.warn('⚠️ WhatsApp API returned response but no message ID:', responseData);
      return { success: true, data: responseData }; // Assume success if no error
    } else {
      console.error('❌ Unexpected response format:', responseData);
      throw new Error('Unexpected response from WhatsApp API. Please check the console for details.');
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', {
      error: error.message,
      errorCode: error.errorCode,
      errorType: error.errorType,
      errorDetails: error.errorDetails,
      fbtraceId: error.fbtraceId,
      stack: error.stack,
      to: formatPhoneNumber(to),
      originalTo: to
    });
    
    // If it's a network error, provide helpful message
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error: Could not connect to WhatsApp API. Please check your internet connection and try again.');
    }
    
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Send bill creation notification via WhatsApp
 * @param {Object} member - Member object with phone number
 * @param {Object} bill - Bill object
 * @param {number} memberAmount - Amount for this member
 * @returns {Promise<boolean>} - True if sent successfully
 */
export const sendBillCreationWhatsApp = async (member, bill, memberAmount) => {
  if (!member?.mobileNumber) {
    console.warn(`No mobile number for member ${member.name || member.uid}`);
    return false;
  }
  
  const memberName = member.nickname || member.name || 'Member';
  const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';
  const billDescription = bill.description || 'Bill';
  
  // Format categories and amounts if available
  let categoryBreakdown = '';
  if (bill.categories && bill.memberCategoryAmounts?.[member.uid]) {
    const memberAmounts = bill.memberCategoryAmounts[member.uid];
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
  
  const message = `🏠 *New Bill Created*\n\n` +
    `Hello ${memberName},\n\n` +
    `A new bill has been created for you:\n\n` +
    `*Description:* ${billDescription}\n` +
    `*Your Amount:* ৳${memberAmount.toFixed(2)}${categoryBreakdown}\n` +
    `*Due Date:* ${dueDate}\n\n` +
    `Please make your payment on time.\n\n` +
    `Thank you! 🙏`;
  
  try {
    const result = await sendWhatsAppMessage(member.mobileNumber, message);
    return result?.success || false;
  } catch (error) {
    console.error(`Failed to send bill creation WhatsApp to ${memberName}:`, error);
    return false;
  }
};

/**
 * Send payment received notification via WhatsApp
 * @param {Object} member - Member object with phone number
 * @param {Object} bill - Bill object
 * @param {number} paymentAmount - Payment amount
 * @param {string} paymentStatus - 'partial' or 'full'
 * @param {number} remainingAmount - Remaining amount (if partial)
 * @returns {Promise<boolean>} - True if sent successfully
 */
export const sendPaymentReceivedWhatsApp = async (member, bill, paymentAmount, paymentStatus, remainingAmount = 0) => {
  if (!member?.mobileNumber) {
    console.warn(`No mobile number for member ${member.name || member.uid}`);
    return false;
  }
  
  const memberName = member.nickname || member.name || 'Member';
  const billDescription = bill.description || 'Bill';
  
  let message = `💰 *Payment Received*\n\n` +
    `Hello ${memberName},\n\n` +
    `Payment received for: *${billDescription}*\n\n` +
    `*Payment Amount:* ৳${paymentAmount.toFixed(2)}\n`;
  
  if (paymentStatus === 'full') {
    message += `\n✅ *Status:* Full Payment Received\n\n` +
      `Thank you for your payment! 🙏`;
  } else {
    message += `\n⏳ *Status:* Partial Payment Received\n` +
      `*Remaining Amount:* ৳${remainingAmount.toFixed(2)}\n\n` +
      `Please pay the remaining amount at your earliest convenience.`;
  }
  
  try {
    const result = await sendWhatsAppMessage(member.mobileNumber, message);
    return result?.success || false;
  } catch (error) {
    console.error(`Failed to send payment received WhatsApp to ${memberName}:`, error);
    return false;
  }
};

