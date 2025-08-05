# Requirements Validation System

## 🎯 Overview

The S-cubed VSCode extension now includes comprehensive validation to ensure requirements are properly formatted and complete before pushing to GitHub. This prevents workflow failures and ensures consistent, high-quality requirements.

## ✅ **What Gets Validated**

### **1. File Structure Validation**
- ✅ Required sections present (Stakeholders, Business Objectives, etc.)
- ✅ Proper markdown heading format
- ✅ File ends with newline (critical for workflow parsing)
- ✅ Title is present and properly formatted

### **2. Content Validation**
- ✅ **Title**: Non-empty, reasonable length (5-100 characters)
- ✅ **Summary**: Present and descriptive (minimum 10 characters)
- ✅ **Business Objectives**: At least one objective required
- ✅ **Functional Requirements**: At least one requirement required
- ✅ **Acceptance Criteria**: At least one criterion required
- ✅ **Priority**: Valid priority level (low/medium/high)

### **3. Stakeholder Validation (Critical)**
- ✅ **At least one stakeholder** required
- ✅ **Valid GitHub usernames** (1-39 chars, alphanumeric + hyphens)
- ✅ **No consecutive hyphens** or invalid characters
- ✅ **No duplicate stakeholders**
- ✅ **No empty stakeholder entries**

## 🚨 **Validation Levels**

### **❌ ERRORS (Must Fix)**
These will **block** pushing to GitHub:
- Missing required sections (stakeholders, objectives, etc.)
- Invalid GitHub usernames
- Empty or missing critical fields
- File format issues (missing newline, etc.)

### **⚠️ WARNINGS (Recommended)**
These **allow** pushing but suggest improvements:
- Very short titles or descriptions
- Empty list items
- Duplicate stakeholders
- Missing priority setting

## 🔄 **Validation Flow**

```
1. User clicks "Push Requirements to GitHub"
   ↓
2. File Structure Validation
   ↓ (if errors found)
3. Show validation dialog → User fixes → Retry
   ↓ (if valid)
4. Parse requirements file
   ↓
5. Content & Stakeholder Validation  
   ↓ (if errors found)
6. Show validation dialog → User fixes → Retry
   ↓ (if valid or warnings only)
7. User chooses: "Push Anyway" or "Fix Warnings First"
   ↓
8. Push to GitHub (only if validation passes)
```

## 📋 **Validation Dialog Examples**

### **Error Dialog (Blocks Push)**
```
❌ ERRORS - Must be fixed before pushing:
  • stakeholders: Invalid GitHub username(s): invalid@user, --badname
  • businessObjectives: At least one business objective is required
  • title: Title is required and cannot be empty

🚫 Cannot push - Please fix errors first

[Fix Issues] [Cancel]
```

### **Warning Dialog (Allows Push)**
```
⚠️ WARNINGS - Recommended to fix:
  • title: Title is very short
    💡 Consider a more descriptive title (minimum 5 characters)
  • stakeholders: Duplicate stakeholders found  
    💡 Remove duplicate entries

✅ Ready to push (warnings are optional to fix)

[Push Anyway] [Fix Warnings First] [Cancel]
```

## 🛠️ **Implementation Details**

### **ValidationService Class**
Located in `vscode-extension/src/validation-service.ts`

**Key Methods:**
- `validateRequirements()` - Full requirements validation
- `validateFileStructure()` - File format validation  
- `showValidationResults()` - User-friendly validation dialog
- `isValidGitHubUsername()` - GitHub username validation

### **Integration Points**
- `pushRequirementsToGitHub()` in `extension.ts`
- Called before parsing and before GitHub API calls
- Provides user feedback with actionable suggestions

## 🧪 **Testing Validation**

### **Test Invalid Requirements**
Create a test file with issues:
```markdown
# Short

Brief summary.

## 👥 Stakeholders
@invalid--name
@toolongusernamethatexceedsfortychars

## 🎯 Business Objectives

## ⚙️ Functional Requirements  

## ✅ Acceptance Criteria
```

Expected behavior:
- ❌ Multiple validation errors
- 🚫 Push blocked until fixed
- 💡 Clear guidance on what to fix

### **Test Valid Requirements**
Use the template from `.github/ISSUE_TEMPLATE/requirement-markdown.md`

Expected behavior:
- ✅ Validation passes
- 🚀 Push proceeds normally
- ⚡ Fast validation (no unnecessary dialogs)

## 🎯 **Benefits**

### **For Users**
- ✅ **Clear error messages** - Know exactly what to fix
- ✅ **Prevents failures** - Catch issues before GitHub push
- ✅ **Saves time** - No more trial-and-error debugging
- ✅ **Better requirements** - Enforces quality standards

### **For Workflow**
- ✅ **Prevents parsing failures** - All required sections present
- ✅ **Valid stakeholders** - No approval workflow failures
- ✅ **Consistent format** - Reliable parsing and processing
- ✅ **Proper newlines** - No regex parsing issues

### **For Team**
- ✅ **Quality standards** - Consistent requirement format
- ✅ **Reduced support** - Fewer "why didn't it work" questions
- ✅ **Better collaboration** - All stakeholders properly notified
- ✅ **Professional output** - Clean, complete requirements

## ⚙️ **Configuration**

### **VSCode Settings**
```json
{
  "scubed.validation.strictMode": true,        // Block on warnings too
  "scubed.validation.checkGitHubUsers": true,  // Validate usernames online
  "scubed.validation.minimumTitle": 5,         // Minimum title length
  "scubed.validation.minimumSummary": 10       // Minimum summary length
}
```

### **Future Enhancements**
- 🔄 **Online username validation** - Check if GitHub users exist
- 🔄 **Template compliance** - Validate against specific templates
- 🔄 **Custom validation rules** - Team-specific requirements
- 🔄 **Auto-fix suggestions** - Automatically fix common issues

## 🐛 **Troubleshooting**

### **Common Issues**

**Issue: "File must end with newline"**
- **Cause**: File doesn't end with `\n` character
- **Fix**: Add empty line at end of file
- **Prevention**: Use templates which have proper endings

**Issue: "Invalid GitHub username"**
- **Cause**: Username has invalid characters or format
- **Fix**: Use valid GitHub username (alphanumeric + hyphens only)
- **Check**: Visit `https://github.com/username` to verify

**Issue: "Missing required section"**
- **Cause**: Required markdown section not found
- **Fix**: Add proper section header (e.g., `## 👥 Stakeholders`)
- **Reference**: Use issue templates for correct format

### **Validation Not Working?**
1. Check VS Code Developer Console for errors
2. Ensure extension is latest version
3. Restart VS Code if validation seems stuck
4. Report issues on GitHub with example file

---

**The validation system ensures high-quality requirements and prevents common workflow failures, making the S-cubed process more reliable and user-friendly.** ✨