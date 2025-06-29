import React from 'react';
import { Github, BarChart3, Shield, Bot, Zap, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const { login, error, isLoading } = useAuth();

  const features = [
    {
      icon: BarChart3,
      title: 'Real GitHub Analytics',
      description: 'Live contributor data, repository insights, and interactive visualizations.',
    },
    {
      icon: Shield,
      title: 'Repository Health Analysis',
      description: 'Automated health scoring with actionable recommendations for improvement.',
    },
    {
      icon: Bot,
      title: 'Smart Automation',
      description: 'Auto-label issues and PRs with intelligent webhook-driven content analysis.',
    },
    {
      icon: Zap,
      title: 'Real-time Integration',
      description: 'Live GitHub API integration with webhooks for instant updates and notifications.',
    },
  ];

  const integrationFeatures = [
    'Full GitHub REST API Integration',
    'Advanced GraphQL Queries',
    'Secure OAuth 2.0 Authentication',
    'Real-time Data Synchronization',
    'Production-Ready Architecture',
  ];

  const handleLogin = () => {
    console.log('Login button clicked');
    login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-github-darker via-github-dark to-slate-900">
      <div className="min-h-screen flex">
        {/* Left Panel - Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12">
          <div className="max-w-lg">
            <div className="flex items-center space-x-3 mb-8">
              <Github className="w-12 h-12 text-github-green" />
              <div>
                <h1 className="text-3xl font-bold text-github-text">GitHub Devsuit</h1>
                <p className="text-github-muted">Professional Developer Dashboard</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-github-text mb-4">
                🚀 Production-Ready GitHub Integration
              </h2>
              <div className="grid grid-cols-1 gap-2 mb-6">
                {integrationFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-github-muted">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-github-text mb-1">{feature.title}</h3>
                    <p className="text-github-muted">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-github-light/50 rounded-lg border border-github-border">
              <p className="text-sm text-github-muted">
                <strong className="text-github-text">Professional GitHub Integration</strong><br />
                Full production integration with GitHub APIs, webhooks, and OAuth authentication.
              </p>
            </div>

            {/* Blog Link */}
            <div className="mt-6">
              <a
                href="/blog.html"
                target="_blank"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Read the integration blog post →</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Panel - Login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-github-light border border-github-border rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4 lg:hidden">
                  <Github className="w-8 h-8 text-github-green" />
                  <h1 className="text-2xl font-bold text-github-text">Devsuit</h1>
                </div>
                <h2 className="text-2xl font-bold text-github-text mb-2">Authenticate with GitHub</h2>
                <p className="text-github-muted">
                  Connect your GitHub account to access real repository analytics, health insights, and automation tools
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Authentication Error</p>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleLogin}
                className="w-full flex items-center justify-center space-x-3"
                size="lg"
                leftIcon={<Github className="w-5 h-5" />}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Continue with GitHub'}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm text-github-muted">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-primary-400 hover:text-primary-300">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-400 hover:text-primary-300">
                    Privacy Policy
                  </a>
                </p>
              </div>

              <div className="mt-6 p-4 bg-github-dark/30 rounded-lg">
                <h4 className="text-sm font-medium text-github-text mb-2">Required Permissions:</h4>
                <ul className="text-xs text-github-muted space-y-1">
                  <li>• Read repository data and statistics</li>
                  <li>• Access user profile information</li>
                  <li>• Read organization membership</li>
                  <li>• View public and private repositories</li>
                </ul>
              </div>

              <div className="mt-6 p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 text-xs font-medium">OAuth Configuration</p>
                    <p className="text-blue-300 text-xs mt-1">
                      Client ID: Ov23lilA5w7ZZVZZ1Xk0<br />
                      Redirect URI: https://gregarious-banoffee-0aef92.netlify.app
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-github-muted">
                📧 <strong>Support:</strong>{' '}
                <a 
                  href="mailto:pragyanpandeydeveloper@gmail.com" 
                  className="text-primary-400 hover:text-primary-300"
                >
                  pragyanpandeydeveloper@gmail.com
                </a>
              </p>
              <p className="text-xs text-github-muted mt-2">
                🔒 Your data is secure and never stored without permission
              </p>
              <div className="mt-4">
                <a
                  href="/blog.html"
                  target="_blank"
                  className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learn about our GitHub integration →</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;