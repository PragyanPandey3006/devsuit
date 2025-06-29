import axios from 'axios';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  default_branch: string;
  topics: string[];
  license: {
    key: string;
    name: string;
  } | null;
}

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

class GitHubService {
  private token: string | null = null;
  private baseURL = 'https://api.github.com';
  private graphqlURL = 'https://api.github.com/graphql';

  setToken(token: string | null) {
    this.token = token;
    console.log('GitHub token set:', token ? 'Token provided' : 'No token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Devsuit/1.0.0',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      console.log(`Making GitHub API request to: ${endpoint}`);
      
      const response = await axios({
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders(),
        timeout: 15000, // 15 second timeout
        ...options,
      });
      
      console.log(`GitHub API response status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error('GitHub API Error:', {
        endpoint,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('GitHub authentication failed. Please sign in again.');
      } else if (error.response?.status === 403) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        if (resetTime) {
          const resetDate = new Date(parseInt(resetTime) * 1000);
          throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
        }
        throw new Error('GitHub API rate limit exceeded or access forbidden.');
      } else if (error.response?.status === 404) {
        throw new Error('Repository not found or access denied.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'GitHub API request failed');
      }
    }
  }

  private async graphqlRequest<T>(query: string, variables: any = {}): Promise<T> {
    try {
      console.log('Making GitHub GraphQL request');
      
      const response = await axios.post(
        this.graphqlURL,
        { query, variables },
        { 
          headers: this.getHeaders(),
          timeout: 15000
        }
      );
      
      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('GitHub GraphQL Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'GitHub GraphQL request failed');
    }
  }

  // Authentication
  async getCurrentUser(): Promise<GitHubUser> {
    if (!this.token) {
      throw new Error('No GitHub token available');
    }
    return this.request<GitHubUser>('/user');
  }

  // Repository Operations
  async getRepository(owner: string, repo: string): Promise<Repository> {
    return this.request<Repository>(`/repos/${owner}/${repo}`);
  }

  async getRepositoryContributors(owner: string, repo: string): Promise<Contributor[]> {
    return this.request<Contributor[]>(`/repos/${owner}/${repo}/contributors?per_page=100`);
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  }

  async getRepositoryIssues(owner: string, repo: string, state = 'open'): Promise<Issue[]> {
    return this.request<Issue[]>(`/repos/${owner}/${repo}/issues?state=${state}&per_page=100`);
  }

  async getRepositoryPullRequests(owner: string, repo: string, state = 'open') {
    return this.request(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);
  }

  async getRepositoryCommits(owner: string, repo: string, since?: string) {
    const params = since ? `?since=${since}&per_page=100` : '?per_page=100';
    return this.request(`/repos/${owner}/${repo}/commits${params}`);
  }

  async getRepositoryReleases(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}/releases?per_page=50`);
  }

  async getRepositoryReadme(owner: string, repo: string) {
    try {
      return await this.request(`/repos/${owner}/${repo}/readme`);
    } catch (error) {
      return null;
    }
  }

  async getRepositoryLicense(owner: string, repo: string) {
    try {
      return await this.request(`/repos/${owner}/${repo}/license`);
    } catch (error) {
      return null;
    }
  }

  // Comment Operations
  async getIssueComments(owner: string, repo: string, issueNumber: number) {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`);
  }

  async getPullRequestComments(owner: string, repo: string, prNumber: number) {
    return this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/comments?per_page=100`);
  }

  // Events Operations
  async getUserEvents(username: string) {
    return this.request(`/users/${username}/events?per_page=100`);
  }

