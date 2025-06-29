import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import GitPulse from './pages/GitPulse';
import RepoAnalyzer from './pages/RepoAnalyzer';
import AutoLabeler from './pages/AutoLabeler';
import GitCommentTracker from './pages/GitCommentTracker';
import OrgStats from './pages/OrgStats';
import FirstPRFinder from './pages/FirstPRFinder';
import TimelineVisualizer from './pages/TimelineVisualizer';
import IssueBoard from './pages/IssueBoard';
import DevToolkit from './pages/DevToolkit';
import OpenSourceEvents from './pages/OpenSourceEvents';
import ReadmeSyncer from './pages/ReadmeSyncer';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-github-dark text-github-text">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#21262d',
                color: '#e6edf3',
                border: '1px solid #30363d',
              },
            }}
          />
          <Routes>
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/gitpulse" element={<GitPulse />} />
                      <Route path="/repo-analyzer" element={<RepoAnalyzer />} />
                      <Route path="/auto-labeler" element={<AutoLabeler />} />
                      <Route path="/comment-tracker" element={<GitCommentTracker />} />
                      <Route path="/org-stats" element={<OrgStats />} />
                      <Route path="/first-pr" element={<FirstPRFinder />} />
                      <Route path="/timeline" element={<TimelineVisualizer />} />
                      <Route path="/issue-board" element={<IssueBoard />} />
                      <Route path="/dev-toolkit" element={<DevToolkit />} />
                      <Route path="/events" element={<OpenSourceEvents />} />
                      <Route path="/readme-syncer" element={<ReadmeSyncer />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;