import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Settings, ExternalLink, BookOpen } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-github-darker border-b border-github-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-github-text">
            Welcome back, {user?.name || user?.login}
          </h2>
          <p className="text-sm text-github-muted">
            Professional GitHub developer dashboard with real API integration
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/blog.html"
            target="_blank"
            className="p-2 text-github-muted hover:text-github-text hover:bg-github-light rounded-lg transition-colors"
            title="Read Blog Post"
          >
            <BookOpen className="w-5 h-5" />
          </a>

          <a
            href="mailto:pragyanpandeydeveloper@gmail.com"
            className="p-2 text-github-muted hover:text-github-text hover:bg-github-light rounded-lg transition-colors"
            title="Contact Support"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          
          <button className="p-2 text-github-muted hover:text-github-text hover:bg-github-light rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-github-muted hover:text-github-text hover:bg-github-light rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar_url}
              alt={user?.name || user?.login}
              className="w-8 h-8 rounded-full ring-2 ring-github-border"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-github-text">{user?.name}</p>
              <p className="text-xs text-github-muted">@{user?.login}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-github-muted hover:text-red-400 hover:bg-github-light rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;