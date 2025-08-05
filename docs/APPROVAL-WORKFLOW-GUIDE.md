# 🔄 Requirements Approval Workflow - Complete Guide

**Automated stakeholder review and approval system for requirements**

## 🎯 Overview

The S-cubed Requirements Approval Workflow provides complete automation for:
- ✅ **Stakeholder approval detection** (comments + reactions)
- 🔄 **Automatic status updates** (pending → approved → in-development)
- 📋 **Project board management** (automatic column moves)
- 🔔 **Notification system** (stakeholder alerts and status updates)
- 📊 **Real-time dashboard** (approval progress tracking)

## 🚀 How It Works

### 1. Requirements Push
```bash
# In VSCode Command Palette
> S-cubed: Push Requirements to GitHub
```

**What happens:**
- Creates GitHub issue with `requirement` and `pending-review` labels
- Adds stakeholders from requirements document
- Triggers notification workflow
- Stakeholders receive email notifications

### 2. Stakeholder Review Process

**Stakeholders can approve via:**

#### Option A: Comment Approval
```markdown
✅ Approved - looks good to me!
```

#### Option B: Reaction Approval
- Click 👍 on the GitHub issue

#### Option C: LGTM Comments
```markdown
LGTM - ready for development
```

### 3. Automatic Approval Detection

**GitHub Actions workflow monitors:**
- All issue comments for approval patterns
- Thumbs up reactions from stakeholders
- Real-time approval status calculation

**Approval patterns detected:**
- `✅ approved`, `✅ Approved`, `approved ✅`
- `LGTM`, `looks good to me`
- `approve`, `👍 approve`, `approve 👍`

### 4. Status Automation

**When all stakeholders approve:**
1. 🏷️ **Labels updated:** `pending-review` → `approved` + `ready-for-development`
2. 💬 **Confirmation comment** posted with approval summary
3. 📋 **Project board** moves issue to "Approved" column
4. 🔔 **Stakeholders notified** of approval completion
5. 📝 **Development tasks** automatically generated

## 📱 VSCode Commands

### Command Palette Commands

| Command | Purpose |
|---------|---------|
| `S-cubed: Check Approval Status` | View approval progress for all requirements |
| `S-cubed: Trigger Approval Check` | Manually check if requirements are approved |
| `S-cubed: Request Re-Review` | Send reminder to pending stakeholders |
| `S-cubed: Move to In Development` | Start development phase for approved requirements |
| `S-cubed: View Requirements Dashboard` | Open comprehensive status dashboard |

### Quick Actions

1. **Check Approval Status**
   - Shows approval progress for each requirement
   - Displays which stakeholders have/haven't approved
   - Real-time status updates

2. **Trigger Manual Approval Check**
   - Forces immediate approval verification
   - Updates GitHub labels if conditions met
   - Useful for testing or manual override

3. **Request Re-Review**
   - Sends follow-up notifications to pending stakeholders
   - Includes deadline reminders
   - Shows current approval progress

4. **Move to Development**
   - Transitions approved requirements to development
   - Creates development task checklist
   - Updates project status

5. **Requirements Dashboard**
   - Live markdown dashboard with all requirements
   - Status breakdown and progress tracking
   - Clickable links to GitHub issues

## 🛠️ GitHub Actions Workflows

### 1. Requirements Approval Workflow
**File:** `.github/workflows/requirements-approval.yml`

**Triggers:**
- Issue comments created/edited
- Issue labels added/removed

**Features:**
- Stakeholder approval detection
- Automatic label management
- Progress tracking comments
- Stakeholder notifications

### 2. Project Board Automation
**File:** `.github/workflows/project-board-automation.yml`

**Triggers:**
- Issue status changes
- Label modifications
- Pull request events

**Features:**
- Automatic column movements
- Status change notifications
- Development task creation
- Progress tracking

## 📊 Approval Status Dashboard

### Example Dashboard Output:
```markdown
# 📋 Requirements Dashboard

**Total Requirements:** 5

## Status Overview
- 📝 Pending Review: 2
- ✅ Approved: 2
- 🚧 In Development: 1
- ❌ Rejected: 0

## Requirements List

### 📝 Pending Review
- [#123: User Authentication System](https://github.com/org/repo/issues/123) (2/3 approved)
- [#124: Payment Processing](https://github.com/org/repo/issues/124) (0/2 approved)

### ✅ Approved
- [#125: User Profile Management](https://github.com/org/repo/issues/125)
- [#126: Reporting Dashboard](https://github.com/org/repo/issues/126)

### 🚧 In Development
- [#127: Search Functionality](https://github.com/org/repo/issues/127)
```

