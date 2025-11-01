// Advanced split calculation utilities

/**
 * Split types
 */
export const SPLIT_TYPES = {
  EQUAL: 'equal',
  PERCENTAGE: 'percentage',
  CUSTOM: 'custom',
  SHARES: 'shares'
};

/**
 * Calculate equal split
 */
export const calculateEqualSplit = (totalAmount, members) => {
  const perPerson = totalAmount / members.length;
  return members.map(member => ({
    memberId: member.uid || member,
    amount: Math.round(perPerson * 100) / 100
  }));
};

/**
 * Calculate percentage-based split
 */
export const calculatePercentageSplit = (totalAmount, memberPercentages) => {
  const total = memberPercentages.reduce((sum, mp) => sum + mp.percentage, 0);
  
  if (Math.abs(total - 100) > 0.01) {
    throw new Error('Percentages must add up to 100%');
  }

  return memberPercentages.map(mp => ({
    memberId: mp.memberId,
    amount: Math.round((totalAmount * mp.percentage / 100) * 100) / 100
  }));
};

/**
 * Calculate shares-based split (e.g., 2:1:1 ratio)
 */
export const calculateSharesSplit = (totalAmount, memberShares) => {
  const totalShares = memberShares.reduce((sum, ms) => sum + ms.shares, 0);
  const perShare = totalAmount / totalShares;

  return memberShares.map(ms => ({
    memberId: ms.memberId,
    amount: Math.round((perShare * ms.shares) * 100) / 100
  }));
};

/**
 * Validate custom split amounts
 */
export const validateCustomSplit = (totalAmount, memberAmounts) => {
  const sum = memberAmounts.reduce((total, ma) => total + ma.amount, 0);
  const difference = Math.abs(sum - totalAmount);
  
  return {
    isValid: difference < 0.01,
    difference: Math.round(difference * 100) / 100,
    sum: Math.round(sum * 100) / 100
  };
};

/**
 * Auto-adjust custom split to match total
 */
export const adjustCustomSplit = (totalAmount, memberAmounts) => {
  const currentSum = memberAmounts.reduce((sum, ma) => sum + ma.amount, 0);
  const difference = totalAmount - currentSum;
  
  if (Math.abs(difference) < 0.01) {
    return memberAmounts;
  }

  // Distribute difference proportionally
  const adjusted = [...memberAmounts];
  const lastIndex = adjusted.length - 1;
  adjusted[lastIndex] = {
    ...adjusted[lastIndex],
    amount: Math.round((adjusted[lastIndex].amount + difference) * 100) / 100
  };

  return adjusted;
};

/**
 * Calculate split including tax and tip
 */
export const calculateSplitWithTaxTip = (baseAmount, taxPercent, tipPercent, splitData, splitType) => {
  const tax = baseAmount * (taxPercent / 100);
  const tip = baseAmount * (tipPercent / 100);
  const totalAmount = baseAmount + tax + tip;

  let splits;
  switch (splitType) {
    case SPLIT_TYPES.PERCENTAGE:
      splits = calculatePercentageSplit(totalAmount, splitData);
      break;
    case SPLIT_TYPES.SHARES:
      splits = calculateSharesSplit(totalAmount, splitData);
      break;
    case SPLIT_TYPES.CUSTOM:
      // Scale custom amounts proportionally
      const baseSum = splitData.reduce((sum, sd) => sum + sd.amount, 0);
      const scaleFactor = totalAmount / baseSum;
      splits = splitData.map(sd => ({
        memberId: sd.memberId,
        amount: Math.round((sd.amount * scaleFactor) * 100) / 100
      }));
      break;
    default:
      splits = calculateEqualSplit(totalAmount, splitData);
  }

  return {
    baseAmount,
    tax,
    tip,
    totalAmount,
    splits
  };
};

