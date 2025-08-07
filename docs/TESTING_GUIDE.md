# 🧪 GitHub Actions Planner Integration - Testing Guide

## 🎯 **Quick Test Setup**

### **Option 1: GitHub Repository Test (Recommended)**

#### **Step 1: Set Up Repository Secrets**
In your GitHub repository settings, add these secrets:

```bash
# Required secrets (get these from Azure portal)
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-service-principal-client-secret  
AZURE_TENANT_ID=your-azure-tenant-id
PLANNER_PLAN_ID=your-planner-plan-id
```

#### **Step 2: Set Up Repository Variables (Optional)**
```bash
# Optional variables for customization
PLANNER_BUCKET_NAME=Sprint Backlog
PLANNER_DEFAULT_ASSIGNEES=user1@company.com,user2@company.com
```

#### **Step 3: Create Test Issue**
1. Create a new GitHub issue with this content:

```markdown
# Test Requirements for Planner Integration

## 📋 Functional Requirements

1. **User Authentication**
   - **Description:** Secure login system with multi-factor authentication
   - **Acceptance Criteria:**
     - [ ] User can login with email and password
     - [ ] MFA is required for admin accounts
     - [ ] Session timeout after 30 minutes of inactivity
     - [ ] Password complexity requirements enforced

2. **Task Management Dashboard**
   - **Description:** Central interface for managing project tasks
   - **Acceptance Criteria:**
     - [ ] Display all assigned tasks in priority order
     - [ ] Allow filtering by status, priority, and assignee
     - [ ] Enable bulk task operations
     - [ ] Show progress indicators and metrics

3. **API Integration**
   - **Description:** RESTful API for external system integration
   - **Acceptance Criteria:**
     - [ ] Support standard HTTP methods (GET, POST, PUT, DELETE)
     - [ ] Implement proper error handling and status codes
     - [ ] Rate limiting for API endpoints
```

#### **Step 4: Add Labels**
Add these labels to the issue:
- `approved` ✅
- `requirements` 📋

#### **Step 5: Trigger the Workflow**
Comment on the issue with:
```
/create-planner-tasks
```

#### **Expected Result:**
The workflow should:
1. ✅ Parse the requirements into 3 user stories
2. 🔐 Authenticate with Microsoft Graph API
3. 📝 Create 3 tasks in Microsoft Planner
4. 💬 Post a success comment with links to the tasks

---

### **Option 2: Local Script Testing**

#### **Test Script Parsing Only:**
```bash
# Test requirements parsing
node .github/scripts/create-planner-tasks.js "# Test Issue

## 📋 Functional Requirements

1. **Test Feature**
   - **Description:** Simple test feature
   - **Acceptance Criteria:**
     - [ ] Should work correctly
     - [ ] Should handle errors gracefully"
```

#### **Test Enhanced Formatting:**
```bash
# Create a test script
cat > test-formatting.js << 'EOF'
const script = require('./.github/scripts/create-planner-tasks.js');

const testStory = {
    title: 'User Authentication System',
    description: 'Implement secure user authentication',
    acceptanceCriteria: [
        'User can login with email',
        'Password validation works',
        'Session management implemented'
    ],
    priority: 'High',
    estimatedHours: 12,
    labels: ['security', 'backend']
};

const formatted = script.formatTaskForPlannerEnhanced(testStory, 'bucket-123');
console.log('=== FORMATTED TASK ===');
console.log(JSON.stringify(formatted, null, 2));
EOF

node test-formatting.js
```

#### **Test Retry Logic:**
```bash
# Create retry test
cat > test-retry.js << 'EOF'
const script = require('./.github/scripts/create-planner-tasks.js');

async function testRetry() {
    let attempts = 0;
    const failingOperation = async () => {
        attempts++;
        if (attempts <= 2) {
            throw new Error('HTTP 500: Server error');
        }
        return 'Success!';
    };

    try {
        const result = await script.retryWithBackoff(failingOperation, {
            maxRetries: 3,
            baseDelay: 100
        });
        console.log('✅ Retry successful:', result);
        console.log('Total attempts:', attempts);
    } catch (error) {
        console.log('❌ Retry failed:', error.message);
    }
}

testRetry();
EOF

node test-retry.js
```

---

### **Option 3: Mock GitHub Actions Environment**

#### **Create Mock Test:**
```bash
# Create comprehensive test
cat > test-full-workflow.js << 'EOF'
const script = require('./.github/scripts/create-planner-tasks.js');

async function testFullWorkflow() {
    console.log('🧪 Testing Full Planner Integration Workflow\n');
    
    // 1. Test requirements parsing
    console.log('1️⃣ Testing Requirements Parsing...');
    const mockIssueBody = `
