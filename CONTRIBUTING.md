# Contributing to GitHub DevSuite

Thank you for your interest in contributing to GitHub DevSuite! This document provides guidelines and information for contributors.

## 📧 Contact

**Primary Maintainer**: Pragyan Pandey  
**Email**: [pragyanpandeydeveloper@gmail.com](mailto:pragyanpandeydeveloper@gmail.com)  
**GitHub**: [@pragyanpandey](https://github.com/pragyanpandey)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- GitHub account with Personal Access Token
- Basic knowledge of React, TypeScript, and GitHub APIs

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/github-devsuite.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure your GitHub credentials
5. Start development server: `npm run dev`

## 🛠️ Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting and structure
- Use meaningful variable and function names
- Add comments for complex logic

### Component Structure
- Keep components focused and single-purpose
- Use proper TypeScript interfaces for props
- Follow the existing folder structure in `src/`

### API Integration
- All GitHub API calls should go through `src/services/githubService.ts`
- Handle errors gracefully with user-friendly messages
- Implement proper loading states
- Use real GitHub API data, not mock data

### Testing
- Test your changes thoroughly with real GitHub data
- Ensure OAuth flow works correctly
- Verify webhook functionality if applicable
- Test responsive design on different screen sizes

## 📝 Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding guidelines above
   - Test your changes thoroughly
   - Update documentation if needed

3. **Commit Your Changes**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements
   - `Docs:` for documentation changes

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all checks pass

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information
- GitHub API responses if relevant

## 💡 Feature Requests

For new features:
- Describe the feature and its benefits
- Explain how it integrates with GitHub APIs
- Consider the impact on existing functionality
- Provide mockups or examples if helpful

## 🔧 Module Development

When adding new modules:
- Follow the existing module structure in `src/pages/`
- Integrate with real GitHub APIs
- Add proper error handling and loading states
- Update navigation in `src/components/layout/Sidebar.tsx`
- Add documentation for the new module

## 📊 GitHub API Guidelines

- Use the official GitHub REST and GraphQL APIs
- Implement proper rate limiting handling
- Add authentication checks
- Handle API errors gracefully
- Use TypeScript interfaces for API responses

## 🔐 Security Considerations

- Never commit API keys or secrets
- Validate all user inputs
- Use proper OAuth scopes
- Implement webhook signature verification
- Follow security best practices

## 📚 Documentation

- Update README.md for significant changes
- Add inline code comments for complex logic
- Document new API endpoints or integrations
- Include setup instructions for new features

## 🎯 GitHub Developer Program Compliance

This project is designed for the GitHub Developer Program. Ensure your contributions:
- Use real GitHub API integration
- Provide genuine value to developers
- Follow GitHub's API terms of service
- Maintain professional code quality

## 📞 Getting Help

If you need help or have questions:
- Email: [pragyanpandeydeveloper@gmail.com](mailto:pragyanpandeydeveloper@gmail.com)
- Create an issue for bugs or feature requests
- Check existing issues and pull requests first

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub repository contributors page

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GitHub DevSuite! Your help makes this project better for the entire GitHub developer community.

**📧 Questions?** Contact [pragyanpandeydeveloper@gmail.com](mailto:pragyanpandeydeveloper@gmail.com)