  async getRepositoryEvents(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}/events?per_page=100`);
  }

  // User Operations
  async getUserRepositories(username?: string, type = 'all'): Promise<Repository[]> {
    const endpoint = username 
      ? `/users/${username}/repos?type=${type}&per_page=100&sort=updated`
      : `/user/repos?type=${type}&per_page=100&sort=updated`;
    return this.request<Repository[]>(endpoint);
  }

  async getUser(username: string): Promise<GitHubUser> {
    return this.request<GitHubUser>(`/users/${username}`);
  }

  // Search Operations
  async searchRepositories(query: string, sort = 'stars', order = 'desc', per_page = 30) {
    return this.request(`/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${per_page}`);
  }

  async searchIssues(query: string, sort = 'created', order = 'desc', per_page = 30) {
    return this.request(`/search/issues?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${per_page}`);
  }

  async searchUsers(query: string, sort = 'followers', order = 'desc', per_page = 30) {
    return this.request(`/search/users?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${per_page}`);
  }

  // Organization Operations
  async getOrganization(org: string) {
    return this.request(`/orgs/${org}`);
  }

  async getOrganizationMembers(org: string) {
    return this.request(`/orgs/${org}/members?per_page=100`);
  }

  async getOrganizationRepositories(org: string) {
    return this.request(`/orgs/${org}/repos?per_page=100&sort=updated`);
  }

  // Rate Limit Check
  async getRateLimit() {
    return this.request('/rate_limit');
  }

  // Repository Health Analysis
  async analyzeRepositoryHealth(owner: string, repo: string) {
    try {
      console.log(`Analyzing repository health for ${owner}/${repo}`);
      
      const [repository, readme, license, contributors, issues, prs, releases] = await Promise.all([
        this.getRepository(owner, repo),
        this.getRepositoryReadme(owner, repo),
        this.getRepositoryLicense(owner, repo),
        this.getRepositoryContributors(owner, repo),
        this.getRepositoryIssues(owner, repo, 'all').catch(() => []),
        this.getRepositoryPullRequests(owner, repo, 'all').catch(() => []),
        this.getRepositoryReleases(owner, repo).catch(() => []),
      ]);

      const now = new Date();
      const lastUpdate = new Date(repository.pushed_at);
      const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      const checks = [
        {
          name: 'README.md Present',
          status: readme ? 'pass' : 'fail',
          description: readme ? 'Repository has a README file' : 'No README file found',
          recommendation: !readme ? 'Add a comprehensive README file to help users understand your project' : undefined,
        },
        {
          name: 'License File',
          status: license ? 'pass' : 'warning',
          description: license ? `${license.license.name} license detected` : 'No license file found',
          recommendation: !license ? 'Add a license file to clarify usage rights' : undefined,
        },
        {
          name: 'Recent Activity',
          status: daysSinceUpdate <= 30 ? 'pass' : daysSinceUpdate <= 90 ? 'warning' : 'fail',
          description: `Last updated ${daysSinceUpdate} days ago`,
          recommendation: daysSinceUpdate > 30 ? 'Consider updating the repository more frequently' : undefined,
        },
        {
          name: 'Issue Management',
          status: repository.open_issues_count < 50 ? 'pass' : 'warning',
          description: `${repository.open_issues_count} open issues`,
          recommendation: repository.open_issues_count >= 50 ? 'Consider addressing some open issues' : undefined,
        },
        {
          name: 'Community Engagement',
          status: contributors.length >= 5 ? 'pass' : contributors.length >= 2 ? 'warning' : 'fail',
          description: `${contributors.length} contributors`,
          recommendation: contributors.length < 5 ? 'Encourage more community contributions' : undefined,
        },
        {
          name: 'Documentation',
          status: repository.description ? 'pass' : 'warning',
          description: repository.description ? 'Repository has a description' : 'No repository description',
          recommendation: !repository.description ? 'Add a clear description to your repository' : undefined,
        },
        {
          name: 'Release Management',
          status: releases.length > 0 ? 'pass' : 'warning',
          description: `${releases.length} releases published`,
          recommendation: releases.length === 0 ? 'Consider creating releases to mark important milestones' : undefined,
        },
      ];

      const passCount = checks.filter(check => check.status === 'pass').length;
      const healthScore = Math.round((passCount / checks.length) * 100);

      console.log(`Repository health analysis complete. Score: ${healthScore}`);

      return {
        repository,
        healthScore,
        checks,
        stats: {
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          openIssues: repository.open_issues_count,
          contributors: contributors.length,
          releases: releases.length,
          lastUpdate: repository.pushed_at,
        },
        contributors: contributors.slice(0, 10),
      };
    } catch (error) {
      console.error('Repository health analysis failed:', error);
      throw error;
    }
  }

  // GraphQL Queries for advanced features
  async getContributionCalendar(username: string, from?: string, to?: string) {
    const query = `
      query($username: String!, $from: DateTime, $to: DateTime) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                }
              }
            }
          }
        }
      }
    `;

    return this.graphqlRequest(query, { username, from, to });
  }

  async getRepositoryInsights(owner: string, repo: string) {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          name
          description
          stargazerCount
          forkCount
          watchers {
            totalCount
          }
          issues(states: OPEN) {
            totalCount
          }
          pullRequests(states: OPEN) {
            totalCount
          }
          releases {
            totalCount
          }
          primaryLanguage {
            name
            color
          }
          languages(first: 10) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
          collaborators {
            totalCount
          }
          createdAt
          updatedAt
          pushedAt
        }
      }
    `;

    return this.graphqlRequest(query, { owner, repo });
  }
}

export const githubService = new GitHubService();