# Project Requirements

## 📋 Functional Requirements

1. **Authentication Service**
   - **Description:** Secure user authentication system
   - **Acceptance Criteria:**
     - [ ] JWT token implementation
     - [ ] Password encryption
     - [ ] Session management

2. **Data Processing Pipeline**
   - **Description:** Automated data processing workflow
   - **Acceptance Criteria:**
     - [ ] Input validation
     - [ ] Transform operations
     - [ ] Error handling
     - [ ] Performance monitoring
`;

    const userStories = script.parseRequirementsFromIssue(mockIssueBody);
    console.log(`✅ Parsed ${userStories.length} user stories`);
    
    // 2. Test enhanced formatting
    console.log('\n2️⃣ Testing Enhanced Task Formatting...');
    userStories.forEach((story, index) => {
        const formatted = script.formatTaskForPlannerEnhanced(story, 'test-bucket');
        console.log(`✅ Story ${index + 1}: ${formatted.title}`);
        console.log(`   Priority: ${formatted.priority} (${story.priority})`);
        console.log(`   Checklist: ${formatted.checklist.length} items`);
        console.log(`   Estimated: ${story.estimatedHours} hours`);
    });
    
    // 3. Test batch processing
    console.log('\n3️⃣ Testing Batch Processing...');
    const batchResults = await script.createPlannerTasksBatch(userStories, {
        batchSize: 2,
        batchDelay: 100,
        onProgress: (progress) => {
            console.log(`   Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
        }
    });
    
    console.log(`✅ Batch processing completed:`);
    console.log(`   Tasks created: ${batchResults.tasksCreated}`);
    console.log(`   Batches processed: ${batchResults.batches}`);
    console.log(`   Total time: ${batchResults.totalTime}ms`);
    
    // 4. Test error handling
    console.log('\n4️⃣ Testing Error Handling...');
    const testError = new Error('HTTP 401: Invalid token');
    const errorMessage = script.formatErrorForGitHubEnhanced(testError, {
        operation: 'createTasks',
        taskCount: userStories.length,
        planId: 'test-plan'
    });
    
    console.log('✅ Error message formatted:');
    console.log(errorMessage.substring(0, 200) + '...');
    
    console.log('\n🎉 All tests completed successfully!');
}

testFullWorkflow().catch(console.error);
EOF

node test-full-workflow.js
```

---

## 🚀 **Azure Service Principal Setup**

### **Create Service Principal:**
```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac --name "GitHub-Planner-Integration" --role contributor

# Note down the output:
# - appId (AZURE_CLIENT_ID)
# - password (AZURE_CLIENT_SECRET)  
# - tenant (AZURE_TENANT_ID)
```

### **Grant Planner Permissions:**
1. Go to Azure Active Directory > App registrations
2. Find your service principal
3. Go to API permissions > Add permission
4. Microsoft Graph > Application permissions
5. Add these permissions:
   - `Tasks.ReadWrite.All`
   - `Group.Read.All`
   - `User.Read.All`
6. Click "Grant admin consent"

### **Get Planner Plan ID:**
```bash
# Using Microsoft Graph Explorer or PowerShell
# Visit: https://developer.microsoft.com/en-us/graph/graph-explorer

# Query to find your plans:
GET https://graph.microsoft.com/v1.0/me/planner/plans

# Use the "id" field as PLANNER_PLAN_ID
```

---

## 🎯 **Recommended Testing Sequence**

1. **Start with Option 2** (Local Script Testing) to verify parsing works
2. **Set up Azure credentials** following the service principal guide
3. **Test with Option 1** (GitHub Repository) for full integration
4. **Use Option 3** (Mock Environment) for development and debugging

---

## 🐛 **Troubleshooting**

### **Common Issues:**
- **"Authentication failed"**: Check Azure service principal permissions
- **"Plan not found"**: Verify PLANNER_PLAN_ID is correct
- **"Workflow doesn't trigger"**: Ensure issue has both `approved` and `requirements` labels
- **"Requirements not parsed"**: Check that issue contains `## 📋 Functional Requirements` section

### **Debug Commands:**
```bash
# Check workflow file syntax
npm run test:github-actions

# Test script parsing
node .github/scripts/create-planner-tasks.js "test content"

# Validate environment
node -e "console.log(process.env.AZURE_CLIENT_ID ? '✅ Secrets configured' : '❌ Missing secrets')"
```

---

This testing guide provides multiple ways to validate the integration before production use! 🚀