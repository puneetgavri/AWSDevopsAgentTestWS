# Git Repository Setup

## ✅ Repository Initialized

Your project is now a git repository with all files committed!

## 📁 Repository Structure

```
AWSDevopsAgentTestWS/
├── .git/                       # Git repository
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml          # Main deployment workflow
│   │   └── terraform-check.yml # Validation workflow
│   ├── CODEOWNERS
│   └── dependabot.yml
├── iac/
│   ├── main.tf
│   ├── monitoring.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.tf
│   └── terraform.tfvars.example
├── lambda/
│   └── src/
│       ├── handler.py
│       └── requirements.txt
├── static-ui/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
├── README.md
├── QUICKSTART.md
├── DEPLOYMENT.md
├── MONITORING.md
└── test-alarms.sh
```

## 🚀 Next Steps

### 1. Create GitHub Repository

Go to GitHub and create a new repository:
- Repository name: `aws-serverless-crud-app` (or your choice)
- Description: "AWS Serverless CRUD application with Terraform and GitHub Actions"
- **Don't** initialize with README (we already have one)

### 2. Connect to GitHub

```bash
cd AWSDevopsAgentTestWS

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Configure GitHub Secrets

Go to your repository on GitHub:
- **Settings** → **Secrets and variables** → **Actions**
- Add these secrets:
  - `AWS_ACCESS_KEY_ID`: Your AWS access key
  - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

### 4. (Optional) Configure Email Alerts

Create `iac/terraform.tfvars`:
```hcl
alarm_email = "your-email@example.com"
```

Commit and push:
```bash
git add iac/terraform.tfvars
git commit -m "Configure alarm email"
git push
```

### 5. Deploy!

Push to main branch triggers automatic deployment:
```bash
git push origin main
```

Or manually trigger from GitHub Actions tab.

## 📝 Git Commands Reference

### Check Status
```bash
git status
```

### View Commit History
```bash
git log --oneline
git log --graph --oneline --all
```

### Create Feature Branch
```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

### Update from Remote
```bash
git pull origin main
```

### View Remote
```bash
git remote -v
```

## 🔄 Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/add-authentication
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Add Cognito authentication"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/add-authentication
   ```

4. **Create Pull Request** on GitHub
   - Terraform plan will be commented automatically
   - Review changes
   - Merge to main

5. **Automatic deployment** when merged to main

## 🏷️ Tagging Releases

```bash
# Create tag
git tag -a v1.0.0 -m "Initial release"

# Push tag
git push origin v1.0.0

# List tags
git tag -l
```

## 🔧 Useful Git Aliases

Add to `~/.gitconfig`:
```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    lg = log --graph --oneline --all --decorate
    last = log -1 HEAD
    unstage = reset HEAD --
```

## 📚 Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

## 🆘 Common Issues

### Forgot to add .gitignore
```bash
git rm -r --cached .
git add .
git commit -m "Apply .gitignore"
```

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Undo last commit (discard changes)
```bash
git reset --hard HEAD~1
```

### View what changed
```bash
git diff
git diff --staged
```

## ✅ You're All Set!

Your repository is ready to push to GitHub and start deploying!
