# GitHub Issue Templates

This directory contains templates for creating standardized GitHub issues that work with the S-cubed requirements approval workflow.

## 📋 Available Templates

### 1. Requirement Request (`requirement.yml`)
- **Purpose**: Create structured requirement issues for stakeholder review
- **Workflow Integration**: Automatically triggers the requirements approval workflow
- **Labels**: Automatically adds `requirement` and `pending-review` labels

### 2. Requirement Markdown Template (`requirement-markdown.md`)
- **Purpose**: Example markdown format for creating requirements manually
- **Use Case**: When you prefer to write requirements in markdown format
- **Important**: Always ensure the file ends with a newline character

## 🔧 Critical Formatting Requirements

### Stakeholders Section
The stakeholders section is **critical** for the approval workflow to function correctly:

```markdown
## 👥 Stakeholders
@username1
@username2
@username3
```

**Requirements:**
- Must use exactly `## 👥 Stakeholders` as the header (with the emoji)
- Each stakeholder username on a separate line
- Start each username with `@`
- **File must end with a newline character** to prevent parsing issues

### Alternative Stakeholder Headers
The workflow also supports these variations:
- `## Stakeholders`
- `## 👥 Stakeholders` (with extra spaces)
- `Stakeholders:`

## ⚠️ Common Issues and Solutions

### Issue: "No valid stakeholders found after parsing"
**Cause**: Missing newline at end of file causes regex parsing to fail
**Solution**: Ensure your file ends with a newline character

### Issue: Stakeholders not recognized
**Cause**: Incorrect formatting of stakeholders section
**Solutions**:
- Use exact header format: `## 👥 Stakeholders`
- Put each username on a separate line
- Start usernames with `@`
- No extra characters or formatting around usernames

### Issue: Workflow doesn't trigger
**Cause**: Missing required labels
**Solution**: Ensure issue has both `requirement` and `pending-review` labels

## 🧪 Testing Your Templates

Before using templates in production:

1. Create a test issue using the template
2. Verify the stakeholders section is parsed correctly
3. Check that the approval workflow triggers
4. Confirm stakeholders receive notifications

## 📚 Additional Resources

- [Requirements Approval Workflow Documentation](../../docs/GITHUB-REQUIREMENTS-WORKFLOW.md)
- [S-cubed VSCode Extension](../../vscode-extension/)
- [Approval Workflow Configuration](../workflows/requirements-approval.yml)