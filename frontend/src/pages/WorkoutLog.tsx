import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, Calendar, Dumbbell, Target, Sparkles, Copy } from 'lucide-react';
import { workoutApi, exerciseApi, workoutSplitApi } from '../services/api';
import { Exercise, WorkoutWithSets, WorkoutExercise, WorkoutPlan } from '../types';
import { format } from 'date-fns';
import SearchableDropdown from '../components/SearchableDropdown';
import { useNotification } from '../contexts/NotificationContext';

const WorkoutLog = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
  );
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingWorkout, setExistingWorkout] = useState<WorkoutWithSets | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<string>('');

  useEffect(() => {
    fetchExercises();
    fetchExistingWorkout();
    fetchWorkoutPlan();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSplit) {
      fetchWorkoutPlan();
    }
  }, [selectedSplit]);

  const fetchExercises = async () => {
    try {
      const data = await exerciseApi.getAll();
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchExistingWorkout = async () => {
    try {
      setLoading(true);
      const workout = await workoutApi.getByDate(selectedDate);
      if (workout) {
        setExistingWorkout(workout);
        setNotes(workout.notes || '');
        setSelectedSplit(workout.split || '');
        setWorkoutExercises(
          workout.exercises.map(ex => ({
            exercise_id: ex.exercise.id,
            sets: ex.sets.map(set => ({
              weight: set.weight,
              reps: set.reps
            }))
          }))
        );
      } else {
        setExistingWorkout(null);
        setNotes('');
        setSelectedSplit('');
        setWorkoutExercises([]);
      }
    } catch (error) {
      console.error('Error fetching existing workout:', error);
      setExistingWorkout(null);
      setNotes('');
      setSelectedSplit('');
      setWorkoutExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutPlan = async () => {
    try {
      // Get selected split from URL params or use selectedSplit state
      const urlParams = new URLSearchParams(window.location.search);
      const urlSplit = urlParams.get('split');
      const splitToUse = selectedSplit || urlSplit;
      const plan = await workoutSplitApi.getWorkoutPlan(splitToUse || undefined);
      setWorkoutPlan(plan);
    } catch (error) {
      console.error('Error fetching workout plan:', error);
    }
  };

  const addExercise = () => {
    setWorkoutExercises([...workoutExercises, { exercise_id: 0, sets: [{ weight: 0, reps: 0 }] }]);
  };

  const addRecommendedExercise = (exerciseId: number) => {
    // Check if exercise is already added
    const isAlreadyAdded = workoutExercises.some(we => we.exercise_id === exerciseId);
    if (!isAlreadyAdded) {
      setWorkoutExercises([...workoutExercises, { exercise_id: exerciseId, sets: [{ weight: 0, reps: 0 }] }]);
    }
  };

  const addAllRecommendedExercises = () => {
    if (!workoutPlan || workoutPlan.isRestDay) return;
    
    const newExercises = workoutPlan.recommendedExercises
      .filter(exercise => !workoutExercises.some(we => we.exercise_id === exercise.id))
      .map(exercise => ({ exercise_id: exercise.id, sets: [{ weight: 0, reps: 0 }] }));
    
    setWorkoutExercises([...workoutExercises, ...newExercises]);
  };

  const removeExercise = (index: number) => {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, exerciseId: number) => {
    const updated = [...workoutExercises];
    updated[index].exercise_id = exerciseId;
    setWorkoutExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.push({ weight: 0, reps: 0 });
    setWorkoutExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets.splice(setIndex, 1);
    setWorkoutExercises(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    const updated = [...workoutExercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setWorkoutExercises(updated);
  };

  const copyPreviousSet = (exerciseIndex: number, setIndex: number) => {
    if (setIndex > 0) {
      const previousSet = workoutExercises[exerciseIndex].sets[setIndex - 1];
      const updated = [...workoutExercises];
      updated[exerciseIndex].sets[setIndex] = { ...previousSet };
      setWorkoutExercises(updated);
    }
  };

  const saveWorkout = async () => {
    try {
      setSaving(true);
      
      // Filter out exercises with no sets or invalid data
      const validExercises = workoutExercises.filter(
        ex => ex.exercise_id > 0 && ex.sets.length > 0 && 
        ex.sets.some(set => set.weight > 0 && set.reps > 0)
      );

      if (validExercises.length === 0) {
        showWarning('No Exercises', 'Please add at least one exercise with one set');
        return;
      }

      const workoutData = {
        date: selectedDate,
        notes: notes.trim() || undefined,
        exercises: validExercises,
        split: selectedSplit || undefined
      };

      if (existingWorkout) {
        await workoutApi.update(existingWorkout.id, workoutData);
      } else {
        await workoutApi.create(workoutData);
      }

      showSuccess('Workout Saved!', 'Your workout has been saved successfully');
      fetchExistingWorkout();
      
      // Notify calendar to refresh
      window.dispatchEvent(new CustomEvent('workoutSaved'));
    } catch (error) {
      console.error('Error saving workout:', error);
      showError('Save Failed', 'Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getExerciseName = (exerciseId: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise ? exercise.name : 'Select Exercise';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Dumbbell className="h-6 w-6 mr-2 text-primary-600" />
            Log Workout
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-400" />
              <SearchableDropdown
                options={[
                  { key: 'push', text: 'Push', value: 'Push' },
                  { key: 'pull', text: 'Pull', value: 'Pull' },
                  { key: 'legs', text: 'Legs', value: 'Legs' },
                  { key: 'rest', text: 'Rest', value: 'Rest' }
                ]}
                placeholder="Select workout type..."
                value={selectedSplit}
                onChange={(_, data) => setSelectedSplit(data.value as string)}
                className="w-40"
              />
            </div>
            <button
              onClick={saveWorkout}
              disabled={saving}
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your workout..."
            className="input h-20 resize-none"
          />
        </div>
      </div>

      {/* Recommended Exercises */}
      {workoutPlan && !workoutPlan.isRestDay && workoutPlan.recommendedExercises.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className={`p-2 rounded-xl mr-3 ${
                workoutPlan.currentSplit.name === 'Push' ? 'bg-red-100' :
                workoutPlan.currentSplit.name === 'Pull' ? 'bg-blue-100' :
                workoutPlan.currentSplit.name === 'Legs' ? 'bg-green-100' :
                'bg-success-100'
              }`}>
                <Sparkles className={`h-5 w-5 ${
                  workoutPlan.currentSplit.name === 'Push' ? 'text-red-600' :
                  workoutPlan.currentSplit.name === 'Pull' ? 'text-blue-600' :
                  workoutPlan.currentSplit.name === 'Legs' ? 'text-green-600' :
                  'text-success-600'
                }`} />
              </div>
              Recommended Exercises for {workoutPlan.currentSplit.name} Day
            </h3>
            <button
              onClick={addAllRecommendedExercises}
              className={`text-sm px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg ${
                workoutPlan?.currentSplit.name === 'Push' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' :
                workoutPlan?.currentSplit.name === 'Pull' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' :
                workoutPlan?.currentSplit.name === 'Legs' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' :
                'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workoutPlan.recommendedExercises.map((exercise) => {
              const isAlreadyAdded = workoutExercises.some(we => we.exercise_id === exercise.id);
              return (
                <div
                  key={exercise.id}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isAlreadyAdded
                      ? 'bg-success-50 border-success-200'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-primary-50 hover:to-primary-100 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{exercise.name}</p>
                      {exercise.category && (
                        <p className="text-xs text-gray-500">{exercise.category}</p>
                      )}
                    </div>
                    <button
                      onClick={() => addRecommendedExercise(exercise.id)}
                      disabled={isAlreadyAdded}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isAlreadyAdded
                          ? 'bg-success-200 text-success-600 cursor-not-allowed'
                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                      }`}
                    >
                      {isAlreadyAdded ? (
                        <Target className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <div key={exerciseIndex} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 mr-4">
                <SearchableDropdown
                  options={[
                    { key: '0', text: 'Select Exercise', value: 0 },
                    ...exercises.map((exercise) => ({
                      key: exercise.id.toString(),
                      text: exercise.name,
                      value: exercise.id
                    }))
                  ]}
                  placeholder="Select exercise..."
                  value={workoutExercise.exercise_id}
                  onChange={(_, data) => updateExercise(exerciseIndex, data.value as number)}
                  className="w-full"
                />
              </div>
              <button
                onClick={() => removeExercise(exerciseIndex)}
                className="btn btn-danger flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>

            {workoutExercise.exercise_id > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {getExerciseName(workoutExercise.exercise_id)}
                  </h3>
                  <button
                    onClick={() => addSet(exerciseIndex)}
                    className="btn btn-secondary flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Set
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Set</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Weight (kg)</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Reps</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Volume</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workoutExercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-sm text-gray-900">{setIndex + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={set.weight}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                              className="input w-20 text-sm"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={set.reps}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                              className="input w-20 text-sm"
                            />
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-600">
                            {set.weight * set.reps} kg
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex space-x-2">
                              {setIndex > 0 && (
                                <button
                                  onClick={() => copyPreviousSet(exerciseIndex, setIndex)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Copy previous set"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="text-red-600 hover:text-red-700"
                                title="Remove set"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Exercise Button */}
        <button
          onClick={addExercise}
          className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Exercise
        </button>
      </div>
    </div>
  );
};

export default WorkoutLog;
