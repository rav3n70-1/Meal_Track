import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useHousehold } from '../../context/HouseholdContext';
import { useMealPlan } from '../../context/MealPlanContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealFormModal = ({ isOpen, onClose, defaultDate, existingMeal }) => {
  const { members } = useHousehold();
  const { addMeal, updateMeal } = useMealPlan();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    mealType: 'Dinner',
    cookedBy: '',
    notes: ''
  });

  useEffect(() => {
    if (existingMeal) {
      setFormData({
        title: existingMeal.title || '',
        date: existingMeal.date || '',
        mealType: existingMeal.mealType || 'Dinner',
        cookedBy: existingMeal.cookedBy || '',
        notes: existingMeal.notes || ''
      });
    } else {
      setFormData({
        title: '',
        date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        mealType: 'Dinner',
        cookedBy: '',
        notes: ''
      });
    }
  }, [existingMeal, defaultDate, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Meal title is required');
      return;
    }

    setLoading(true);
    try {
      if (existingMeal) {
        await updateMeal(existingMeal.id, {
          title: formData.title.trim(),
          date: formData.date,
          mealType: formData.mealType,
          cookedBy: formData.cookedBy,
          notes: formData.notes.trim()
        });
      } else {
        await addMeal({
          title: formData.title.trim(),
          date: formData.date,
          mealType: formData.mealType,
          cookedBy: formData.cookedBy,
          notes: formData.notes.trim()
        });
      }
      onClose();
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingMeal ? 'Edit Meal' : 'Schedule Meal'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Meal (e.g. Chicken Curry)"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="What's cooking?"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Meal Type</label>
            <select
              name="mealType"
              value={formData.mealType}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {MEAL_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Cooked By (Optional)</label>
          <select
            name="cookedBy"
            value={formData.cookedBy}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- Unassigned --</option>
            {members.map(member => (
              <option key={member.uid} value={member.uid}>
                {member.nickname || member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Notes / Recipe Link</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add ingredients needed, or a link to the recipe..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (existingMeal ? 'Save Changes' : 'Add Meal')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MealFormModal;
