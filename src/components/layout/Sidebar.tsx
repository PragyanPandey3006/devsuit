import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Shield, Bot, MessageSquare, Building2, GitPullRequest, Calendar, Kanban, Code2, Zap, File as FileSync, Github, Home } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview & Stats' },
  { name: 'GitPulse', href: '/gitpulse', icon: BarChart3, description: 'Activity Visualizer' },
  { name: 'RepoAnalyzer', href: '/repo-analyzer', icon: Shield, description: 'Health Checker' },
  { name: 'AutoLabeler', href: '/auto-labeler', icon: Bot, description: 'Smart Labeling' },
  { name: 'Comment Tracker', href: '/comment-tracker', icon: MessageSquare, description: 'Track Comments' },
  { name: 'Org Stats', href: '/org-stats', icon: Building2, description: 'Organization Metrics' },
  { name: 'First PR Finder', href: '/first-pr', icon: GitPullRequest, description: 'Good First Issues' },
  { name: 'Timeline', href: '/timeline', icon: Calendar, description: 'Contribution Timeline' },
  { name: 'Issue Board', href: '/issue-board', icon: Kanban, description: 'Kanban Management' },
  { name: 'Dev Toolkit', href: '/dev-toolkit', icon: Code2, description: 'API Playground' },
  { name: 'Events', href: '/events', icon: Zap, description: 'Webhook Events' },
  { name: 'README Syncer', href: '/readme-syncer', icon: FileSync, description: 'Sync Documentation' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-github-darker border-r border-github-border flex flex-col">
      <div className="p-6 border-b border-github-border">
        <div className="flex items-center space-x-3">
          <Github className="w-8 h-8 text-github-green" />
          <div>
            <h1 className="text-xl font-bold text-github-text">Devsuit</h1>
            <p className="text-sm text-github-muted">GitHub Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-github-muted hover:text-github-text hover:bg-github-light'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive ? 'text-white' : 'text-github-muted group-hover:text-github-text'
                }`}
              />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-github-muted'}`}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;