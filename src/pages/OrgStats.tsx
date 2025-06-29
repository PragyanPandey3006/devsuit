import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Building2, Search, Users, GitBranch, Star, AlertCircle, ExternalLink } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OrgStats: React.FC = () => {
  const { token } = useAuth();
  const [orgInput, setOrgInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!orgInput.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    if (!token) {
      toast.error('Please authenticate with GitHub first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [organization, members, repositories] = await Promise.all([
        githubService.getOrganization(orgInput.trim()),
        githubService.getOrganizationMembers(orgInput.trim()),
        githubService.getOrganizationRepositories(orgInput.trim()),
      ]);

      // Calculate stats
      const totalStars = repositories.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);
      const totalForks = repositories.reduce((sum: number, repo: any) => sum + repo.forks_count, 0);
      const languages = repositories.reduce((acc: any, repo: any) => {
        if (repo.language) {
          acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
      }, {});

      const topLanguages = Object.entries(languages)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      const topRepos = repositories
        .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10);

      setOrgData({
        organization,
        members,
        repositories,
        stats: {
          totalRepos: repositories.length,
          totalMembers: members.length,
          totalStars,
          totalForks,
          topLanguages,
          topRepos,
        }
      });

      toast.success('Organization analyzed successfully!');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error.message || 'Failed to analyze organization';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <Building2 className="w-8 h-8 mr-3 text-primary-500" />
          Organization Stats - Comprehensive Analytics
        </h1>
        <p className="text-github-muted">
          Analyze GitHub organizations with real member data, repository insights, and team metrics
        </p>
      </div>

      {/* Organization Input */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="org-input" className="block text-sm font-medium text-github-text mb-2">
              Organization Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-github-muted w-4 h-4" />
              <input
                id="org-input"
                type="text"
                value={orgInput}
                onChange={(e) => setOrgInput(e.target.value)}
                placeholder="e.g., microsoft, facebook, google"
                className="w-full pl-10 pr-4 py-2 bg-github-dark border border-github-border rounded-lg text-github-text placeholder-github-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAnalyze}
              loading={loading}
              leftIcon={<Building2 className="w-4 h-4" />}
              className="whitespace-nowrap"
              disabled={!token}
            >
              Analyze Organization
            </Button>
          </div>
        </div>
        {!token && (
          <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-400 text-sm">Please authenticate with GitHub to analyze organizations</span>
          </div>
        )}
      </Card>

      {error && (
        <Card>
          <div className="flex items-center text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Analyzing organization...</span>
          </div>
        </Card>
      )}

      {orgData && (
        <>
          {/* Organization Overview */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <img
                  src={orgData.organization.avatar_url}
                  alt={orgData.organization.login}
                  className="w-16 h-16 rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-github-text mb-2">
                    {orgData.organization.name || orgData.organization.login}
                  </h3>
                  <p className="text-github-muted mb-4">
                    {orgData.organization.description || 'No description available'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-github-muted">
                    <span>Created: {new Date(orgData.organization.created_at).toLocaleDateString()}</span>
                    <span>Location: {orgData.organization.location || 'Not specified'}</span>
                    {orgData.organization.blog && (
                      <a href={orgData.organization.blog} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <a
                href={orgData.organization.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-primary-400 hover:text-primary-300 text-sm whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View on GitHub
              </a>
            </div>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Repositories</p>
                  <p className="text-2xl font-bold text-github-text">{orgData.stats.totalRepos}</p>
                </div>
                <GitBranch className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Members</p>
                  <p className="text-2xl font-bold text-github-text">{orgData.stats.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Total Stars</p>
                  <p className="text-2xl font-bold text-github-text">{orgData.stats.totalStars.toLocaleString()}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Total Forks</p>
                  <p className="text-2xl font-bold text-github-text">{orgData.stats.totalForks.toLocaleString()}</p>
                </div>
                <GitBranch className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </div>

          {/* Top Languages */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Top Languages</h3>
            <div className="space-y-3">
              {orgData.stats.topLanguages.map((language: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index] }}
                    />
                    <span className="text-github-text font-medium">{language.name}</span>
                  </div>
                  <span className="text-github-muted">{language.count} repositories</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Repositories */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Top Repositories</h3>
            <div className="space-y-4">
              {orgData.stats.topRepos.map((repo: any) => (
                <div key={repo.id} className="flex items-center justify-between p-4 bg-github-dark/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-github-text">{repo.name}</h4>
                      {repo.private && (
                        <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 text-xs rounded">Private</span>
                      )}
                    </div>
                    <p className="text-sm text-github-muted mb-2">{repo.description || 'No description'}</p>
                    <div className="flex items-center space-x-4 text-sm text-github-muted">
                      {repo.language && (
                        <span className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-blue-400 mr-1"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {repo.stargazers_count.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <GitBranch className="w-3 h-3 mr-1" />
                        {repo.forks_count.toLocaleString()}
                      </span>
                      <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-400 hover:text-primary-300 text-sm ml-4"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </a>
                </div>
              ))}
            </div>
          </Card>

          {/* Members */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Organization Members</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {orgData.members.slice(0, 24).map((member: any) => (
                <div key={member.id} className="text-center">
                  <img
                    src={member.avatar_url}
                    alt={member.login}
                    className="w-16 h-16 rounded-full mx-auto mb-2"
                  />
                  <p className="text-sm font-medium text-github-text truncate">{member.login}</p>
                  <a
                    href={member.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    View Profile
                  </a>
                </div>
              ))}
            </div>
            {orgData.members.length > 24 && (
              <div className="mt-4 text-center">
                <p className="text-github-muted">
                  Showing 24 of {orgData.members.length} members
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default OrgStats;