import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search, BarChart3, PieChart, Users, GitCommit, AlertCircle, ExternalLink, Star, GitBranch } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const GitPulse: React.FC = () => {
  const { token } = useAuth();
  const [repoInput, setRepoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const parseRepoUrl = (input: string) => {
    // Handle GitHub URLs
    if (input.includes('github.com')) {
      const match = input.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return `${match[1]}/${match[2]}`;
      }
    }
    // Handle owner/repo format
    return input;
  };

  const handleAnalyze = async () => {
    if (!repoInput.trim()) {
      toast.error('Please enter a repository name or URL');
      return;
    }

    if (!token) {
      toast.error('Please authenticate with GitHub first');
      return;
    }

    const repoPath = parseRepoUrl(repoInput.trim());
    const [owner, repo] = repoPath.split('/');
    
    if (!owner || !repo) {
      toast.error('Please use the format: owner/repository or paste a GitHub URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Analyzing repository: ${owner}/${repo}`);
      
      // Fetch repository data
      const [repository, contributors, languages, commits, issues, prs] = await Promise.all([
        githubService.getRepository(owner, repo),
        githubService.getRepositoryContributors(owner, repo),
        githubService.getRepositoryLanguages(owner, repo),
        githubService.getRepositoryCommits(owner, repo).catch(() => []),
        githubService.getRepositoryIssues(owner, repo, 'all').catch(() => []),
        githubService.getRepositoryPullRequests(owner, repo, 'all').catch(() => []),
      ]);

      console.log('Repository data fetched successfully');

      // Process language data
      const totalBytes = Object.values(languages).reduce((sum: number, bytes: any) => sum + bytes, 0);
      const languageData = Object.entries(languages)
        .map(([name, bytes]: [string, any]) => ({
          name,
          percentage: ((bytes / totalBytes) * 100).toFixed(1),
          bytes
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 8);

      // Get recent commits for activity analysis
      const recentCommits = commits.slice(0, 100);
      const commitsByAuthor = recentCommits.reduce((acc: any, commit: any) => {
        const author = commit.author?.login || commit.commit.author.name;
        if (!acc[author]) {
          acc[author] = 0;
        }
        acc[author]++;
        return acc;
      }, {});

      // Merge contributor data with commit data
      const enrichedContributors = contributors.slice(0, 15).map((contributor: any) => ({
        ...contributor,
        recentCommits: commitsByAuthor[contributor.login] || 0,
      }));

      // Calculate activity metrics
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentIssues = issues.filter((issue: any) => new Date(issue.created_at) > oneMonthAgo);
      const recentPRs = prs.filter((pr: any) => new Date(pr.created_at) > oneMonthAgo);

      const analyticsResult = {
        repo: `${owner}/${repo}`,
        repository,
        contributors: enrichedContributors,
        totalCommits: recentCommits.length,
        totalContributors: contributors.length,
        languages: languageData,
        activity: {
          recentIssues: recentIssues.length,
          recentPRs: recentPRs.length,
          totalIssues: issues.length,
          totalPRs: prs.length,
        },
        stats: {
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          openIssues: repository.open_issues_count,
          size: repository.size,
          createdAt: repository.created_at,
          updatedAt: repository.updated_at,
          pushedAt: repository.pushed_at,
        }
      };

      setAnalyticsData(analyticsResult);
      toast.success('Repository analyzed successfully!');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error.message || 'Failed to analyze repository';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const contributorBarData = analyticsData ? {
    labels: analyticsData.contributors.map((c: any) => c.login),
    datasets: [
      {
        label: 'Total Contributions',
        data: analyticsData.contributors.map((c: any) => c.contributions),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Recent Commits',
        data: analyticsData.contributors.map((c: any) => c.recentCommits),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const languagePieData = analyticsData ? {
    labels: analyticsData.languages.map((l: any) => l.name),
    datasets: [
      {
        data: analyticsData.languages.map((l: any) => parseFloat(l.percentage)),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ],
        borderColor: '#21262d',
        borderWidth: 2,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e6edf3',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#e6edf3',
        bodyColor: '#e6edf3',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: '#374151',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e6edf3',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#e6edf3',
        bodyColor: '#e6edf3',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-primary-500" />
          GitPulse - Contributor Activity Visualizer
        </h1>
        <p className="text-github-muted">
          Analyze real contributor activity, commits, and repository insights with live GitHub data
        </p>
      </div>

      {/* Repository Input */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="repo-input" className="block text-sm font-medium text-github-text mb-2">
              Repository (owner/repo or GitHub URL)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-github-muted w-4 h-4" />
              <input
                id="repo-input"
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g., facebook/react or https://github.com/facebook/react"
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
              leftIcon={<BarChart3 className="w-4 h-4" />}
              className="whitespace-nowrap"
              disabled={!token}
            >
              Analyze Repository
            </Button>
          </div>
        </div>
        {!token && (
          <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-400 text-sm">Please authenticate with GitHub to analyze repositories</span>
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
            <span className="ml-3 text-github-muted">Analyzing repository...</span>
          </div>
        </Card>
      )}

      {analyticsData && (
        <>
          {/* Repository Info */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-github-text mb-2">
                  {analyticsData.repository.full_name}
                </h3>
                <p className="text-github-muted mb-4">
                  {analyticsData.repository.description || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-github-muted">
                  <span>Created: {formatDate(analyticsData.repository.created_at)}</span>
                  <span>Updated: {formatDate(analyticsData.repository.updated_at)}</span>
                  <span>Last Push: {getDaysAgo(analyticsData.repository.pushed_at)} days ago</span>
                  <span>Language: {analyticsData.repository.language || 'Multiple'}</span>
                  <span>Size: {(analyticsData.repository.size / 1024).toFixed(1)} MB</span>
                </div>
              </div>
              <a
                href={analyticsData.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-primary-400 hover:text-primary-300 text-sm whitespace-nowrap ml-4"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View on GitHub
              </a>
            </div>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Stars</p>
                  <p className="text-2xl font-bold text-github-text">{analyticsData.stats.stars.toLocaleString()}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Forks</p>
                  <p className="text-2xl font-bold text-github-text">{analyticsData.stats.forks.toLocaleString()}</p>
                </div>
                <GitBranch className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Contributors</p>
                  <p className="text-2xl font-bold text-github-text">{analyticsData.totalContributors}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Open Issues</p>
                  <p className="text-2xl font-bold text-github-text">{analyticsData.stats.openIssues}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </Card>
          </div>

          {/* Activity Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <div className="text-center">
                <div className="text-lg font-bold text-github-text">{analyticsData.activity.recentIssues}</div>
                <div className="text-sm text-github-muted">Issues (30 days)</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-lg font-bold text-github-text">{analyticsData.activity.recentPRs}</div>
                <div className="text-sm text-github-muted">PRs (30 days)</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-lg font-bold text-github-text">{analyticsData.activity.totalIssues}</div>
                <div className="text-sm text-github-muted">Total Issues</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-lg font-bold text-github-text">{analyticsData.activity.totalPRs}</div>
                <div className="text-sm text-github-muted">Total PRs</div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-github-text">Contributor Activity</h3>
                <BarChart3 className="w-5 h-5 text-github-muted" />
              </div>
              {contributorBarData && (
                <div className="h-80">
                  <Bar data={contributorBarData} options={chartOptions} />
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-github-text">Language Distribution</h3>
                <PieChart className="w-5 h-5 text-github-muted" />
              </div>
              {languagePieData && (
                <div className="h-80">
                  <Pie data={languagePieData} options={pieOptions} />
                </div>
              )}
            </Card>
          </div>

          {/* Contributors Table */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Top Contributors</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-github-border">
                    <th className="text-left py-3 px-4 text-github-muted font-medium">Contributor</th>
                    <th className="text-left py-3 px-4 text-github-muted font-medium">Total Contributions</th>
                    <th className="text-left py-3 px-4 text-github-muted font-medium">Recent Commits</th>
                    <th className="text-left py-3 px-4 text-github-muted font-medium">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.contributors.map((contributor: any, index: number) => (
                    <tr key={contributor.id} className="border-b border-github-border/50 hover:bg-github-dark/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={contributor.avatar_url}
                            alt={contributor.login}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-github-text font-medium">{contributor.login}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-github-text">{contributor.contributions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-github-text">{contributor.recentCommits}</td>
                      <td className="py-3 px-4">
                        <a
                          href={contributor.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-400 hover:text-primary-300 text-sm"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Profile
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Language Breakdown */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Language Breakdown</h3>
            <div className="space-y-3">
              {analyticsData.languages.map((language: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index] }}
                    />
                    <span className="text-github-text font-medium">{language.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-github-muted text-sm">{language.percentage}%</span>
                    <span className="text-github-muted text-xs">({(language.bytes / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default GitPulse;