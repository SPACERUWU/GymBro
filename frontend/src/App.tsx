import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutLog from './pages/WorkoutLog';
import ExerciseManagement from './pages/ExerciseManagement';
import Stats from './pages/Stats';
import WorkoutPlanning from './pages/WorkoutPlanning';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<WorkoutLog />} />
            <Route path="/exercises" element={<ExerciseManagement />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/planning" element={<WorkoutPlanning />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;
