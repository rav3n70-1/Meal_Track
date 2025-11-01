// Expense categories configuration
import { ShoppingBag, Utensils, Coffee, Home, Zap, Wifi, Car, Heart, GraduationCap, ShoppingCart, Droplet, Tv, Phone, Gift, MoreHorizontal } from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: '#10b981', emoji: '🛒' },
  { id: 'dining', label: 'Dining Out', icon: Utensils, color: '#f59e0b', emoji: '🍽️' },
  { id: 'beverages', label: 'Beverages', icon: Coffee, color: '#8b5cf6', emoji: '☕' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: '#3b82f6', emoji: '⚡' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: '#06b6d4', emoji: '📶' },
  { id: 'rent', label: 'Rent', icon: Home, color: '#ef4444', emoji: '🏠' },
  { id: 'transport', label: 'Transport', icon: Car, color: '#6366f1', emoji: '🚗' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, color: '#ec4899', emoji: '💊' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: '#14b8a6', emoji: '📚' },
  { id: 'household', label: 'Household Items', icon: Home, color: '#f97316', emoji: '🏡' },
  { id: 'water', label: 'Water Bill', icon: Droplet, color: '#0ea5e9', emoji: '💧' },
  { id: 'entertainment', label: 'Entertainment', icon: Tv, color: '#a855f7', emoji: '🎬' },
  { id: 'phone', label: 'Phone Bill', icon: Phone, color: '#22c55e', emoji: '📱' },
  { id: 'gifts', label: 'Gifts', icon: Gift, color: '#f43f5e', emoji: '🎁' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b', emoji: '📦' }
];

export const getCategoryById = (id) => {
  return EXPENSE_CATEGORIES.find(cat => cat.id === id) || EXPENSE_CATEGORIES.find(cat => cat.id === 'other');
};

export const getCategoryColor = (id) => {
  const category = getCategoryById(id);
  return category.color;
};

export const getCategoryLabel = (id) => {
  const category = getCategoryById(id);
  return category.label;
};

