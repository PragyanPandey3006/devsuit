import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { File as FileSync, Search, CheckCircle, XCircle, AlertCircle, ExternalLink, Copy, Download } from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ReadmeSyncer: React.FC = () => {
  const { token } = useAuth();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [readmeAnalysis, setReadmeAnalysis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  const defaultTemplate = `# Project Name

## Description
Brief description of what this project does and who it's for.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## Features
- Feature 1
- Feature 2
- Feature 3

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- Author: Your Name
- Email: your.email@example.com
- GitHub: [@yourusername](https://github.com/yourusername)
`;

  useEffect(() => {
    if (token) {
      loadUserRepositories();
    }
    setTemplateContent(defaultTemplate);
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

  const analyzeReadmes = async () => {
    if (selectedRepos.length === 0) {
      toast.error('Please select at least one repository');
      return;
    }

    setLoading(true);
    try {
      const analysis: any[] = [];
      
      for (const repoName of selectedRepos) {
        const [owner, repo] = repoName.split('/');
        
        try {
          const [repository, readme] = await Promise.all([
            githubService.getRepository(owner, repo),
            githubService.getRepositoryReadme(owner, repo),
          ]);

          let readmeContent = '';
          let readmeSize = 0;
          let hasReadme = false;

          if (readme) {
            hasReadme = true;
            readmeSize = readme.size;
            // Decode base64 content
            try {
              readmeContent = atob(readme.content.replace(/\n/g, ''));
            } catch (error) {
              readmeContent = 'Unable to decode README content';
            }
          }

          // Analyze README quality
          const qualityScore = analyzeReadmeQuality(readmeContent, repository);
          
          analysis.push({
            repository: repoName,
            repositoryData: repository,
            hasReadme,
            readmeContent: readmeContent.substring(0, 1000), // Limit for display
            fullContent: readmeContent,
            readmeSize,
            qualityScore,
            issues: getReadmeIssues(readmeContent, repository),
            suggestions: getReadmeSuggestions(readmeContent, repository),
          });
        } catch (error) {
          console.warn(`Failed to analyze ${repoName}:`, error);
          analysis.push({
            repository: repoName,
            hasReadme: false,
            error: 'Failed to fetch repository data',
            qualityScore: { score: 0, maxScore: 100 },
            issues: ['Unable to access repository'],
            suggestions: ['Check repository permissions'],
          });
        }
      }

      setReadmeAnalysis(analysis);
      toast.success(`Analyzed ${analysis.length} repositories`);
    } catch (error: any) {
      console.error('Failed to analyze READMEs:', error);
      toast.error('Failed to analyze READMEs');
    } finally {
      setLoading(false);
    }
  };

  const analyzeReadmeQuality = (content: string, repository: any) => {
    let score = 0;
    const maxScore = 100;
    const checks = [];

    // Basic structure checks
    if (content.includes('# ') || content.includes('## ')) {
      score += 15;
      checks.push('Has proper headings');
    }

    if (content.toLowerCase().includes('installation') || content.toLowerCase().includes('install')) {
      score += 15;
      checks.push('Has installation instructions');
    }

    if (content.toLowerCase().includes('usage') || content.toLowerCase().includes('example')) {
      score += 15;
      checks.push('Has usage examples');
    }

    if (content.toLowerCase().includes('license')) {
      score += 10;
      checks.push('Mentions license');
    }

    if (content.toLowerCase().includes('contributing') || content.toLowerCase().includes('contribute')) {
      score += 10;
      checks.push('Has contributing guidelines');
    }

    if (content.includes('```') || content.includes('`')) {
      score += 10;
      checks.push('Has code examples');
    }

    if (content.includes('http') || content.includes('www.')) {
      score += 5;
      checks.push('Has external links');
    }

    if (content.length > 500) {
      score += 10;
      checks.push('Adequate length');
    }

    if (repository.description && content.toLowerCase().includes(repository.description.toLowerCase().substring(0, 20))) {
      score += 5;
      checks.push('Consistent with repository description');
    }

    if (content.toLowerCase().includes('badge') || content.includes('![')) {
      score += 5;
      checks.push('Has badges or images');
    }

    return { score: Math.min(score, maxScore), maxScore, checks };
  };

  const getReadmeIssues = (content: string, repository: any) => {
    const issues = [];

    if (!content || content.length < 100) {
      issues.push('README is too short or missing');
    }

    if (!content.includes('# ') && !content.includes('## ')) {
      issues.push('Missing proper headings');
    }

    if (!content.toLowerCase().includes('installation') && !content.toLowerCase().includes('install')) {
      issues.push('Missing installation instructions');
    }

    if (!content.toLowerCase().includes('usage') && !content.toLowerCase().includes('example')) {
      issues.push('Missing usage examples');
    }

    if (!content.toLowerCase().includes('license')) {
      issues.push('No license information');
    }

    if (!content.includes('```') && !content.includes('`')) {
      issues.push('No code examples');
    }

    return issues;
  };

  const getReadmeSuggestions = (content: string, repository: any) => {
    const suggestions = [];

    if (!content.toLowerCase().includes('contributing')) {
      suggestions.push('Add contributing guidelines');
    }

    if (!content.includes('![') && !content.toLowerCase().includes('badge')) {
      suggestions.push('Add badges for build status, version, etc.');
    }

    if (!content.toLowerCase().includes('demo') && !content.toLowerCase().includes('screenshot')) {
      suggestions.push('Add screenshots or demo links');
    }

    if (!content.toLowerCase().includes('api') && repository.language) {
      suggestions.push('Document API if applicable');
    }

    if (!content.toLowerCase().includes('test')) {
      suggestions.push('Add testing instructions');
    }

    return suggestions;
  };

  const toggleRepository = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName) 
        ? prev.filter(name => name !== repoName)
        : [...prev, repoName]
    );
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(templateContent);
    toast.success('Template copied to clipboard!');
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README-template.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-github-text mb-2 flex items-center">
          <FileSync className="w-8 h-8 mr-3 text-primary-500" />
          README Syncer - Documentation Analysis
        </h1>
        <p className="text-github-muted">
          Analyze and improve README files across your repositories
        </p>
      </div>

      {/* Repository Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-github-text mb-4">Select Repositories to Analyze</h3>
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
                  <div className="text-sm text-github-muted">{repo.language || 'No language'}</div>
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-github-muted">
            Selected: {selectedRepos.length} repositories
          </div>
          <Button
            onClick={analyzeReadmes}
            loading={loading}
            leftIcon={<Search className="w-4 h-4" />}
            disabled={selectedRepos.length === 0}
          >
            Analyze READMEs
          </Button>
        </div>
      </Card>

      {/* README Template */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-github-text">README Template</h3>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowTemplate(!showTemplate)}
              variant="outline"
              size="sm"
            >
              {showTemplate ? 'Hide' : 'Show'} Template
            </Button>
            <Button
              onClick={copyTemplate}
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copy
            </Button>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
          </div>
        </div>
        
        {showTemplate && (
          <div>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              className="w-full h-64 p-4 bg-github-dark border border-github-border rounded-lg text-github-text font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Edit your README template..."
            />
            <div className="mt-2 text-sm text-github-muted">
              Customize this template and use it as a starting point for your repositories
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-github-muted">Analyzing README files...</span>
          </div>
        </Card>
      )}

      {/* Analysis Results */}
      {readmeAnalysis.length > 0 && (
        <div className="space-y-6">
          {readmeAnalysis.map((analysis, index) => (
            <Card key={index}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-github-text mb-1">
                    {analysis.repository}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-github-muted">
                    <span className="flex items-center">
                      {analysis.hasReadme ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mr-1" />
                      )}
                      {analysis.hasReadme ? 'Has README' : 'No README'}
                    </span>
                    {analysis.readmeSize && (
                      <span>{(analysis.readmeSize / 1024).toFixed(1)} KB</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {analysis.hasReadme && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.qualityScore.score)}`}>
                        {analysis.qualityScore.score}
                      </div>
                      <div className="text-xs text-github-muted">Quality Score</div>
                    </div>
                  )}
                  {analysis.repositoryData && (
                    <a
                      href={analysis.repositoryData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {analysis.hasReadme && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quality Checks */}
                  <div>
                    <h4 className="font-medium text-github-text mb-3">Quality Checks</h4>
                    <div className="space-y-2">
                      {analysis.qualityScore.checks.map((check: string, checkIndex: number) => (
                        <div key={checkIndex} className="flex items-center text-sm text-green-400">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {check}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issues and Suggestions */}
                  <div>
                    {analysis.issues.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-github-text mb-2">Issues</h4>
                        <div className="space-y-1">
                          {analysis.issues.map((issue: string, issueIndex: number) => (
                            <div key={issueIndex} className="flex items-center text-sm text-red-400">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-github-text mb-2">Suggestions</h4>
                        <div className="space-y-1">
                          {analysis.suggestions.map((suggestion: string, suggestionIndex: number) => (
                            <div key={suggestionIndex} className="flex items-center text-sm text-yellow-400">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!analysis.hasReadme && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                  <p className="text-red-400 mb-2">This repository doesn't have a README file.</p>
                  <p className="text-github-muted text-sm">
                    Consider adding a README to help users understand your project. You can use the template above as a starting point.
                  </p>
                </div>
              )}

              {analysis.error && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                  <p className="text-red-400">{analysis.error}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Summary Statistics */}
      {readmeAnalysis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {readmeAnalysis.filter(a => a.hasReadme).length}
              </div>
              <div className="text-sm text-github-muted">Have README</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {readmeAnalysis.filter(a => !a.hasReadme).length}
              </div>
              <div className="text-sm text-github-muted">Missing README</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {readmeAnalysis.filter(a => a.qualityScore?.score >= 80).length}
              </div>
              <div className="text-sm text-github-muted">High Quality</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-github-text mb-1">
                {Math.round(
                  readmeAnalysis
                    .filter(a => a.qualityScore)
                    .reduce((sum, a) => sum + a.qualityScore.score, 0) / 
                  readmeAnalysis.filter(a => a.qualityScore).length || 0
                )}
              </div>
              <div className="text-sm text-github-muted">Avg Score</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReadmeSyncer;