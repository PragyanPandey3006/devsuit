import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-domain.com'
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Webhook rate limiting (more restrictive)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 webhook requests per minute
  message: {
    error: 'Too many webhook requests, please try again later.'
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware to verify GitHub webhook signatures
const verifyGitHubSignature = (req, res, next) => {
  const signature = req.get('X-Hub-Signature-256');
  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ error: 'Unauthorized: Missing signature or secret' });
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Unauthorized: Invalid signature' });
  }

  next();
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'GitHub DevSuite API'
  });
});

// GitHub OAuth token exchange
app.post('/api/auth/github', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const clientId = process.env.VITE_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'OAuth configuration missing' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GitHub-DevSuite/1.0.0',
      },
    });

    const { access_token, error, error_description } = tokenResponse.data;

    if (error) {
      return res.status(400).json({ 
        error: 'OAuth failed', 
        details: error_description || error 
      });
    }

    if (!access_token) {
      return res.status(400).json({ error: 'No access token received' });
    }

    res.json({ access_token });
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OAuth exchange failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Repository analysis endpoint
app.post('/api/analyze/repo', async (req, res) => {
  try {
    const { repo, token } = req.body;

    if (!repo || !token) {
      return res.status(400).json({ error: 'Repository name and token are required' });
    }

    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      return res.status(400).json({ error: 'Invalid repository format. Use owner/repo' });
    }

    // Verify token and get repository data
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-DevSuite/1.0.0',
    };

    const [repoData, contributors, readme, license] = await Promise.allSettled([
      axios.get(`https://api.github.com/repos/${owner}/${name}`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${name}/contributors`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${name}/readme`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${name}/license`, { headers }),
    ]);

    if (repoData.status === 'rejected') {
      return res.status(404).json({ error: 'Repository not found or access denied' });
    }

    const repository = repoData.value.data;
    const contributorsList = contributors.status === 'fulfilled' ? contributors.value.data : [];
    const hasReadme = readme.status === 'fulfilled';
    const hasLicense = license.status === 'fulfilled';

    // Calculate health score
    const checks = [
      { name: 'README.md Present', status: hasReadme ? 'pass' : 'fail' },
      { name: 'License File', status: hasLicense ? 'pass' : 'warning' },
      { name: 'Recent Activity', status: isRecentlyActive(repository.pushed_at) ? 'pass' : 'warning' },
      { name: 'Issue Management', status: repository.open_issues_count < 50 ? 'pass' : 'warning' },
      { name: 'Community Engagement', status: contributorsList.length >= 2 ? 'pass' : 'warning' },
      { name: 'Documentation', status: repository.description ? 'pass' : 'warning' },
    ];

    const passCount = checks.filter(check => check.status === 'pass').length;
    const healthScore = Math.round((passCount / checks.length) * 100);

    res.json({
      repo,
      healthScore,
      repository,
      contributors: contributorsList.slice(0, 10),
      checks,
      stats: {
        stars: repository.stargazers_count,
        forks: repository.forks_count,
        openIssues: repository.open_issues_count,
        contributors: contributorsList.length,
      }
    });

  } catch (error) {
    console.error('Repository analysis error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to check if repository is recently active
function isRecentlyActive(pushedAt) {
  const now = new Date();
  const lastPush = new Date(pushedAt);
  const daysDiff = Math.floor((now - lastPush) / (1000 * 60 * 60 * 24));
  return daysDiff <= 30;
}

// Auto-labeling webhook handler
app.post('/api/webhook/github', webhookLimiter, verifyGitHubSignature, async (req, res) => {
  try {
    const { action, issue, pull_request, repository } = req.body;
    const eventType = req.get('X-GitHub-Event');

    console.log(`Received GitHub webhook: ${eventType} - ${action}`);

    if ((eventType === 'issues' || eventType === 'pull_request') && action === 'opened') {
      const item = issue || pull_request;
      const labels = analyzeContentForLabels(item.title, item.body || '');

      if (labels.length > 0) {
        // In a real implementation, you would apply labels here
        // using the GitHub API with a bot token
        console.log(`Would apply labels [${labels.join(', ')}] to ${item.html_url}`);
        
        // Store the labeling event for dashboard display
        // In production, you'd save this to a database
        
        res.json({ 
          success: true, 
          labels_applied: labels,
          confidence: calculateConfidence(item.title, item.body || ''),
          item_url: item.html_url
        });
      } else {
        res.json({ 
          success: true, 
          message: 'No labels applied - content did not match any rules' 
        });
      }
    } else {
      res.json({ 
        success: true, 
        message: `Event ${eventType}:${action} processed but no action taken` 
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Content analysis for auto-labeling
function analyzeContentForLabels(title, body) {
  const content = `${title} ${body}`.toLowerCase();
  const labels = [];

  const labelRules = {
    'bug': ['bug', 'error', 'issue', 'problem', 'broken', 'fix', 'crash', 'fail'],
    'enhancement': ['feature', 'enhancement', 'improvement', 'add', 'new', 'implement'],
    'documentation': ['docs', 'documentation', 'readme', 'guide', 'tutorial', 'example'],
    'performance': ['performance', 'slow', 'speed', 'optimize', 'memory', 'cpu'],
    'security': ['security', 'vulnerability', 'cve', 'exploit', 'auth', 'permission'],
    'ui/ux': ['ui', 'ux', 'design', 'interface', 'layout', 'style', 'css'],
    'api': ['api', 'endpoint', 'rest', 'graphql', 'request', 'response'],
    'testing': ['test', 'testing', 'spec', 'unit', 'integration', 'e2e'],
  };

  for (const [label, keywords] of Object.entries(labelRules)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      labels.push(label);
    }
  }

  return labels.length > 0 ? labels : ['needs-triage'];
}

function calculateConfidence(title, body) {
  const content = `${title} ${body}`.toLowerCase();
  const totalWords = content.split(/\s+/).length;
  const relevantWords = content.match(/\b(bug|feature|fix|add|improve|update|error|issue)\b/g) || [];
  
  return Math.min(95, Math.max(60, Math.round((relevantWords.length / totalWords) * 100 * 10)));
}

// GraphQL proxy endpoint
app.post('/api/graphql', async (req, res) => {
  try {
    const { query, variables, token } = req.body;

    if (!query || !token) {
      return res.status(400).json({ error: 'Query and token are required' });
    }

    const response = await axios.post('https://api.github.com/graphql', {
      query,
      variables: variables || {}
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-DevSuite/1.0.0',
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('GraphQL proxy error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'GraphQL query failed',
      details: error.response?.data || error.message
    });
  }
});

// Contact and support endpoint
app.get('/api/contact', (req, res) => {
  res.json({
    email: 'pragyanpandeydeveloper@gmail.com',
    support: 'For support and questions about GitHub DevSuite',
    website: 'https://github-devsuite.vercel.app',
    github: 'https://github.com/pragyanpandey/github-devsuite'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GitHub DevSuite API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Support: pragyanpandeydeveloper@gmail.com`);
  console.log(`🔗 GitHub Integration: ${process.env.VITE_GITHUB_CLIENT_ID ? 'Configured' : 'Not configured'}`);
});