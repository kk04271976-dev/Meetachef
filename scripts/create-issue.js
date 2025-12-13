#!/usr/bin/env node

/**
 * Issue Creation Helper
 * Helps create structured issues for tracking bugs and features
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const type = args[0]; // 'bug' or 'feature'
const title = args[1];
const description = args.slice(2).join(' ') || '';

if (!type || !title) {
  console.log(`
Issue Creation Helper
=====================

Usage: node scripts/create-issue.js <type> <title> [description]

Types:
  bug       Create a bug report
  feature   Create a feature request

Examples:
  node scripts/create-issue.js bug "Login timeout error" "The login process times out after 30 seconds"
  node scripts/create-issue.js feature "Add chef filtering" "Allow users to filter chefs by cuisine type"
  `);
  process.exit(1);
}

const timestamp = new Date().toISOString().split('T')[0];
const issueNumber = Date.now();
const issueDir = join('.github', 'issues');
const issueFile = join(issueDir, `${type}-${issueNumber}.md`);

// Ensure directory exists
if (!existsSync(issueDir)) {
  writeFileSync(issueDir, '', { flag: 'wx' });
}

let content = '';

if (type === 'bug') {
  content = `# [BUG] ${title}

**Created:** ${timestamp}
**Status:** Open
**Priority:** Medium

## Description
${description || 'No description provided'}

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior


## Actual Behavior


## Environment
- OS: 
- Node.js version: 
- Playwright version: 
- Browser: 

## Screenshots
_Add screenshots if applicable_

## Additional Notes


---
**Issue ID:** ${issueNumber}
`;
} else if (type === 'feature') {
  content = `# [FEATURE] ${title}

**Created:** ${timestamp}
**Status:** Open
**Priority:** Medium

## Description
${description || 'No description provided'}

## Motivation
_Why is this feature needed?_

## Proposed Solution
_How should this feature work?_

## Alternatives Considered
_What other approaches were considered?_

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Additional Notes


---
**Issue ID:** ${issueNumber}
`;
} else {
  console.error(`Unknown issue type: ${type}. Use 'bug' or 'feature'.`);
  process.exit(1);
}

try {
  writeFileSync(issueFile, content);
  console.log(`✅ Created issue: ${issueFile}`);
  console.log(`📋 Issue ID: ${issueNumber}`);
  console.log(`\n${content}`);
} catch (error) {
  console.error(`❌ Error creating issue: ${error.message}`);
  process.exit(1);
}

