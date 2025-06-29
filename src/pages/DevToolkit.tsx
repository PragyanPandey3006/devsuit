import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Code2, Play, Copy, Book } from 'lucide-react';
import toast from 'react-hot-toast';

const DevToolkit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rest' | 'graphql'>('rest');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const restTemplates = [
    {
      name: 'Get User',
      query: 'GET /user',
      description: 'Get the authenticated user',
    },
    {
      name: 'List Repositories',
      query: 'GET /user/repos?sort=updated&per_page=10',
      description: 'List user repositories',
    },
    {
      name: 'Get Repository',
      query: 'GET /repos/{owner}/{repo}',
      description: 'Get repository information',
    },
    {
      name: 'List Issues',
      query: 'GET /repos/{owner}/{repo}/issues?state=open',
      description: 'List repository issues',
    },
  ];

  const graphqlTemplates = [
    {
      name: 'User Profile',
      query: `query {
  viewer {
    login
    name
    email
    bio
    avatarUrl
    followers {
      totalCount
    }
    following {
      totalCount
    }
  }
}`,
      description: 'Get user profile information',
    },
    {
      name: 'Repository Info',
      query: `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    description
    stargazerCount
    forkCount
    primaryLanguage {
      name
    }
    createdAt
    updatedAt
  }
}`,
      description: 'Get repository details',
    },
    {
      name: 'Contribution Activity',
      query: `query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}`,
      description: 'Get user contribution activity',
    },
  ];

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock response
      const mockResponse = activeTab === 'rest' ? {
        status: 200,
        data: {
          login: 'demo-user',
          id: 12345,
          name: 'Demo User',
          public_repos: 42,
          followers: 123,
          following: 89,
          created_at: '2020-01-15T10:30:00Z',
        },
      } : {
        data: {
          viewer: {
            login: 'demo-user',
            name: 'Demo User',
            email: 'demo@example.com',
            bio: 'Full-stack developer passionate about open source',
            avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
            followers: { totalCount: 123 },
            following: { totalCount: 89 },
          },
        },
      };

      setResponse(JSON.stringify(mockResponse, null, 2));
      toast.success('Query executed successfully!');
    } catch (error) {
      toast.error('Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setQuery(template.query);
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(response);
    toast.success('Response copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <Code2 className="w-8 h-8 mr-3 text-primary-500" />
          DevToolkit - GitHub API Playground
        </h1>
        <p className="text-github-muted">
          Test and explore GitHub REST and GraphQL APIs with interactive queries
        </p>
      </div>

      {/* API Type Tabs */}
      <Card>
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'rest'
                ? 'bg-primary-600 text-white'
                : 'text-github-muted hover:text-github-text'
            }`}
          >
            REST API
          </button>
          <button
            onClick={() => setActiveTab('graphql')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'graphql'
                ? 'bg-primary-600 text-white'
                : 'text-github-muted hover:text-github-text'
            }`}
          >
            GraphQL API
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Templates */}
          <div>
            <h3 className="text-lg font-semibold text-github-text mb-4 flex items-center">
              <Book className="w-5 h-5 mr-2" />
              Templates
            </h3>
            <div className="space-y-2">
              {(activeTab === 'rest' ? restTemplates : graphqlTemplates).map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-3 rounded-lg bg-github-dark/50 hover:bg-github-dark transition-colors"
                >
                  <div className="font-medium text-github-text">{template.name}</div>
                  <div className="text-sm text-github-muted mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Query Input */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-github-text">
                {activeTab === 'rest' ? 'REST Endpoint' : 'GraphQL Query'}
              </h3>
              <Button
                onClick={handleExecute}
                loading={loading}
                leftIcon={<Play className="w-4 h-4" />}
                size="sm"
              >
                Execute
              </Button>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'rest'
                  ? 'Enter REST endpoint (e.g., GET /user)'
                  : 'Enter GraphQL query'
              }
              className="w-full h-64 p-4 bg-github-dark border border-github-border rounded-lg text-github-text placeholder-github-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-github-text">Response</h3>
            <Button
              onClick={handleCopyResponse}
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copy
            </Button>
          </div>
          <div className="bg-github-dark rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-github-text font-mono whitespace-pre-wrap">
              {response}
            </pre>
          </div>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-github-text mb-3">REST API Tips</h4>
            <ul className="space-y-2 text-sm text-github-muted">
              <li>• Use GET for retrieving data</li>
              <li>• Use POST for creating resources</li>
              <li>• Use PATCH for updating resources</li>
              <li>• Use DELETE for removing resources</li>
              <li>• Include authentication headers when needed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-github-text mb-3">GraphQL Tips</h4>
            <ul className="space-y-2 text-sm text-github-muted">
              <li>• Request only the fields you need</li>
              <li>• Use variables for dynamic queries</li>
              <li>• Leverage fragments for reusable fields</li>
              <li>• Use aliases to rename fields</li>
              <li>• Explore the schema with introspection</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DevToolkit;