## 🔔 Notification System

### Stakeholder Notifications

**When requirements are created:**
```markdown
## 📢 Stakeholder Review Requested

@business-analyst @security-lead @ux-designer

Your review and approval is requested for these requirements: [REQUIREMENT] User Authentication

### 🔍 Please Review:
1. Are the business objectives complete and accurate?
2. Are there any missing functional requirements?
3. Do the acceptance criteria cover all scenarios?
4. Any security, performance, or compliance considerations?

### ✅ How to Approve:
- Add a comment with "✅ Approved" or "LGTM"
- Use 👍 reaction on this issue
- Provide specific feedback if changes are needed

**Deadline for feedback:** 2025-08-10
```

**When requirements are approved:**
```markdown
## 🎉 Requirements Status Update

@business-analyst @security-lead @ux-designer

**Great news!** The requirements for User Authentication System have been **APPROVED** and are ready for development.

### What happens next:
1. ✅ Requirements moved to "Approved" status
2. 🚧 Development team can begin implementation
3. 📋 Tasks will be created in project management system
4. 🔔 You'll be notified when development is complete

Thank you for your collaboration in the requirements review process!
```

## 🚧 Development Task Creation

**When requirements are approved, automatic tasks are created:**

```markdown
## 🚧 Development Tasks

### Functional Requirements Implementation:
- [ ] Implement email validation on registration
- [ ] Add password strength requirements (8+ chars)
- [ ] Create "Remember me" functionality
- [ ] Implement password reset via email

### Acceptance Criteria Verification:
- [ ] Email validation on registration
- [ ] Password strength requirements (8+ chars)
- [ ] "Remember me" functionality
- [ ] Password reset via email
- [ ] Account lockout after 5 failed attempts
- [ ] Session timeout after 30 minutes

### Development Checklist:
- [ ] Code implementation
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Testing completed
- [ ] Stakeholder acceptance testing

---
**Next Steps:**
1. Assign this issue to development team
2. Create branch for implementation
3. Begin development using checklist above
4. Create pull request when ready for review
```

## 🔧 Setup and Configuration

### Prerequisites
1. **GitHub Repository** with Issues enabled
2. **GitHub Actions** enabled
3. **S-cubed VSCode Extension** installed
4. **Stakeholders** added as repository collaborators

### Installation Steps

1. **Copy workflow files** to your repository:
   ```bash
   .github/workflows/requirements-approval.yml
   .github/workflows/project-board-automation.yml
   ```

2. **Configure stakeholders** in requirements documents:
   ```markdown
   ## 👥 Stakeholders
   @business-analyst
   @security-lead
   @ux-designer
   ```

3. **Test the workflow** with a sample requirement:
   ```bash
   # In VSCode
   > S-cubed: Push Requirements to GitHub
   ```

### Troubleshooting

**Issue: Approval not detected**
- Check stakeholder usernames in requirements document
- Verify approval comment patterns match expected formats
- Use VSCode command: "Trigger Approval Check"

**Issue: Notifications not sent**
- Verify stakeholders are repository collaborators
- Check GitHub Actions workflow permissions
- Ensure email notifications are enabled in GitHub

**Issue: Labels not updating**
- Check GitHub Actions workflow has `issues: write` permission
- Verify repository has Issues enabled
- Manual trigger: "Trigger Approval Check" command

## 🎯 Best Practices

### For Stakeholders
1. **Clear approval language:** Use "✅ Approved" or "LGTM"
2. **Specific feedback:** Provide detailed comments when requesting changes
3. **Timely responses:** Respect review deadlines
4. **Use reactions:** 👍 for quick approvals, 👎 for concerns

### For Developers
1. **Complete requirements:** Include all stakeholders before pushing
2. **Regular checks:** Use dashboard to monitor approval progress
3. **Follow up:** Use re-review requests for delayed approvals
4. **Documentation:** Keep requirements updated with feedback

### For Teams
1. **Consistent stakeholders:** Use same usernames across requirements
2. **Clear deadlines:** Set realistic review timeframes
3. **Process training:** Ensure all stakeholders understand approval methods
4. **Regular reviews:** Monitor workflow effectiveness and adjust as needed

## 📈 Metrics and Reporting

**Track these metrics for process improvement:**
- Average approval time per requirement
- Stakeholder response rates
- Requirements rejection/revision rates
- Time from approval to development start
- Overall requirements throughput

Use the Requirements Dashboard and GitHub Issues reporting to monitor these metrics.

---

**🚀 Ready to use the automated approval workflow? Start by pushing your first requirement to GitHub and watch the magic happen!**