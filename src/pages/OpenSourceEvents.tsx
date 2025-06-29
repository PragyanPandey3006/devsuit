import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Zap, Activity, GitBranch, GitCommit, GitPullRequest, MessageSquare, Star, Eye, Calendar, ExternalLink } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OpenSourceEvents: React.FC = () => {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('all');

  useEffect(() => {
    if (token) {
      loadUserRepositories();
      loadUserEvents();
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

  const loadUserEvents = async () => {
    setLoading(true);
    try {
      const userEvents = await githubService.getUserEvents(user?.login || '');
      setEvents(userEvents.slice(0, 50));
      toast.success(`Loaded ${userEvents.length} recent events`);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadRepositoryEvents = async () => {
    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    setLoading(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const repoEvents = await githubService.getRepositoryEvents(owner, repo);
      setEvents(repoEvents.slice(0, 50));
      toast.success(`Loaded ${repoEvents.length} repository events`);
    } catch (error: any) {
      console.error('Failed to load repository events:', error);
      toast.error('Failed to load repository events');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PushEvent':
        return <GitCommit className="w-4 h-4 text-green-400" />;
      case 'PullRequestEvent':
        return <GitPullRequest className="w-4 h-4 text-blue-400" />;
      case 'IssuesEvent':
        return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      case 'WatchEvent':
        return <Star className="w-4 h-4 text-yellow-400" />;
      case 'ForkEvent':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      case 'CreateEvent':
        return <GitBranch className="w-4 h-4 text-green-400" />;
      case 'DeleteEvent':
        return <GitBranch className="w-4 h-4 text-red-400" />;
      case 'IssueCommentEvent':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'PullRequestReviewEvent':
        return <Eye className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-github-muted" />;
    }
  };

  const getEventDescription = (event: any) => {
    const actor = event.actor.display_login || event.actor.login;
    const repo = event.repo.name;

    switch (event.type) {
      case 'PushEvent':
        const commits = event.payload.commits?.length || 0;
        return `${actor} pushed ${commits} commit${commits !== 1 ? 's' : ''} to ${repo}`;
      
      case 'PullRequestEvent':
        const action = event.payload.action;
        const prNumber = event.payload.pull_request?.number;
        return `${actor} ${action} pull request #${prNumber} in ${repo}`;
      
      case 'IssuesEvent':
        const issueAction = event.payload.action;
        const issueNumber = event.payload.issue?.number;
        return `${actor} ${issueAction} issue #${issueNumber} in ${repo}`;
      
      case 'WatchEvent':
        return `${actor} starred ${repo}`;
      
      case 'ForkEvent':
        return `${actor} forked ${repo}`;
      
      case 'CreateEvent':
        const refType = event.payload.ref_type;
        const ref = event.payload.ref;
        return `${actor} created ${refType}${ref ? ` ${ref}` : ''} in ${repo}`;
      
      case 'DeleteEvent':
        const deleteRefType = event.payload.ref_type;
        const deleteRef = event.payload.ref;
        return `${actor} deleted ${deleteRefType} ${deleteRef} in ${repo}`;
      
      case 'IssueCommentEvent':
        const commentIssueNumber = event.payload.issue?.number;
        return `${actor} commented on issue #${commentIssueNumber} in ${repo}`;
      
      case 'PullRequestReviewEvent':
        const reviewAction = event.payload.action;
        const reviewPrNumber = event.payload.pull_request?.number;
        return `${actor} ${reviewAction} review on pull request #${reviewPrNumber} in ${repo}`;
      
      default:
        return `${actor} performed ${event.type} in ${repo}`;
    }
  };

  const getEventUrl = (event: any) => {
    switch (event.type) {
      case 'PullRequestEvent':
        return event.payload.pull_request?.html_url;
      case 'IssuesEvent':
        return event.payload.issue?.html_url;
      case 'IssueCommentEvent':
        return event.payload.comment?.html_url;
      case 'PullRequestReviewEvent':
        return event.payload.pull_request?.html_url;
      default:
        return `https://github.com/${event.repo.name}`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const filteredEvents = eventType === 'all' 
    ? events 
    : events.filter(event => event.type === eventType);

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'PushEvent', label: 'Pushes' },
    { value: 'PullRequestEvent', label: 'Pull Requests' },
    { value: 'IssuesEvent', label: 'Issues' },
    { value: 'WatchEvent', label: 'Stars' },
    { value: 'ForkEvent', label: 'Forks' },
    { value: 'CreateEvent', label: 'Creates' },
    { value: 'IssueCommentEvent', label: 'Comments' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <Zap className="w-8 h-8 mr-3 text-primary-500" />
          Events Hub - Real-time GitHub Activity
        </h1>
        <p className="text-github-muted">
          Track real-time GitHub events and activity across your repositories
        </p>
      </div>

      {/* Controls */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-github-text mb-2">Repository (Optional)</label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2 bg-github-dark border border-github-border rounded-lg text-github-text focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All repositories</option>
              {repositories.map(repo => (
                <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <Button
              onClick={selectedRepo ? loadRepositoryEvents : loadUserEvents}
              loading={loading}
              leftIcon={<Activity className="w-4 h-4" />}
            >
              {selectedRepo ? 'Load Repo Events' : 'Load My Events'}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Loading GitHub events...</span>
          </div>
        </Card>
      )}

      {/* Events Feed */}
      {filteredEvents.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-github-text">
              Recent Activity ({filteredEvents.length} events)
            </h3>
            <div className="text-sm text-github-muted">
              {selectedRepo ? `Repository: ${selectedRepo}` : 'All repositories'}
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 bg-github-dark/30 rounded-lg hover:bg-github-dark/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-github-text">
                        {getEventDescription(event)}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-github-muted">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatTimeAgo(event.created_at)}
                        </span>
                        <span className="px-2 py-1 bg-github-border rounded-full">
                          {event.type.replace('Event', '')}
                        </span>
                      </div>
                    </div>
                    {getEventUrl(event) && (
                      <a
                        href={getEventUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-400 hover:text-primary-300 text-sm ml-3"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  {/* Additional event details */}
                  {event.type === 'PushEvent' && event.payload.commits && (
                    <div className="mt-2 text-xs text-github-muted">
                      Latest commit: {event.payload.commits[0]?.message?.substring(0, 60)}...
                    </div>
                  )}
                  
                  {(event.type === 'PullRequestEvent' || event.type === 'IssuesEvent') && (
                    <div className="mt-2 text-xs text-github-muted">
                      {event.payload.pull_request?.title || event.payload.issue?.title}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event Statistics */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">{events.length}</div>
              <div className="text-sm text-github-muted">Total Events</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {events.filter(e => e.type === 'PushEvent').length}
              </div>
              <div className="text-sm text-github-muted">Push Events</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {events.filter(e => e.type === 'PullRequestEvent').length}
              </div>
              <div className="text-sm text-github-muted">Pull Requests</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {new Set(events.map(e => e.repo.name)).size}
              </div>
              <div className="text-sm text-github-muted">Repositories</div>
            </div>
          </Card>
        </div>
      )}

      {/* Real-time Webhook Info */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Real-time Event Tracking
        </h3>
        <div className="bg-github-dark/50 rounded-lg p-4">
          <p className="text-github-text mb-3">
            This module shows real GitHub events from the GitHub Events API. For real-time updates, you can set up webhooks:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-github-muted">
            <li>Repository webhooks for specific repository events</li>
            <li>Organization webhooks for organization-wide events</li>
            <li>GitHub Apps for advanced event handling</li>
            <li>WebSocket connections for live updates</li>
          </ul>
          <div className="mt-3 p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 Events are fetched from GitHub's public timeline and your personal activity feed
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OpenSourceEvents;