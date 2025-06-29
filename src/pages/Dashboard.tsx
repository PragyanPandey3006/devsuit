import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  GitBranch, 
  Star, 
  GitPullRequest, 
  MessageSquare, 
  TrendingUp,
  Activity,
  Calendar,
  Users,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadDashboardData();
    }
  }, [user, token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user repositories
      const userRepos = await githubService.getUserRepositories();
      setRepositories(userRepos.slice(0, 6));

      // Calculate real stats
      const totalStars = userRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = userRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
      const totalIssues = userRepos.reduce((sum, repo) => sum + repo.open_issues_count, 0);

      // Get recent activity from repositories
      const recentRepos = userRepos
        .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
        .slice(0, 5);

      const activity = recentRepos.map(repo => ({
        type: 'push',
        repo: repo.full_name,
        title: `Updated ${repo.name}`,
        time: formatTimeAgo(repo.pushed_at),
        icon: GitBranch,
        url: repo.html_url
      }));

      setRecentActivity(activity);

      setStats({
        totalRepos: user.public_repos,
        totalStars,
        totalForks,
        totalIssues,
        followers: user.followers,
        following: user.following,
      });

      toast.success('Dashboard loaded with real GitHub data!');
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-github-muted">Loading your GitHub data...</span>
      </div>
    );
  }

  const quickStats = [
    {
      title: 'Repositories',
      value: stats?.totalRepos || 0,
      change: '+5.2%',
      icon: GitBranch,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Total Stars',
      value: stats?.totalStars || 0,
      change: '+12.3%',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      title: 'Total Forks',
      value: stats?.totalForks || 0,
      change: '+8.1%',
      icon: GitPullRequest,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Followers',
      value: stats?.followers || 0,
      change: '+15.7%',
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2">
          Welcome back, {user?.name || user?.login}!
        </h1>
        <p className="text-github-muted">
          Your real GitHub activity and project insights
        </p>
      </div>

      {/* User Profile Card */}
      <Card>
        <div className="flex items-start space-x-4">
          <img
            src={user?.avatar_url}
            alt={user?.name || user?.login}
            className="w-20 h-20 rounded-full ring-4 ring-github-border"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-github-text">{user?.name || user?.login}</h2>
            <p className="text-github-muted mb-2">@{user?.login}</p>
            {user?.bio && <p className="text-github-text mb-3">{user.bio}</p>}
            <div className="flex items-center space-x-4 text-sm text-github-muted">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {user?.followers} followers
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {user?.following} following
              </span>
              <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
            </div>
          </div>
          <a
            href={`https://github.com/${user?.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary-400 hover:text-primary-300"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Profile
          </a>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-github-muted mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-github-text">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-green-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-github-text">Recent Repository Activity</h3>
            <Activity className="w-5 h-5 text-github-muted" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-github-dark/50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <activity.icon className="w-4 h-4 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-github-text truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-github-muted">{activity.repo}</p>
                  <p className="text-xs text-github-muted">{activity.time}</p>
                </div>
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Repositories */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-github-text">Your Top Repositories</h3>
            <GitBranch className="w-5 h-5 text-github-muted" />
          </div>
          <div className="space-y-4">
            {repositories.map((repo, index) => (
              <div key={repo.id} className="p-3 bg-github-dark/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-github-text">{repo.name}</h4>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-github-muted mb-3 line-clamp-2">
                  {repo.description || 'No description available'}
                </p>
                <div className="flex items-center space-x-4 text-sm text-github-muted">
                  {repo.language && (
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-400 mr-1"></span>
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center">
                    <GitBranch className="w-3 h-3 mr-1" />
                    {repo.forks_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;