# Git Workflow Guide

This project uses a professional Git workflow with automated scripts for common operations.

## 🚀 Quick Start

### Creating a Feature Branch
```bash
npm run git:feature add-chef-filtering
# or
node scripts/git-helpers.js feature add-chef-filtering
```

### Creating a Bugfix Branch
```bash
npm run git:bugfix fix-login-timeout
# or
node scripts/git-helpers.js bugfix fix-login-timeout
```

### Committing Changes
```bash
npm run git:commit feat login "add automatic login"
# or
node scripts/git-helpers.js commit feat login "add automatic login"
```

### Pushing Changes
```bash
npm run git:push
# or
node scripts/git-helpers.js push
```

### Creating Issues
```bash
npm run issue:bug "Login timeout" "The login process times out"
npm run issue:feature "Add filtering" "Allow filtering chefs by cuisine"
```

## 🌿 Branch Strategy

### Main Branches
- **main**: Production-ready code
- **develop**: Development integration branch

### Feature Branches
- **feature/***: New features
  - Created from `develop`
  - Merged back to `develop`

### Bugfix Branches
- **bugfix/***: Bug fixes
  - Created from `develop`
  - Merged back to `develop`

### Hotfix Branches
- **hotfix/***: Urgent production fixes
  - Created from `main`
  - Merged to both `main` and `develop`

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

### Examples:
```bash
npm run git:commit feat login "add automatic login"
npm run git:commit fix navigation "resolve timeout issue"
npm run git:commit docs readme "update installation"
```

## 🔄 Typical Workflow

1. **Start a new feature:**
   ```bash
   npm run git:feature my-new-feature
   ```

2. **Make changes and commit:**
   ```bash
   # Make your code changes
   npm run git:commit feat feature-name "implement new feature"
   ```

3. **Push and create PR:**
   ```bash
   npm run git:push
   # Then create PR on GitHub
   ```

4. **Merge to develop:**
   ```bash
   npm run git:merge-dev
   ```

5. **When ready, merge to main:**
   ```bash
   npm run git:merge-main
   ```

## 🐛 Issue Management

### Create a Bug Report
```bash
npm run issue:bug "Bug title" "Detailed description"
```

### Create a Feature Request
```bash
npm run issue:feature "Feature title" "Detailed description"
```

Issues are created in `.github/issues/` directory and can be tracked there.

## 📋 Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run git:feature <name>` | Create feature branch |
| `npm run git:bugfix <name>` | Create bugfix branch |
| `npm run git:hotfix <name>` | Create hotfix branch |
| `npm run git:commit <type> [scope] <message>` | Commit with conventional format |
| `npm run git:push` | Push current branch |
| `npm run git:merge-dev` | Merge to develop |
| `npm run git:merge-main` | Merge to main |
| `npm run issue:bug <title> [desc]` | Create bug issue |
| `npm run issue:feature <title> [desc]` | Create feature issue |

## ✅ Best Practices

1. **Always start from the correct branch:**
   - Features/bugfixes: from `develop`
   - Hotfixes: from `main`

2. **Use descriptive branch names:**
   - Good: `feature/add-chef-filtering`
   - Bad: `feature/fix`

3. **Write clear commit messages:**
   - Use conventional commit format
   - Be specific about what changed

4. **Keep branches up to date:**
   - Regularly pull from `develop` or `main`
   - Rebase if needed before merging

5. **Test before merging:**
   - Ensure all tests pass
   - Test manually if applicable

## 🔍 Useful Git Commands

```bash
# View branch structure
git log --oneline --graph --all

# Check current branch
git branch --show-current

# View status
git status

# View recent commits
git log --oneline -10
```

