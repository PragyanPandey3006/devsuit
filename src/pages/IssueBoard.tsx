import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Kanban, Plus, ExternalLink, User, Calendar, Tag, Filter } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const IssueBoard: React.FC = () => {
  const { token } = useAuth();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    assignee: '',
    label: '',
    milestone: '',
  });

  const columns = [
    { id: 'open', title: 'Open', color: 'border-green-500' },
    { id: 'in_progress', title: 'In Progress', color: 'border-yellow-500' },
    { id: 'review', title: 'In Review', color: 'border-blue-500' },
    { id: 'closed', title: 'Closed', color: 'border-gray-500' },
  ];

  useEffect(() => {
    if (token) {
      loadUserRepositories();
    }
  }, [token]);

  const loadUserRepositories = async () => {
    try {
      const repos = await githubService.getUserRepositories();
      setRepositories(repos.slice(0, 10));
      // Auto-select first 3 repos
      setSelectedRepos(repos.slice(0, 3).map(repo => repo.full_name));
    } catch (error: any) {
      console.error('Failed to load repositories:', error);
      toast.error('Failed to load repositories');
    }
  };

  const loadIssues = async () => {
    if (selectedRepos.length === 0) {
      toast.error('Please select at least one repository');
      return;
    }

    setLoading(true);
    try {
      const allIssues: any[] = [];
      
      for (const repoName of selectedRepos) {
        const [owner, repo] = repoName.split('/');
        const repoIssues = await githubService.getRepositoryIssues(owner, repo, 'all');
        
        repoIssues.forEach((issue: any) => {
          // Categorize issues based on labels and state
          let status = 'open';
          
          if (issue.state === 'closed') {
            status = 'closed';
          } else {
            const labels = issue.labels.map((label: any) => label.name.toLowerCase());
            
            if (labels.some(label => label.includes('progress') || label.includes('working'))) {
              status = 'in_progress';
            } else if (labels.some(label => label.includes('review') || label.includes('ready'))) {
              status = 'review';
            }
          }

          allIssues.push({
            ...issue,
            repository: repoName,
            status,
            kanbanId: `${repoName}-${issue.number}`,
          });
        });
      }

      // Apply filters
      let filteredIssues = allIssues;

      if (filter.assignee) {
        filteredIssues = filteredIssues.filter(issue => 
          issue.assignee?.login.toLowerCase().includes(filter.assignee.toLowerCase()) ||
          issue.assignees?.some((assignee: any) => 
            assignee.login.toLowerCase().includes(filter.assignee.toLowerCase())
          )
        );
      }

      if (filter.label) {
        filteredIssues = filteredIssues.filter(issue =>
          issue.labels.some((label: any) => 
            label.name.toLowerCase().includes(filter.label.toLowerCase())
          )
        );
      }

      setIssues(filteredIssues);
      toast.success(`Loaded ${filteredIssues.length} issues from ${selectedRepos.length} repositories`);
    } catch (error: any) {
      console.error('Failed to load issues:', error);
      toast.error('Failed to load issues');
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

  const getIssuesByStatus = (status: string) => {
    return issues.filter(issue => issue.status === status);
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

  const getPriorityColor = (labels: any[]) => {
    const priorityLabels = labels.filter(label => 
      label.name.toLowerCase().includes('priority') || 
      label.name.toLowerCase().includes('urgent') ||
      label.name.toLowerCase().includes('critical')
    );
    
    if (priorityLabels.some(label => label.name.toLowerCase().includes('critical'))) {
      return 'border-l-red-500';
    }
    if (priorityLabels.some(label => label.name.toLowerCase().includes('high'))) {
      return 'border-l-orange-500';
    }
    if (priorityLabels.some(label => label.name.toLowerCase().includes('medium'))) {
      return 'border-l-yellow-500';
    }
    return 'border-l-gray-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <Kanban className="w-8 h-8 mr-3 text-primary-500" />
          Issue Board - Kanban Management
        </h1>
        <p className="text-github-muted">
          Manage issues across multiple repositories with a visual Kanban board
        </p>
      </div>

      {/* Repository Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4">Select Repositories</h3>
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
      </Card>

      {/* Filters */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Assignee</label>
            <input
              type="text"
              value={filter.assignee}
              onChange={(e) => setFilter(prev => ({ ...prev, assignee: e.target.value }))}
              placeholder="Filter by assignee"
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text placeholder-github-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Label</label>
            <input
              type="text"
              value={filter.label}
              onChange={(e) => setFilter(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Filter by label"
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text placeholder-github-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={loadIssues}
              loading={loading}
              leftIcon={<Kanban className="w-4 h-4" />}
              disabled={selectedRepos.length === 0}
            >
              Load Issues
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Loading issues for Kanban board...</span>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      {issues.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map(column => {
            const columnIssues = getIssuesByStatus(column.id);
            
            return (
              <Card key={column.id} className={`border-t-4 ${column.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-github-text">{column.title}</h3>
                  <span className="bg-github-border text-github-text px-2 py-1 rounded-full text-sm">
                    {columnIssues.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {columnIssues.map(issue => (
                    <div
                      key={issue.kanbanId}
                      className={`p-3 bg-github-dark/50 rounded-lg border-l-4 ${getPriorityColor(issue.labels)} hover:bg-github-dark/70 transition-colors cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-github-text text-sm line-clamp-2">
                          {issue.title}
                        </h4>
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 ml-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-github-muted mb-2">
                        <span>#{issue.number}</span>
                        <span>•</span>
                        <span>{issue.repository.split('/')[1]}</span>
                      </div>

                      {/* Labels */}
                      {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {issue.labels.slice(0, 3).map((label: any) => (
                            <span
                              key={label.id}
                              className="px-2 py-1 text-xs rounded-full"
                              style={{
                                backgroundColor: `#${label.color}20`,
                                color: `#${label.color}`,
                                border: `1px solid #${label.color}40`
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                          {issue.labels.length > 3 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-github-border text-github-muted">
                              +{issue.labels.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-github-muted">
                        <div className="flex items-center space-x-2">
                          {issue.assignee && (
                            <div className="flex items-center">
                              <img
                                src={issue.assignee.avatar_url}
                                alt={issue.assignee.login}
                                className="w-4 h-4 rounded-full mr-1"
                              />
                              <span>{issue.assignee.login}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatTimeAgo(issue.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Statistics */}
      {issues.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">{issues.length}</div>
              <div className="text-sm text-github-muted">Total Issues</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {getIssuesByStatus('open').length}
              </div>
              <div className="text-sm text-github-muted">Open</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {getIssuesByStatus('in_progress').length}
              </div>
              <div className="text-sm text-github-muted">In Progress</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {getIssuesByStatus('closed').length}
              </div>
              <div className="text-sm text-github-muted">Closed</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IssueBoard;