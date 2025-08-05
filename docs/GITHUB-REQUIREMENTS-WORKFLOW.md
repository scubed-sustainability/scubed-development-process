# GitHub Requirements Automation - Complete Guide

**Complete E2E automation from requirements gathering to task creation**

## 🚀 Quick Setup

### 1. Configure GitHub Repository

Add these settings to your VSCode workspace or user settings:

```json
{
  "scubed.github.owner": "your-github-username-or-org",
  "scubed.github.repo": "your-repository-name",
  "scubed.github.autoSync": false,
  "scubed.github.stakeholderTeam": "stakeholders"
}
```

### 2. GitHub Repository Setup

1. **Create a GitHub repository** (if you don't have one)
2. **Enable Discussions** in your repository: Settings → Features → Check "Discussions"
3. **Add stakeholders as collaborators** with appropriate permissions

### 3. Available Commands

- **`S-cubed: Push Requirements to GitHub`** - Create GitHub issue and discussion from requirements
- **`S-cubed: Sync with GitHub`** - Check for new comments and updates
- **`S-cubed: Check GitHub Feedback`** - View stakeholder feedback and comments

**🔐 Authentication**: Uses VSCode's built-in GitHub authentication - no manual token setup required!

---

## 🎯 Overview

This document outlines the practical implementation of automated requirements management using GitHub and Microsoft Planner integration through the S-cubed VSCode extension.

## 🚀 Complete Workflow

```
1. Developer creates requirements in VSCode
2. Extension auto-creates GitHub issue + discussion
3. Stakeholders collaborate & provide feedback  
4. Approval workflow triggers
5. Auto-create Planner tasks for approved requirements
6. Link everything together for tracking
```

## 🎬 Step-by-Step Practical Example

### Step 1: Developer Experience (VSCode)

Developer working on "User Authentication" feature:

1. Opens VSCode → runs **"S-cubed: Create New Project from Template"**
2. Uses requirements template to document:
   - Business objectives
   - Functional requirements  
   - Acceptance criteria
   - Non-functional requirements
3. Saves `requirements.md` file
4. Runs command: **"S-cubed: Push Requirements to GitHub"**

### Step 2: Automatic GitHub Creation

Your extension automatically creates:

#### GitHub Issue:
```markdown
Title: [REQUIREMENT] User Authentication System

## 📋 Requirement Summary
Users need secure login/logout functionality with email and password

## 🎯 Business Objectives
- Enable user personalization
- Protect user data
- Meet security compliance requirements

## ✅ Acceptance Criteria
- [ ] Email validation on registration
- [ ] Password strength requirements (8+ chars)
- [ ] "Remember me" functionality  
- [ ] Password reset via email
- [ ] Account lockout after 5 failed attempts
- [ ] Session timeout after 30 minutes

## 👥 Stakeholders
@business-analyst @security-lead @ux-designer

## 📊 Priority: High
## 🏷️ Labels: requirement, authentication, pending-review

---
**Auto-generated from VSCode S-cubed Extension**
📂 Source: `/docs/requirements/user-authentication.md`
```

#### GitHub Discussion:
```markdown
Title: 💬 Requirements Review: User Authentication

We need your input on the User Authentication requirements.

**Please review:**
1. Are the business objectives complete?
2. Any missing security requirements?
3. UX considerations for login flow?

**Related Issue:** #123
**Deadline for feedback:** 2025-08-10

@stakeholder-team please provide your feedback by adding comments below.
```

### Step 3: Stakeholder Collaboration (Real GitHub)

**Example stakeholder feedback:**

**Business Analyst comments:**
> "Requirements look good overall. We also need social login (Google, Microsoft) for user convenience. Can we add that?"

**Security Lead comments:**  
> "Need to add two-factor authentication requirement. Also, password reset should expire after 24 hours."

**UX Designer comments:**
> "Should include 'show/hide password' toggle and progress indicator for password strength."

### Step 4: Developer Updates (Back in VSCode)

Extension shows notification: **"3 new comments on User Authentication requirements"**

Developer clicks → sees stakeholder feedback → updates `requirements.md` → extension auto-updates GitHub issue with changes.

### Step 5: Approval Workflow

When stakeholders approve (via GitHub reactions or comments):

```markdown
✅ @business-analyst approved
✅ @security-lead approved  
✅ @ux-designer approved

Status: APPROVED → Ready for Development
```

Extension automatically:
- Changes label to "approved"
- Moves to "Approved" column in project board
- Triggers Planner task creation

### Step 6: Automatic Planner Task Creation

Extension creates Planner tasks:

```
Plan: "User Authentication Feature"

Tasks created:
├── 📋 Backlog
│   ├── "Implement email validation"
│   ├── "Add password strength checker"  
│   ├── "Create login form UI"
│   ├── "Implement 2FA system"
│   └── "Add social login integration"
├── 🔄 In Progress (empty)
├── 🧪 Testing (empty)  
└── ✅ Done (empty)
```

## 🖥️ Developer Experience in VSCode

### S-cubed Activity Bar Panel:
```
📋 Requirements Status
├── ✅ User Authentication (Approved → In Development)
├── 🔄 Payment Processing (Under Review - 2 comments)
├── ⏳ Reporting Dashboard (Pending Stakeholder Review)
└── 📝 User Profile Management (Draft)

🚀 Quick Actions
├── Create New Requirement
├── Sync with GitHub  
├── Check Stakeholder Feedback
└── Create Planner Tasks
```

### Integrated Workflow:
- **Write requirements** → Auto-pushed to GitHub
- **Get notifications** → When stakeholders comment
- **See approval status** → Real-time updates in VSCode
- **Create tasks** → One-click Planner integration

## 🎯 Stakeholder Experience (GitHub Web)

### What Stakeholders See:
```
GitHub Repository: "Project Alpha"

📋 Issues Tab:
├── [REQUIREMENT] User Authentication (👥 3 participants, 🗨️ 5 comments)
├── [REQUIREMENT] Payment Processing (👥 2 participants, 🗨️ 2 comments)  
└── [REQUIREMENT] Reporting (👥 1 participant, 🗨️ 1 comment)

💬 Discussions Tab:
├── Requirements Review: User Authentication
├── Architecture Questions: Database Design
└── Feedback Needed: UI/UX Approach
```

### Email Notifications:
```
Subject: Requirements Review Needed: User Authentication

Hi @security-lead,

Your input is requested on new requirements for User Authentication.

View and comment: https://github.com/yourorg/project/issues/123

Key areas needing your expertise:
- Security requirements validation
- Compliance considerations  
- Risk assessment

Please provide feedback by Aug 10, 2025.
```

## 🔄 Continuous Workflow

### When Requirements Change:
1. Developer updates `requirements.md` in VSCode
2. Extension detects changes → auto-updates GitHub issue
3. Stakeholders get notified of changes
4. Discussion continues → approval process repeats

### Progress Tracking:
```
GitHub Project Board: "Requirements Management"

📝 Requirements Gathering    🔍 Stakeholder Review    ✅ Approved    🚧 In Development
├── New Feature Ideas       ├── User Authentication   ├── Login System  ├── Payment Gateway
├── Enhancement Requests    ├── Reporting Module      ├── User Roles    └── [Moving to Done]
└── Bug Fix Requirements    └── Data Export           └── Audit Logs    
```

## 🛠️ Technical Implementation Preview

```typescript
// What happens when you run "Push Requirements to GitHub"
async function pushRequirementsToGitHub() {
  // 1. Parse requirements.md
  const requirements = await parseRequirementsDoc();
  
  // 2. Create GitHub issue
  const issue = await github.issues.create({
    title: `[REQUIREMENT] ${requirements.title}`,
    body: formatRequirementsForGitHub(requirements),
    labels: ['requirement', 'pending-review'],
    assignees: requirements.stakeholders
  });
  
  // 3. Create discussion for feedback
  const discussion = await github.discussions.create({
    title: `💬 Requirements Review: ${requirements.title}`,
    body: formatDiscussionPost(requirements, issue.number)
  });
  
  // 4. Update project metadata
  await updateProjectMetadata({
    githubIssue: issue.number,
    githubDiscussion: discussion.id,
    status: 'pending-review'
  });
  
  // 5. Show success message
  vscode.window.showInformationMessage(
    `Requirements pushed to GitHub! Issue #${issue.number} created.`,
    'View on GitHub'
  );
}
```

## 💡 Key Benefits

1. **Developer stays in VSCode** - no context switching
2. **Stakeholders use familiar GitHub** - no new tools to learn  
3. **Full audit trail** - every comment, change, approval tracked
4. **Automated task creation** - approved requirements → Planner tasks
5. **Real-time notifications** - everyone stays informed
6. **Version control integration** - requirements live with code

## 🔧 Implementation Requirements

### Prerequisites:
- GitHub repository (free account sufficient)
- Microsoft 365 account for Planner integration
- VSCode with S-cubed extension

### GitHub Setup:
- Repository with Issues and Discussions enabled
- Stakeholders added as collaborators
- GitHub Personal Access Token for API access

### Planner Setup:
- Microsoft 365 Group for project plans
- Team members added to group
- Azure AD app registration for API access

## 📋 Next Steps for Implementation

1. **Phase 1**: GitHub Issues automation
2. **Phase 2**: Discussions and stakeholder workflow
3. **Phase 3**: Approval process automation
4. **Phase 4**: Planner integration
5. **Phase 5**: Real-time notifications and sync

## 🎯 Success Metrics

- **Reduced requirements gathering time** by 50%
- **Improved stakeholder participation** through familiar tools
- **100% audit trail** of all requirements changes
- **Automatic task creation** eliminates manual planning overhead
- **Real-time visibility** into requirements status

---

*This workflow represents the complete E2E automation vision for the S-cubed development process initiative.*