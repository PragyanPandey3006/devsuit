import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { MessageSquare, Search, Filter, ExternalLink, Calendar, User, GitBranch } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GitCommentTracker: React.FC = () => {
  const { token, user } = useAuth();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    author: '',
    dateRange: '30',
    type: 'all', // all, issues, pulls
  });

  useEffect(() => {
    if (token) {
      loadUserRepositories();
    }
  }, [token]);

  const loadUserRepositories = async () => {
    try {
      const repos = await githubService.getUserRepositories();
      setRepositories(repos.slice(0, 20));
      // Auto-select first 3 repos
      setSelectedRepos(repos.slice(0, 3).map(repo => repo.full_name));
    } catch (error: any) {
      console.error('Failed to load repositories:', error);
      toast.error('Failed to load repositories');
    }
  };

  const trackComments = async () => {
    if (selectedRepos.length === 0) {
      toast.error('Please select at least one repository');
      return;
    }

    setLoading(true);
    try {
      const allComments: any[] = [];
      
      for (const repoName of selectedRepos) {
        const [owner, repo] = repoName.split('/');
        
        // Get issues and their comments
        const issues = await githubService.getRepositoryIssues(owner, repo, 'all');
        
        for (const issue of issues.slice(0, 10)) { // Limit to avoid rate limits
          try {
            const issueComments = await githubService.getIssueComments(owner, repo, issue.number);
            
            issueComments.forEach((comment: any) => {
              allComments.push({
                id: comment.id,
                type: 'issue',
                repository: repoName,
                issueNumber: issue.number,
                issueTitle: issue.title,
                author: comment.user.login,
                authorAvatar: comment.user.avatar_url,
                body: comment.body,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                url: comment.html_url,
                issueUrl: issue.html_url,
              });
            });
          } catch (error) {
            console.warn(`Failed to get comments for issue ${issue.number}:`, error);
          }
        }

        // Get pull requests and their comments
        try {
          const prs = await githubService.getRepositoryPullRequests(owner, repo, 'all');
          
          for (const pr of prs.slice(0, 5)) { // Limit to avoid rate limits
            try {
              const prComments = await githubService.getPullRequestComments(owner, repo, pr.number);
              
              prComments.forEach((comment: any) => {
                allComments.push({
                  id: comment.id,
                  type: 'pull_request',
                  repository: repoName,
                  prNumber: pr.number,
                  prTitle: pr.title,
                  author: comment.user.login,
                  authorAvatar: comment.user.avatar_url,
                  body: comment.body,
                  created_at: comment.created_at,
                  updated_at: comment.updated_at,
                  url: comment.html_url,
                  prUrl: pr.html_url,
                });
              });
            } catch (error) {
              console.warn(`Failed to get comments for PR ${pr.number}:`, error);
            }
          }
        } catch (error) {
          console.warn(`Failed to get PRs for ${repoName}:`, error);
        }
      }

      // Apply filters
      let filteredComments = allComments;

      if (filter.author) {
        filteredComments = filteredComments.filter(comment => 
          comment.author.toLowerCase().includes(filter.author.toLowerCase())
        );
      }

      if (filter.type !== 'all') {
        filteredComments = filteredComments.filter(comment => 
          filter.type === 'issues' ? comment.type === 'issue' : comment.type === 'pull_request'
        );
      }

      if (filter.dateRange !== 'all') {
        const days = parseInt(filter.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        filteredComments = filteredComments.filter(comment => 
          new Date(comment.created_at) >= cutoffDate
        );
      }

      // Sort by creation date (newest first)
      filteredComments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setComments(filteredComments);
      toast.success(`Found ${filteredComments.length} comments across ${selectedRepos.length} repositories`);
    } catch (error: any) {
      console.error('Failed to track comments:', error);
      toast.error('Failed to track comments');
    } finally {
      setLoading(false);
    }
  };

  const toggleRepository = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName) 
        ? prev.filter(name => name !== repoName)
        : [...prev, repoName]
    );
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

  const getCommentPreview = (body: string) => {
    return body.length > 200 ? body.substring(0, 200) + '...' : body;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-primary-500" />
          Comment Tracker - Cross-Repository Comments
        </h1>
        <p className="text-github-muted">
          Track and analyze comments across multiple repositories in real-time
        </p>
      </div>

      {/* Repository Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4">Select Repositories to Track</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {repositories.map(repo => (
            <div
              key={repo.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedRepos.includes(repo.full_name)
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-github-border bg-github-dark/30 hover:border-github-border/70'
              }`}
              onClick={() => toggleRepository(repo.full_name)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-github-text">{repo.name}</div>
                  <div className="text-sm text-github-muted">{repo.open_issues_count} open issues</div>
                </div>
                <div className={`w-4 h-4 rounded border-2 ${
                  selectedRepos.includes(repo.full_name)
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-github-border'
                }`}>
                  {selectedRepos.includes(repo.full_name) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-sm text-github-muted">
          Selected: {selectedRepos.length} repositories
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Author</label>
            <input
              type="text"
              value={filter.author}
              onChange={(e) => setFilter(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Filter by author username"
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text placeholder-github-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Date Range</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All comments</option>
              <option value="issues">Issue comments</option>
              <option value="pulls">PR comments</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={trackComments}
            loading={loading}
            leftIcon={<Search className="w-4 h-4" />}
            disabled={selectedRepos.length === 0}
          >
            Track Comments
          </Button>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Tracking comments across repositories...</span>
          </div>
        </Card>
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-github-text">
              Found {comments.length} Comments
            </h3>
            <div className="text-sm text-github-muted">
              Across {selectedRepos.length} repositories
            </div>
          </div>
          
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-github-dark/30 rounded-lg border border-github-border/50">
                <div className="flex items-start space-x-3">
                  <img
                    src={comment.authorAvatar}
                    alt={comment.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-github-text">{comment.author}</span>
                      <span className="text-sm text-github-muted">commented</span>
                      <span className="text-sm text-github-muted">{formatTimeAgo(comment.created_at)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comment.type === 'issue' 
                          ? 'bg-green-400/20 text-green-400' 
                          : 'bg-blue-400/20 text-blue-400'
                      }`}>
                        {comment.type === 'issue' ? 'Issue' : 'PR'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 text-sm text-github-muted mb-1">
                        <GitBranch className="w-4 h-4" />
                        <span>{comment.repository}</span>
                        <span>•</span>
                        <a
                          href={comment.type === 'issue' ? comment.issueUrl : comment.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300"
                        >
                          #{comment.type === 'issue' ? comment.issueNumber : comment.prNumber} {comment.type === 'issue' ? comment.issueTitle : comment.prTitle}
                        </a>
                      </div>
                    </div>

                    <div className="bg-github-dark/50 rounded-lg p-3 mb-3">
                      <p className="text-github-text text-sm whitespace-pre-wrap">
                        {getCommentPreview(comment.body)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-github-muted">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {comment.updated_at !== comment.created_at && (
                          <span>Updated {formatTimeAgo(comment.updated_at)}</span>
                        )}
                      </div>
                      <a
                        href={comment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-400 hover:text-primary-300 text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Comment
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statistics */}
      {comments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">{comments.length}</div>
              <div className="text-sm text-github-muted">Total Comments</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {new Set(comments.map(c => c.author)).size}
              </div>
              <div className="text-sm text-github-muted">Unique Authors</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {comments.filter(c => c.type === 'issue').length}
              </div>
              <div className="text-sm text-github-muted">Issue Comments</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {comments.filter(c => c.type === 'pull_request').length}
              </div>
              <div className="text-sm text-github-muted">PR Comments</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GitCommentTracker;