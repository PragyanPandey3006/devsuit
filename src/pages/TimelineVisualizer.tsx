import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Calendar, Search, GitCommit, Users, TrendingUp } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TimelineVisualizer: React.FC = () => {
  const { token, user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [contributionData, setContributionData] = useState<any>(null);

  const handleAnalyze = async () => {
    const targetUser = username.trim() || user?.login;
    
    if (!targetUser) {
      toast.error('Please enter a username or sign in');
      return;
    }

    if (!token) {
      toast.error('Please authenticate with GitHub first');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      const data = await githubService.getContributionCalendar(
        targetUser,
        oneYearAgo.toISOString(),
        now.toISOString()
      );

      setContributionData(data);
      toast.success('Contribution timeline loaded successfully!');
    } catch (error: any) {
      console.error('Timeline analysis failed:', error);
      toast.error(error.message || 'Failed to load contribution timeline');
    } finally {
      setLoading(false);
    }
  };

  const getContributionColor = (count: number) => {
    if (count === 0) return 'bg-github-border';
    if (count < 3) return 'bg-green-200';
    if (count < 6) return 'bg-green-400';
    if (count < 10) return 'bg-green-600';
    return 'bg-green-800';
  };

  const getContributionLevel = (count: number) => {
    if (count === 0) return 'No contributions';
    if (count < 3) return 'Low activity';
    if (count < 6) return 'Moderate activity';
    if (count < 10) return 'High activity';
    return 'Very high activity';
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <Calendar className="w-8 h-8 mr-3 text-primary-500" />
          Timeline Visualizer - Contribution Calendar
        </h1>
        <p className="text-github-muted">
          Visualize GitHub contribution patterns and activity over time
        </p>
      </div>

      {/* User Input */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="username-input" className="block text-sm font-medium text-github-text mb-2">
              GitHub Username (leave empty for your profile)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-github-muted w-4 h-4" />
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={user?.login || "Enter GitHub username"}
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
              leftIcon={<Calendar className="w-4 h-4" />}
              className="whitespace-nowrap"
              disabled={!token}
            >
              Load Timeline
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Loading contribution timeline...</span>
          </div>
        </Card>
      )}

      {contributionData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Total Contributions</p>
                  <p className="text-2xl font-bold text-github-text">
                    {contributionData.user.contributionsCollection.contributionCalendar.totalContributions.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Commits</p>
                  <p className="text-2xl font-bold text-github-text">
                    {contributionData.user.contributionsCollection.totalCommitContributions.toLocaleString()}
                  </p>
                </div>
                <GitCommit className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Pull Requests</p>
                  <p className="text-2xl font-bold text-github-text">
                    {contributionData.user.contributionsCollection.totalPullRequestContributions.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-github-muted mb-1">Issues</p>
                  <p className="text-2xl font-bold text-github-text">
                    {contributionData.user.contributionsCollection.totalIssueContributions.toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-400" />
              </div>
            </Card>
          </div>

          {/* Contribution Calendar */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-github-text">Contribution Activity</h3>
              <div className="flex items-center space-x-2 text-sm text-github-muted">
                <span>Less</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-sm bg-github-border"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-800"></div>
                </div>
                <span>More</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Month labels */}
                <div className="flex mb-2">
                  <div className="w-8"></div>
                  {contributionData.user.contributionsCollection.contributionCalendar.weeks.map((week: any, weekIndex: number) => {
                    const firstDay = new Date(week.contributionDays[0].date);
                    const isFirstWeekOfMonth = firstDay.getDate() <= 7;
                    return (
                      <div key={weekIndex} className="w-3 mr-1">
                        {isFirstWeekOfMonth && (
                          <div className="text-xs text-github-muted">
                            {monthNames[firstDay.getMonth()]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar grid */}
                <div className="flex">
                  {/* Day labels */}
                  <div className="flex flex-col mr-2">
                    <div className="h-3 mb-1"></div>
                    <div className="h-3 mb-1 text-xs text-github-muted">Mon</div>
                    <div className="h-3 mb-1"></div>
                    <div className="h-3 mb-1 text-xs text-github-muted">Wed</div>
                    <div className="h-3 mb-1"></div>
                    <div className="h-3 mb-1 text-xs text-github-muted">Fri</div>
                    <div className="h-3 mb-1"></div>
                  </div>

                  {/* Contribution squares */}
                  <div className="flex">
                    {contributionData.user.contributionsCollection.contributionCalendar.weeks.map((week: any, weekIndex: number) => (
                      <div key={weekIndex} className="flex flex-col mr-1">
                        {week.contributionDays.map((day: any) => (
                          <div
                            key={day.date}
                            className={`w-3 h-3 mb-1 rounded-sm ${getContributionColor(day.contributionCount)} cursor-pointer hover:ring-2 hover:ring-primary-500`}
                            title={`${day.contributionCount} contributions on ${new Date(day.date).toLocaleDateString()}`}
                          ></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Analysis */}
          <Card>
            <h3 className="text-lg font-semibold text-github-text mb-6">Activity Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-github-text mb-3">Contribution Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-github-muted">Commits</span>
                    <span className="text-github-text font-medium">
                      {contributionData.user.contributionsCollection.totalCommitContributions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-github-muted">Pull Requests</span>
                    <span className="text-github-text font-medium">
                      {contributionData.user.contributionsCollection.totalPullRequestContributions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-github-muted">Issues</span>
                    <span className="text-github-text font-medium">
                      {contributionData.user.contributionsCollection.totalIssueContributions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-github-muted">Code Reviews</span>
                    <span className="text-github-text font-medium">
                      {contributionData.user.contributionsCollection.totalPullRequestReviewContributions}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-github-text mb-3">Activity Insights</h4>
                <div className="space-y-2 text-sm text-github-muted">
                  <p>• Most active in the past year</p>
                  <p>• Consistent contribution pattern</p>
                  <p>• Strong community engagement</p>
                  <p>• Regular code review participation</p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default TimelineVisualizer;