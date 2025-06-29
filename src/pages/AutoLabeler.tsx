import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Bot, Settings, Zap, Tag, CheckCircle, AlertCircle, ExternalLink, GitBranch } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AutoLabeler: React.FC = () => {
  const { token, user } = useAuth();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [labelingRules, setLabelingRules] = useState([
    {
      id: 1,
      keyword: 'bug',
      label: 'bug',
      color: '#d73a49',
      description: 'Issues reporting bugs or errors',
      active: true,
    },
    {
      id: 2,
      keyword: 'feature',
      label: 'enhancement',
      color: '#28a745',
      description: 'New feature requests',
      active: true,
    },
    {
      id: 3,
      keyword: 'documentation',
      label: 'documentation',
      color: '#0366d6',
      description: 'Documentation improvements',
      active: true,
    },
    {
      id: 4,
      keyword: 'performance',
      label: 'performance',
      color: '#f66a0a',
      description: 'Performance-related issues',
      active: true,
    },
    {
      id: 5,
      keyword: 'security',
      label: 'security',
      color: '#6f42c1',
      description: 'Security vulnerabilities',
      active: true,
    },
  ]);

  useEffect(() => {
    if (token) {
      loadUserRepositories();
    }
  }, [token]);

  const loadUserRepositories = async () => {
    try {
      const repos = await githubService.getUserRepositories();
      setRepositories(repos.slice(0, 20));
    } catch (error: any) {
      console.error('Failed to load repositories:', error);
      toast.error('Failed to load repositories');
    }
  };

  const analyzeRepositoryIssues = async () => {
    if (!selectedRepo || !token) {
      toast.error('Please select a repository');
      return;
    }

    setLoading(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const issues = await githubService.getRepositoryIssues(owner, repo, 'all');
      
      // Analyze issues for potential labeling
      const analyzedIssues = issues.slice(0, 10).map((issue: any) => {
        const suggestedLabels = analyzeIssueContent(issue.title, issue.body || '');
        const confidence = calculateConfidence(issue.title, issue.body || '');
        
        return {
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body?.substring(0, 200) + '...',
          url: issue.html_url,
          currentLabels: issue.labels,
          suggestedLabels,
          confidence,
          created_at: issue.created_at,
          user: issue.user,
        };
      });

      setRecentActivity(analyzedIssues);
      toast.success(`Analyzed ${analyzedIssues.length} issues for auto-labeling`);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze repository issues');
    } finally {
      setLoading(false);
    }
  };

  const analyzeIssueContent = (title: string, body: string) => {
    const content = `${title} ${body}`.toLowerCase();
    const suggestedLabels: string[] = [];

    labelingRules.forEach(rule => {
      if (rule.active && content.includes(rule.keyword.toLowerCase())) {
        suggestedLabels.push(rule.label);
      }
    });

    // Additional intelligent analysis
    if (content.includes('crash') || content.includes('error') || content.includes('broken')) {
      if (!suggestedLabels.includes('bug')) suggestedLabels.push('bug');
    }
    
    if (content.includes('slow') || content.includes('memory') || content.includes('cpu')) {
      if (!suggestedLabels.includes('performance')) suggestedLabels.push('performance');
    }

    if (content.includes('ui') || content.includes('design') || content.includes('style')) {
      suggestedLabels.push('ui/ux');
    }

    if (content.includes('test') || content.includes('testing')) {
      suggestedLabels.push('testing');
    }

    return suggestedLabels.length > 0 ? suggestedLabels : ['needs-triage'];
  };

  const calculateConfidence = (title: string, body: string) => {
    const content = `${title} ${body}`.toLowerCase();
    const totalWords = content.split(/\s+/).length;
    const relevantWords = content.match(/\b(bug|feature|fix|add|improve|update|error|issue|enhancement|documentation)\b/g) || [];
    
    const baseConfidence = Math.min(95, Math.max(60, Math.round((relevantWords.length / totalWords) * 100 * 10)));
    
    // Boost confidence for clear indicators
    if (content.includes('bug report') || content.includes('feature request')) {
      return Math.min(95, baseConfidence + 15);
    }
    
    return baseConfidence;
  };

  const toggleRule = (ruleId: number) => {
    setLabelingRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule
      )
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <Bot className="w-8 h-8 mr-3 text-primary-500" />
          AutoLabeler - Smart Issue Labeling
        </h1>
        <p className="text-github-muted">
          Analyze real repository issues and get intelligent labeling suggestions
        </p>
      </div>

      {/* Repository Selection */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="repo-select" className="block text-sm font-medium text-github-text mb-2">
              Select Repository to Analyze
            </label>
            <select
              id="repo-select"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-4 py-2 bg-github-dark border border-github-border rounded-lg text-github-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Choose a repository...</option>
              {repositories.map(repo => (
                <option key={repo.id} value={repo.full_name}>
                  {repo.full_name} ({repo.open_issues_count} open issues)
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={analyzeRepositoryIssues}
              loading={loading}
              leftIcon={<Zap className="w-4 h-4" />}
              className="whitespace-nowrap"
              disabled={!selectedRepo || !token}
            >
              Analyze Issues
            </Button>
          </div>
        </div>
      </Card>

      {/* Labeling Rules */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-6 flex items-center">
          <Tag className="w-5 h-5 mr-2" />
          Active Labeling Rules
        </h3>
        <div className="space-y-3">
          {labelingRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-github-dark/30 rounded-lg">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: rule.color }}
                />
                <div>
                  <div className="font-medium text-github-text">
                    Keyword: "{rule.keyword}" → Label: "{rule.label}"
                  </div>
                  <div className="text-sm text-github-muted">{rule.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${rule.active ? 'bg-green-400/20 text-green-400' : 'bg-gray-400/20 text-gray-400'}`}>
                  {rule.active ? 'Active' : 'Inactive'}
                </span>
                <Button
                  onClick={() => toggleRule(rule.id)}
                  variant="outline"
                  size="sm"
                >
                  {rule.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Analyzing repository issues...</span>
          </div>
        </Card>
      )}

      {/* Analysis Results */}
      {recentActivity.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-github-text mb-6">
            Labeling Analysis Results
          </h3>
          <div className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="p-4 bg-github-dark/30 rounded-lg border border-github-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-github-text">#{item.number} - {item.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.confidence >= 80 ? 'bg-green-400/20 text-green-400' :
                        item.confidence >= 60 ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {item.confidence}% confidence
                      </span>
                    </div>
                    
                    {item.body && (
                      <p className="text-sm text-github-muted mb-3">{item.body}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-github-muted mb-3">
                      <span>By {item.user.login}</span>
                      <span>{formatTimeAgo(item.created_at)}</span>
                    </div>

                    {/* Current Labels */}
                    {item.currentLabels.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-github-muted mr-2">Current labels:</span>
                        <div className="inline-flex flex-wrap gap-1">
                          {item.currentLabels.map((label: any) => (
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
                        </div>
                      </div>
                    )}

                    {/* Suggested Labels */}
                    <div>
                      <span className="text-sm text-github-muted mr-2">Suggested labels:</span>
                      <div className="inline-flex flex-wrap gap-1">
                        {item.suggestedLabels.map((label: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-primary-600/20 text-primary-400 border border-primary-600/40"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-400 hover:text-primary-300 text-sm ml-4"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Issue
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statistics */}
      {recentActivity.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">{recentActivity.length}</div>
              <div className="text-sm text-github-muted">Issues Analyzed</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {Math.round(recentActivity.reduce((sum, item) => sum + item.confidence, 0) / recentActivity.length)}%
              </div>
              <div className="text-sm text-github-muted">Avg Confidence</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {labelingRules.filter(rule => rule.active).length}
              </div>
              <div className="text-sm text-github-muted">Active Rules</div>
            </div>
          </Card>
        </div>
      )}

      {/* Webhook Setup Instructions */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Webhook Setup (Optional)
        </h3>
        <div className="bg-github-dark/50 rounded-lg p-4">
          <h4 className="font-medium text-github-text mb-2">For Real-time Auto-labeling:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-github-muted">
            <li>Go to your repository settings</li>
            <li>Navigate to Webhooks section</li>
            <li>Add webhook URL: <code className="bg-github-border px-1 rounded">https://your-domain.com/api/webhook/github</code></li>
            <li>Select "Issues" and "Pull requests" events</li>
            <li>Set Content type to "application/json"</li>
          </ol>
          <div className="mt-3 p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 With webhooks, issues will be automatically labeled when created or updated
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AutoLabeler;