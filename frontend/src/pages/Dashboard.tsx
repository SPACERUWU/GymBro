import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, TrendingUp, Dumbbell, Plus, Bot } from 'lucide-react';
import { workoutApi, statsApi } from '../services/api';
import { Workout, PersonalRecord } from '../types';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale';
import WorkoutPlanCard from '../components/WorkoutPlanCard';
import AIChat from '../components/AIChat';

const Dashboard = () => {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSplit, setSelectedSplit] = useState<string>('');
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workouts, records] = await Promise.all([
          workoutApi.getAll(),
          statsApi.getPersonalRecords()
        ]);
        
        setRecentWorkouts(workouts.slice(0, 3));
        setPersonalRecords(records.filter(record => record.max_weight > 0).slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy', { locale: enUS });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden gradient-bg rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 animate-slide-up">
                Welcome to GymBro
              </h1>
              <p className="text-xl text-white/90 mb-6 animate-slide-up">
                Track your workouts and monitor your progress
              </p>
              <Link
                to={`/workout${selectedSplit ? `?split=${selectedSplit}` : ''}`}
                className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-xl animate-slide-up"
              >
                <Plus className="h-6 w-6 mr-3" />
                Log Workout
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <Dumbbell className="h-32 w-32 text-white/20 animate-bounce-gentle" />
                <div className="absolute top-4 right-4 h-4 w-4 bg-success-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Plan */}
      <WorkoutPlanCard onSplitChange={setSelectedSplit} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Workouts */}
        <div className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-primary-100 rounded-xl mr-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              Last 3 Workouts
            </h2>
            <Link
              to="/workout"
              className="btn btn-ghost text-sm"
            >
              View All
            </Link>
          </div>
          
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="relative mb-6">
                <Dumbbell className="h-16 w-16 mx-auto text-gray-300 animate-bounce-gentle" />
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-warning-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg font-medium mb-2">No workout data yet</p>
              <p className="text-sm mb-4">Start your fitness journey today</p>
              <Link
                to={`/workout${selectedSplit ? `?split=${selectedSplit}` : ''}`}
                className="btn btn-primary"
              >
                Start Logging
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentWorkouts.map((workout, index) => (
                <div
                  key={workout.id}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-primary-50 hover:to-primary-100 transition-all duration-200 border border-gray-200 hover:border-primary-200"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Calendar className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatDate(workout.date)}
                      </p>
                      {workout.notes && (
                        <p className="text-sm text-gray-600 mt-1">{workout.notes}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/workout?date=${workout.date}`}
                    className="btn btn-ghost text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Records */}
        <div className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="p-2 bg-success-100 rounded-xl mr-3">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
              Last 3 Personal Records
            </h2>
            <Link
              to="/stats"
              className="btn btn-ghost text-sm"
            >
              View All
            </Link>
          </div>
          
          {personalRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="relative mb-6">
                <TrendingUp className="h-16 w-16 mx-auto text-gray-300 animate-bounce-gentle" />
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-success-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg font-medium mb-2">No personal records yet</p>
              <p className="text-sm mb-4">Start working out to build your stats</p>
              <Link
                to={`/workout${selectedSplit ? `?split=${selectedSplit}` : ''}`}
                className="btn btn-success"
              >
                Start Working Out
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {personalRecords.map((record, index) => (
                <div
                  key={record.exercise_id}
                  className="group flex items-center justify-between p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-2xl hover:from-success-100 hover:to-success-200 transition-all duration-200 border border-success-200 hover:border-success-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <TrendingUp className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{record.exercise_name}</p>
                      <p className="text-sm text-gray-600">
                        {record.max_weight} kg × {record.max_reps} reps
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success-600">
                      {record.max_weight * record.max_reps} kg
                    </p>
                    <p className="text-xs text-gray-500">Total Volume</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-warning-100 rounded-xl mr-3">
            <Plus className="h-6 w-6 text-warning-600" />
          </div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to={`/workout${selectedSplit ? `?split=${selectedSplit}` : ''}`}
            className="group flex items-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl hover:from-primary-100 hover:to-primary-200 transition-all duration-300 border border-primary-200 hover:border-primary-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="p-3 bg-primary-500 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Log Workout</p>
              <p className="text-sm text-gray-600 mt-1">Add new workout data</p>
            </div>
          </Link>
          
          <Link
            to="/exercises"
            className="group flex items-center p-6 bg-gradient-to-br from-success-50 to-success-100 rounded-2xl hover:from-success-100 hover:to-success-200 transition-all duration-300 border border-success-200 hover:border-success-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="p-3 bg-success-500 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Manage Exercises</p>
              <p className="text-sm text-gray-600 mt-1">Add or edit exercises</p>
            </div>
          </Link>
          
          <Link
            to="/stats"
            className="group flex items-center p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl hover:from-secondary-100 hover:to-secondary-200 transition-all duration-300 border border-secondary-200 hover:border-secondary-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="p-3 bg-secondary-500 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">View Stats & Charts</p>
              <p className="text-sm text-gray-600 mt-1">Track your progress</p>
            </div>
          </Link>

          <button
            onClick={() => setShowAIChat(true)}
            className="group flex items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-200 hover:border-purple-300 transform hover:scale-105 hover:shadow-lg"
          >
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">AI Coach</p>
              <p className="text-sm text-gray-600 mt-1">Get personalized advice</p>
            </div>
          </button>
        </div>
      </div>

      {/* AI Chat */}
      {showAIChat && (
        <AIChat
          userContext={{
            recentWorkouts: recentWorkouts.length,
            fitnessLevel: 'intermediate',
            goals: 'General fitness',
            preferredSplit: selectedSplit
          }}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
