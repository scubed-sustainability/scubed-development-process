#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mock GitHub context and core outputs
const mockContext = {
  issue: { number: 123 },
  payload: { issue: { body: '' } }
};

const mockCore = {
  outputs: {},
  setOutput: function(name, value) {
    this.outputs[name] = value;
    console.log(`📤 Output: ${name} = ${value}`);
  }
};

// Simulate the main workflow logic
function checkApprovals(issueBody, comments = [], reactions = []) {
  console.log('🔍 Starting approval check...\n');
  
  // Extract stakeholders from issue body - try multiple patterns
  let stakeholderMatch = issueBody.match(/## 👥 Stakeholders\n(.*?)(?=\n##|$)/s);
  if (!stakeholderMatch) {
    // Try alternative patterns
    stakeholderMatch = issueBody.match(/## Stakeholders\n(.*?)(?=\n##|$)/s) || 
                      issueBody.match(/##\s*👥\s*Stakeholders\s*\n(.*?)(?=\n##|$)/s) ||
                      issueBody.match(/Stakeholders:?\s*\n(.*?)(?=\n##|$)/s);
  }
  
  if (!stakeholderMatch) {
    console.log('❌ No stakeholders section found in issue');
    // Set outputs even when no stakeholders found
    mockCore.setOutput('approved', 'false');
    mockCore.setOutput('approval-count', '0');
    mockCore.setOutput('total-stakeholders', '0');
    mockCore.setOutput('approved-by', '');
    mockCore.setOutput('stakeholders', '');
    return { approved: false, reason: 'No stakeholders defined' };
  }
  
  const stakeholders = stakeholderMatch[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('@') || line.includes('@'))
    .map(line => {
      // Handle both @username and plain username formats - include hyphens, underscores, numbers
      const match = line.match(/@([\w-]+)/);
      return match ? match[1] : line.replace('@', '').trim();
    })
    .filter(name => name.length > 0); // Remove empty strings
  
  console.log('👥 Stakeholders found:', stakeholders);
  
  if (stakeholders.length === 0) {
    console.log('❌ No valid stakeholders found after parsing');
    // Set outputs even when no valid stakeholders found
    mockCore.setOutput('approved', 'false');
    mockCore.setOutput('approval-count', '0');
    mockCore.setOutput('total-stakeholders', '0');
    mockCore.setOutput('approved-by', '');
    mockCore.setOutput('stakeholders', '');
    return { approved: false, reason: 'No valid stakeholders found' };
  }
  
  // Check for approval patterns in comments
  const approvalPatterns = [
    /approved?/i,           // Simple "approved" or "approve" (case insensitive)
    /✅.*approved?/i,       // "✅ Approved" 
    /approved?.*✅/i,       // "Approved ✅"
    /lgtm/i,               // "LGTM" or "lgtm"
    /looks good to me/i,   // "Looks good to me"
    /👍.*approve/i,        // "👍 approve"
    /approve.*👍/i,        // "approve 👍"
    /yes/i,                // Simple "yes"
    /ok/i,                 // Simple "ok" or "OK"
    /good to go/i          // "Good to go"
  ];
  
  const approvedBy = new Set();
  
  // Check comments for approvals
  for (const comment of comments) {
    const commentBody = comment.body.toLowerCase();
    const author = comment.user.login;
    
    console.log(`💬 Checking comment from ${author}: "${comment.body.substring(0, 50)}..."`);
    
    // Check if author is a stakeholder
    if (stakeholders.includes(author)) {
      // Check for approval patterns
      const hasApproval = approvalPatterns.some(pattern => pattern.test(commentBody));
      if (hasApproval) {
        approvedBy.add(author);
        console.log(`✅ Approval found from ${author}`);
      }
    } else {
      console.log(`⚠️  ${author} is not a stakeholder`);
    }
  }
  
  // Check reactions (👍 reactions as approvals)
  for (const reaction of reactions) {
    if (reaction.content === '+1' && stakeholders.includes(reaction.user.login)) {
      approvedBy.add(reaction.user.login);
      console.log(`👍 Thumbs up approval from ${reaction.user.login}`);
    }
  }
  
  const allApproved = stakeholders.every(stakeholder => approvedBy.has(stakeholder));
  const approvalCount = approvedBy.size;
  const totalStakeholders = stakeholders.length;
  
  console.log(`\n📊 Results:`);
  console.log(`   Approvals: ${approvalCount}/${totalStakeholders}`);
  console.log(`   Approved by: ${Array.from(approvedBy).join(', ') || 'None'}`);
  console.log(`   All approved: ${allApproved}`);
  
  // Set outputs for next steps
  mockCore.setOutput('approved', allApproved.toString());
  mockCore.setOutput('approval-count', approvalCount.toString());
  mockCore.setOutput('total-stakeholders', totalStakeholders.toString());
  mockCore.setOutput('approved-by', Array.from(approvedBy).join(', '));
  mockCore.setOutput('stakeholders', stakeholders.join(', '));
  
  return {
    approved: allApproved,
    approvalCount,
    totalStakeholders,
    approvedBy: Array.from(approvedBy),
    stakeholders
  };
}

// Test the conditional logic
function testConditionalLogic(outputs) {
  console.log('\n🔀 Testing conditional logic...\n');
  
  const approved = outputs.approved === 'true';
  const approvalCount = parseInt(outputs['approval-count']) || 0;
  const totalStakeholders = parseInt(outputs['total-stakeholders']) || 0;
  
  console.log('🎯 Update issue status to approved:');
  if (approved) {
    console.log('✅ WOULD RUN: Remove pending-review, add approved + ready-for-development labels');
    console.log('✅ WOULD RUN: Add approval confirmation comment');
  } else {
    console.log('❌ SKIPPED: approved != true');
  }
  
  console.log('\n🎯 Update approval progress:');
  if (!approved) {
    console.log('✅ WOULD RUN: Update approval progress');
    if (totalStakeholders === 0) {
      console.log('   → Add "No Stakeholders Defined" comment');
    } else if (approvalCount > 0) {
      console.log('   → Add progress update comment');
    } else {
      console.log('   → No comment (no approvals yet)');
    }
  } else {
    console.log('❌ SKIPPED: approved == true');
  }
}

// Test scenarios
function runTests() {
  console.log('🧪 TESTING REQUIREMENTS APPROVAL WORKFLOW\n');
  console.log('='.repeat(50));
  
  // Test 1: Load the actual test file
  console.log('\n📋 TEST 1: Real issue from test-requirement-approval.md');
  const testIssueContent = fs.readFileSync(path.join(__dirname, 'test-requirement-approval.md'), 'utf8');
  
  const mockComments = [
    { user: { login: 'avani-shah-s3' }, body: 'This looks good, approved!' },
    { user: { login: 'other-user' }, body: 'I also approve this' }
  ];
  
  const result1 = checkApprovals(testIssueContent, mockComments, []);
  testConditionalLogic(mockCore.outputs);
  
  // Test 2: No stakeholders
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 TEST 2: Issue with no stakeholders section');
  const noStakeholdersIssue = `# Test Issue\nSome content without stakeholders`;
  
  const result2 = checkApprovals(noStakeholdersIssue, [], []);
  testConditionalLogic(mockCore.outputs);
  
  // Test 3: Multiple stakeholders, partial approval
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 TEST 3: Multiple stakeholders, partial approval');
  const multiStakeholderIssue = `# Test Issue\n\n## 👥 Stakeholders\n@user1\n@user2\n@user3`;
  
  const partialComments = [
    { user: { login: 'user1' }, body: 'LGTM!' },
    { user: { login: 'user2' }, body: 'Needs changes' }
  ];
  
  const result3 = checkApprovals(multiStakeholderIssue, partialComments, []);
  testConditionalLogic(mockCore.outputs);
  
  // Test 4: Test various approval phrases
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 TEST 4: Various approval phrases');
  const singleStakeholderIssue = `# Test Issue\n\n## 👥 Stakeholders\n@test-user`;
  
  const variousApprovals = [
    { user: { login: 'test-user' }, body: 'yes' },
    { user: { login: 'test-user' }, body: 'OK' },
    { user: { login: 'test-user' }, body: 'LGTM!' },
    { user: { login: 'test-user' }, body: '✅ Approved' },
    { user: { login: 'test-user' }, body: 'This looks good to go' }
  ];
  
  // Test each approval phrase individually
  const approvalPhrases = ['yes', 'OK', 'LGTM!', '✅ Approved', 'This looks good to go'];
  approvalPhrases.forEach((phrase, index) => {
    console.log(`\n   Testing phrase: "${phrase}"`);
    const singleComment = [{ user: { login: 'test-user' }, body: phrase }];
    const testResult = checkApprovals(singleStakeholderIssue, singleComment, []);
    console.log(`   Result: ${testResult.approved ? '✅ APPROVED' : '❌ NOT APPROVED'}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests();