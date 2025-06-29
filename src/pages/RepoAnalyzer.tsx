import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search, Shield, CheckCircle, XCircle, AlertCircle, Star, GitBranch, Users, Calendar } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation?: string;
}

const RepoAnalyzer: React.FC = () => {
  const { token } = useAuth();
  const [repoInput, setRepoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!repoInput.trim()) {
      toast.error('Please enter a repository name');
      return;
    }

    if (!token) {
      toast.error('Please authenticate with GitHub first');
      return;
    }

    const [owner, repo] = repoInput.split('/');
    if (!owner || !repo) {
      toast.error('Please use the format: owner/repository');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await githubService.analyzeRepositoryHealth(owner, repo);
      setAnalysisResult(analysis);
      toast.success('Repository health analyzed successfully!');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error.message || 'Failed to analyze repository';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
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
          <Shield className="w-8 h-8 mr-3 text-primary-500" />
          RepoAnalyzer - Repository Health Checker
        </h1>
        <p className="text-github-muted">
          Analyze real repository health with automated scoring and actionable recommendations
        </p>
      </div>

      {/* Repository Input */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="repo-input" className="block text-sm font-medium text-github-text mb-2">
              Repository (owner/repo)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-github-muted w-4 h-4" />
              <input
                id="repo-input"
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g., microsoft/vscode"
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
              leftIcon={<Shield className="w-4 h-4" />}
              className="whitespace-nowrap"
              disabled={!token}
            >
              Analyze Health
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
            <span className="ml-3 text-github-muted">Analyzing repository health...</span>
          </div>
        </Card>
      )}

      {analysisResult && (
        <>
          {/* Repository Overview */}
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-github-text mb-2">
                  {analysisResult.repository.full_name}
                </h3>
                <p className="text-github-muted mb-4">
                  {analysisResult.repository.description || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-github-muted">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {formatDate(analysisResult.repository.created_at)}
                  </div>
                  <div className="flex items-center">
                    <GitBranch className="w-4 h-4 mr-1" />
                    Updated {getDaysAgo(analysisResult.repository.pushed_at)} days ago
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#3178c6' }}></span>
                    {analysisResult.repository.language || 'Multiple languages'}
                  </div>
                </div>
              </div>
              <a
                href={analysisResult.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 text-sm whitespace-nowrap ml-4"
              >
                View on GitHub →
              </a>
            </div>
          </Card>

          {/* Health Score and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="w-32 h-32 rounded-full border-8 border-github-border flex items-center justify-center relative overflow-hidden">
                    <div className="text-center z-10">
                      <div className={`text-3xl font-bold ${getScoreColor(analysisResult.healthScore)}`}>
                        {analysisResult.healthScore}
                      </div>
                      <div className="text-sm text-github-muted">Health Score</div>
                    </div>
                    <div 
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${getScoreBackground(analysisResult.healthScore)} opacity-20`}
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + (analysisResult.healthScore / 100) * 50}% 0%, 50% 50%)`,
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-github-text mb-2">Overall Health</h3>
                <p className="text-github-muted">
                  {analysisResult.healthScore >= 80 ? 'Excellent - Well maintained repository' : 
                   analysisResult.healthScore >= 60 ? 'Good - Some areas for improvement' : 
                   'Needs Improvement - Several issues to address'}
                </p>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-github-text mb-4">Repository Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-github-dark/50 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-github-text">{analysisResult.stats.stars.toLocaleString()}</div>
                  <div className="text-sm text-github-muted">Stars</div>
                </div>
                <div className="text-center p-3 bg-github-dark/50 rounded-lg">
                  <GitBranch className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-github-text">{analysisResult.stats.forks.toLocaleString()}</div>
                  <div className="text-sm text-github-muted">Forks</div>
                </div>
                <div className="text-center p-3 bg-github-dark/50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-github-text">{analysisResult.stats.openIssues}</div>
                  <div className="text-sm text-github-muted">Open Issues</div>
                </div>
                <div className="text-center p-3 bg-github-dark/50 rounded-lg">
                  <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-github-text">{analysisResult.stats.contributors}</div>
                  <div className="text-sm text-github-muted">Contributors</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Health Checks */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Health Checks</h3>
            <div className="space-y-4">
              {analysisResult.checks.map((check: HealthCheck, index: number) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-github-dark/30 border border-github-border/50">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-github-text">{check.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        check.status === 'pass' ? 'bg-green-400/20 text-green-400' :
                        check.status === 'warning' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-github-muted mb-2">{check.description}</p>
                    {check.recommendation && (
                      <div className="bg-primary-600/10 border border-primary-600/20 rounded-lg p-3">
                        <p className="text-sm text-primary-400">
                          <strong>💡 Recommendation:</strong> {check.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Contributors */}
          {analysisResult.contributors && analysisResult.contributors.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-github-text mb-6">Top Contributors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResult.contributors.slice(0, 6).map((contributor: any) => (
                  <div key={contributor.id} className="flex items-center space-x-3 p-3 bg-github-dark/30 rounded-lg">
                    <img
                      src={contributor.avatar_url}
                      alt={contributor.login}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-github-text truncate">{contributor.login}</p>
                      <p className="text-xs text-github-muted">{contributor.contributions} contributions</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Summary & Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-4">Summary & Recommendations</h3>
            <div className="bg-github-dark/50 rounded-lg p-4 border border-github-border/50">
              <p className="text-github-text mb-4">
                <strong>{analysisResult.repository.full_name}</strong> has a health score of{' '}
                <span className={`font-bold ${getScoreColor(analysisResult.healthScore)}`}>
                  {analysisResult.healthScore}/100
                </span>. 
              </p>
              
              {analysisResult.healthScore < 80 && (
                <div className="space-y-2">
                  <p className="text-github-text font-medium mb-2">Priority improvements:</p>
                  <ul className="list-disc list-inside space-y-1 text-github-muted text-sm">
                    {analysisResult.checks
                      .filter((check: HealthCheck) => check.status === 'fail' || check.status === 'warning')
                      .slice(0, 3)
                      .map((check: HealthCheck, index: number) => (
                        <li key={index}>{check.recommendation || check.description}</li>
                      ))}
                  </ul>
                </div>
              )}

              {analysisResult.healthScore >= 80 && (
                <p className="text-green-400">
                  🎉 Excellent! This repository follows best practices and is well-maintained.
                </p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default RepoAnalyzer;