import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Dumbbell } from 'lucide-react';
import { exerciseApi } from '../services/api';
import { Exercise, CreateExerciseRequest } from '../types';
import SearchableDropdown from '../components/SearchableDropdown';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmDialog from '../components/ConfirmDialog';

const ExerciseManagement = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState<CreateExerciseRequest>({
    name: '',
    category: ''
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exercise.category && exercise.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredExercises(filtered);
    }
  }, [exercises, searchQuery]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const data = await exerciseApi.getAll();
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showWarning('Validation Error', 'Please enter exercise name');
      return;
    }

    try {
      if (editingExercise) {
        await exerciseApi.update(editingExercise.id, formData);
      } else {
        await exerciseApi.create(formData);
      }
      
      setShowModal(false);
      setEditingExercise(null);
      setFormData({ name: '', category: '' });
      fetchExercises();
      showSuccess(
        'Exercise Saved!', 
        editingExercise ? `"${formData.name}" has been updated successfully` : `"${formData.name}" has been added successfully`
      );
    } catch (error) {
      console.error('Error saving exercise:', error);
      showError('Save Failed', 'Failed to save exercise. Please try again.');
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      category: exercise.category || ''
    });
    setShowModal(true);
  };

  const handleDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete) return;

    try {
      await exerciseApi.delete(exerciseToDelete.id);
      fetchExercises();
      showSuccess('Exercise Deleted', `"${exerciseToDelete.name}" has been removed successfully`);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      showError('Delete Failed', 'Failed to delete exercise. Please try again.');
    } finally {
      setShowConfirmDialog(false);
      setExerciseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setExerciseToDelete(null);
  };

  const openModal = () => {
    setEditingExercise(null);
    setFormData({ name: '', category: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExercise(null);
    setFormData({ name: '', category: '' });
  };

  const categories = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

  const getCategoryClass = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'chest': return 'category-chest';
      case 'back': return 'category-back';
      case 'legs': return 'category-legs';
      case 'shoulders': return 'category-shoulders';
      case 'arms': return 'category-arms';
      case 'core': return 'category-core';
      case 'cardio': return 'category-cardio';
      default: return 'category-other';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="card-elevated p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
              <div className="p-3 bg-primary-100 rounded-2xl mr-4">
                <Dumbbell className="h-8 w-8 text-primary-600" />
              </div>
              Exercise Management
            </h1>
            <p className="text-gray-600 ml-16">Add, edit, and manage all exercises</p>
          </div>
          <button
            onClick={openModal}
            className="btn btn-primary flex items-center text-lg px-8 py-4"
          >
            <Plus className="h-6 w-6 mr-3" />
            Add Exercise
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card-elevated p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary-500" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12 text-lg py-4"
          />
        </div>
      </div>

      {/* Exercises List */}
      <div className="card-elevated p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-success-100 rounded-xl mr-3">
            <Dumbbell className="h-6 w-6 text-success-600" />
          </div>
          All Exercises ({filteredExercises.length})
        </h2>
        
        {filteredExercises.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="relative mb-6">
              <Dumbbell className="h-20 w-20 mx-auto text-gray-300 animate-bounce-gentle" />
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-warning-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xl font-medium mb-2">
              {searchQuery ? 'No exercises found' : 'No exercises yet'}
            </p>
            <p className="text-sm mb-6">
              {searchQuery ? 'Try searching with different keywords' : 'Start by adding your first exercise'}
            </p>
            {!searchQuery && (
              <button
                onClick={openModal}
                className="btn btn-primary"
              >
                Add First Exercise
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="group p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl hover:border-primary-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-primary-700 transition-colors">
                      {exercise.name}
                    </h3>
                    {exercise.category && (
                      <span className={`category-badge ${getCategoryClass(exercise.category)}`}>
                        {exercise.category}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise)}
                      className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(exercise.created_at).toLocaleDateString('en-US')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-strong animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-primary-100 rounded-2xl mr-4">
                <Dumbbell className="h-6 w-6 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input text-lg"
                  placeholder="e.g. Bench Press, Squat"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category
                </label>
                <SearchableDropdown
                  options={[
                    { key: '', text: 'Select Category', value: '' },
                    ...categories.map((category) => ({
                      key: category,
                      text: category,
                      value: category
                    }))
                  ]}
                  placeholder="Select category..."
                  value={formData.category}
                  onChange={(_, data) => setFormData({ ...formData, category: data.value as string })}
                  className="w-full text-lg"
                />
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  className="btn btn-primary flex-1 text-lg py-4"
                >
                  {editingExercise ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary flex-1 text-lg py-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${exerciseToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />
    </div>
  );
};

export default ExerciseManagement;
