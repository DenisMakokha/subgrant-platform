# Step 1: Enable GitHub Security Features (5 minutes)

**Status**: Ready to Execute  
**Time Required**: 5 minutes  
**Prerequisites**: Repository admin access

---

## 🎯 Objective

Enable GitHub's built-in security features to protect your repository from vulnerabilities and exposed secrets.

## ✅ Checklist

Follow these steps in your GitHub repository:

### 1. Enable Dependency Graph (30 seconds)

1. Go to repository **Settings**
2. Click **Security** in the left sidebar
3. Scroll to **Code security and analysis**
4. Find **Dependency graph**
5. Click **Enable** (if not already enabled)

**Why**: Allows GitHub to track your dependencies and their versions.

### 2. Enable Dependabot Alerts (30 seconds)

1. In the same section (**Code security and analysis**)
2. Find **Dependabot alerts**
3. Click **Enable**
4. ✅ You'll now get notified of vulnerable dependencies

**Why**: Automatic alerts when dependencies have known security vulnerabilities.

### 3. Enable Dependabot Security Updates (30 seconds)

1. In the same section
2. Find **Dependabot security updates**
3. Click **Enable**
4. ✅ Dependabot will automatically create PRs to update vulnerable dependencies

**Why**: Automated security patches for your dependencies.

### 4. Enable Code Scanning (CodeQL) (1 minute)

1. In the same section
2. Find **Code scanning**
3. Click **Set up** → **Default**
4. Click **Enable CodeQL**
5. ✅ CodeQL will run on every push and PR

**Why**: Advanced static analysis to detect security vulnerabilities in your code.

**Alternative**: Our `.github/workflows/security.yml` already configures this, so it will run automatically on the next push.

### 5. Enable Secret Scanning (30 seconds)

1. In the same section
2. Find **Secret scanning**
3. Click **Enable**
4. ✅ GitHub will scan for exposed secrets

**Why**: Detects accidentally committed secrets (API keys, tokens, etc.).

**Note**: This feature is free for public repositories. For private repos, you need GitHub Advanced Security.

### 6. Enable Push Protection (30 seconds) - Recommended

1. In the same section
2. Find **Push protection**
3. Click **Enable**
4. ✅ Prevents pushing commits with detected secrets

**Why**: Blocks commits containing secrets before they reach the repository.

### 7. Review Security Settings (1 minute)

1. Click **Security** tab at the top of your repository
2. Review the **Security overview** dashboard
3. Check for any existing alerts
4. ✅ Familiarize yourself with the security dashboard

## 📋 Verification

After enabling all features, verify they're active:

```bash
# Check if workflows are enabled
git push origin main  # This should trigger security workflows

# View workflow runs
# Go to Actions tab in GitHub
# You should see "Security Checks" workflow running
```

## 🎯 Expected Results

After completion, you should see:

1. ✅ **Green checkmarks** next to all security features in Settings
2. ✅ **Security tab** showing overview dashboard
3. ✅ **Actions tab** showing "Security Checks" workflow
4. ✅ **No critical alerts** (or alerts to address)

## 📸 Visual Checklist

Your Settings → Security page should look like this:

```
Code security and analysis
├─ Dependency graph          [✓ Enabled]
├─ Dependabot alerts         [✓ Enabled]
├─ Dependabot security updates [✓ Enabled]
├─ Code scanning             [✓ Enabled]
├─ Secret scanning           [✓ Enabled]
└─ Push protection           [✓ Enabled]
```

## ⚠️ Important Notes

### For Private Repositories
- **Secret scanning** and **Push protection** require GitHub Advanced Security
- **Code scanning** is included in our workflow, so it will work via Actions
- **Dependabot** features are free for all repositories

### First-Time Setup
- CodeQL analysis may take 5-10 minutes on first run
- You may receive alerts for existing issues - that's normal
- Don't panic if you see alerts - we'll address them in Step 3

## 🔄 Continuous Protection

Once enabled, these features provide:

- **Real-time protection**: Secrets blocked before commit (with push protection)
- **Automatic scanning**: Every push runs security checks
- **Proactive alerts**: Email notifications for new vulnerabilities
- **Automated fixes**: Dependabot creates PRs for security updates
- **Weekly scans**: Scheduled security audits (from our workflow)

## 🚀 Next Steps

After enabling these features:

1. ✅ **Mark this step complete**
2. ➡️ **Proceed to Step 2**: Run initial gitleaks scan
3. 📋 **Monitor** the Actions tab for workflow completion
4. 🔔 **Watch for** any security alerts in coming days

## 💡 Pro Tips

1. **Enable notifications**: Settings → Notifications → Check "Security alerts"
2. **Add to Slack**: Integrate GitHub security alerts with your team Slack channel
3. **Weekly review**: Schedule 15 minutes weekly to review security dashboard
4. **Document exceptions**: Keep a log of any suppressed alerts with justification

## 📞 Troubleshooting

### Issue: Cannot enable certain features
**Solution**: Check your GitHub plan. Some features require paid plans for private repos.

### Issue: CodeQL not running
**Solution**: Our workflow handles this. It will run on next push to main/develop.

### Issue: No security tab visible
**Solution**: Ensure you have admin access to the repository.

### Issue: Dependabot not creating PRs
**Solution**: Check Settings → Code security and analysis → Ensure all Dependabot features are enabled.

## ✅ Completion Criteria

You can mark Step 1 complete when:

- [ ] All 6 security features enabled (or noted if unavailable)
- [ ] Security tab visible and accessible
- [ ] No errors when viewing security dashboard
- [ ] Security workflows visible in Actions tab
- [ ] Team members notified about new security features

---

**Time Spent**: _____ minutes  
**Completed By**: _____  
**Date**: _____  
**Issues Encountered**: _____

**Next**: [Step 2 - Run Initial Gitleaks Scan](ACTIVATION_STEP_2_GITLEAKS_SCAN.md)
