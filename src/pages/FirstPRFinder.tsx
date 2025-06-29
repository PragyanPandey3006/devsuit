import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { GitPullRequest, Search, Tag, ExternalLink, Clock, Users } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FirstPRFinder: React.FC = () => {
  const { token } = useAuth();
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);

  const languages = [
    'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'Vue', 'React', 'Angular'
  ];

  const handleSearch = async () => {
    if (!token) {
      toast.error('Please authenticate with GitHub first');
      return;
    }

    setLoading(true);
    try {
      const queries = [
        `label:"good first issue" state:open ${language ? `language:${language}` : ''}`,
        `label:"beginner" state:open ${language ? `language:${language}` : ''}`,
        `label:"first-timers-only" state:open ${language ? `language:${language}` : ''}`,
        `label:"help wanted" label:"good first issue" state:open ${language ? `language:${language}` : ''}`
      ];

      const results = await Promise.all(
        queries.map(query => 
          githubService.searchIssues(query, 'created', 'desc', 25).catch(() => ({ items: [] }))
        )
      );

      const allIssues = results.flatMap(result => result.items || []);
      const uniqueIssues = allIssues.filter((issue, index, self) => 
        index === self.findIndex(i => i.id === issue.id)
      );

      setIssues(uniqueIssues.slice(0, 50));
      toast.success(`Found ${uniqueIssues.length} good first issues!`);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error(error.message || 'Failed to search for issues');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (labels: any[]) => {
    const difficultyLabels = labels.filter(label => 
      ['easy', 'beginner', 'good first issue', 'first-timers-only'].some(keyword => 
        label.name.toLowerCase().includes(keyword)
      )
    );
    return difficultyLabels.length > 0 ? 'text-green-400' : 'text-blue-400';
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
          <GitPullRequest className="w-8 h-8 mr-3 text-primary-500" />
          First PR Finder - Good First Issues
        </h1>
        <p className="text-github-muted">
          Discover beginner-friendly issues across GitHub to make your first contribution
        </p>
      </div>

      {/* Search Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="language-select" className="block text-sm font-medium text-github-text mb-2">
              Programming Language (Optional)
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-github-dark border border-github-border rounded-lg text-github-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              loading={loading}
              leftIcon={<Search className="w-4 h-4" />}
              className="whitespace-nowrap"
              disabled={!token}
            >
              Find Issues
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Searching for good first issues...</span>
          </div>
        </Card>
      )}

      {/* Results */}
      {issues.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-github-text">
              Found {issues.length} Good First Issues
            </h3>
            <div className="text-sm text-github-muted">
              {language && `Filtered by ${language}`}
            </div>
          </div>
          
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 bg-github-dark/30 rounded-lg border border-github-border/50 hover:border-primary-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-github-text mb-2 hover:text-primary-400">
                      <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                        {issue.title}
                      </a>
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-github-muted mb-3">
                      <span className="flex items-center">
                        <GitPullRequest className="w-4 h-4 mr-1" />
                        {issue.repository_url.split('/').slice(-2).join('/')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimeAgo(issue.created_at)}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {issue.user.login}
                      </span>
                    </div>
                    
                    {/* Labels */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {issue.labels.slice(0, 5).map((label: any) => (
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
                      {issue.labels.length > 5 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-github-border text-github-muted">
                          +{issue.labels.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {issue.body && (
                      <p className="text-sm text-github-muted line-clamp-2">
                        {issue.body.substring(0, 200)}
                        {issue.body.length > 200 && '...'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary-400 hover:text-primary-300 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Issue
                    </a>
                    <div className={`text-xs font-medium ${getDifficultyColor(issue.labels)}`}>
                      Good First Issue
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4">Tips for First-Time Contributors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-github-text mb-2">Before You Start</h4>
            <ul className="space-y-1 text-sm text-github-muted">
              <li>• Read the project's README and contributing guidelines</li>
              <li>• Check if the issue is still available</li>
              <li>• Comment on the issue to express interest</li>
              <li>• Fork the repository to your account</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-github-text mb-2">Making Your Contribution</h4>
            <ul className="space-y-1 text-sm text-github-muted">
              <li>• Create a new branch for your changes</li>
              <li>• Write clear, descriptive commit messages</li>
              <li>• Test your changes thoroughly</li>
              <li>• Submit a pull request with a good description</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FirstPRFinder;