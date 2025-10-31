// Utility to get display name (nickname or full name)

/**
 * Get the display name for a user/member
 * @param {Object} user - User or member object
 * @returns {string} Nickname if available, otherwise full name
 */
export const getDisplayName = (user) => {
  if (!user) return 'Unknown';
  return user.nickname || user.name || user.displayName || 'User';
};

/**
 * Get full name (always returns the real name, not nickname)
 * @param {Object} user - User or member object
 * @returns {string} Full name
 */
export const getFullName = (user) => {
  if (!user) return 'Unknown';
  return user.name || user.displayName || user.email || 'User';
};

