#!/usr/bin/env node

/**
 * Git Helper Scripts
 * Automates common Git operations for the project
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const command = args[0];

function exec(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'inherit',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`Error executing: ${command}`);
    process.exit(1);
  }
}

function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
}

function createFeatureBranch(featureName) {
  const branchName = `feature/${featureName}`;
  console.log(`🌿 Creating feature branch: ${branchName}`);
  exec(`git checkout develop`);
  exec(`git pull origin develop || true`);
  exec(`git checkout -b ${branchName}`);
  console.log(`✅ Created and switched to ${branchName}`);
}

function createBugfixBranch(bugName) {
  const branchName = `bugfix/${bugName}`;
  console.log(`🐛 Creating bugfix branch: ${branchName}`);
  exec(`git checkout develop`);
  exec(`git pull origin develop || true`);
  exec(`git checkout -b ${branchName}`);
  console.log(`✅ Created and switched to ${branchName}`);
}

function createHotfixBranch(hotfixName) {
  const branchName = `hotfix/${hotfixName}`;
  console.log(`🔥 Creating hotfix branch: ${hotfixName}`);
  exec(`git checkout main`);
  exec(`git pull origin main || true`);
  exec(`git checkout -b ${branchName}`);
  console.log(`✅ Created and switched to ${branchName}`);
}

function commitChanges(type, scope, message) {
  const currentBranch = getCurrentBranch();
  const commitMessage = `${type}${scope ? `(${scope})` : ''}: ${message}`;
  
  console.log(`📝 Committing changes on ${currentBranch}...`);
  exec(`git add .`);
  exec(`git commit -m "${commitMessage}"`);
  console.log(`✅ Committed: ${commitMessage}`);
}

function pushBranch() {
  const currentBranch = getCurrentBranch();
  console.log(`🚀 Pushing ${currentBranch} to origin...`);
  exec(`git push -u origin ${currentBranch}`);
  console.log(`✅ Pushed ${currentBranch} to origin`);
}

function mergeToDevelop() {
  const currentBranch = getCurrentBranch();
  console.log(`🔄 Merging ${currentBranch} to develop...`);
  exec(`git checkout develop`);
  exec(`git merge ${currentBranch} --no-ff -m "merge: merge ${currentBranch} into develop"`);
  exec(`git push origin develop`);
  console.log(`✅ Merged ${currentBranch} to develop`);
}

function mergeToMain() {
  const currentBranch = getCurrentBranch();
  console.log(`🔄 Merging ${currentBranch} to main...`);
  exec(`git checkout main`);
  exec(`git merge ${currentBranch} --no-ff -m "merge: merge ${currentBranch} into main"`);
  exec(`git push origin main`);
  console.log(`✅ Merged ${currentBranch} to main`);
}

// Command routing
switch (command) {
  case 'feature':
    if (!args[1]) {
      console.error('Usage: node scripts/git-helpers.js feature <feature-name>');
      process.exit(1);
    }
    createFeatureBranch(args[1]);
    break;

  case 'bugfix':
    if (!args[1]) {
      console.error('Usage: node scripts/git-helpers.js bugfix <bug-name>');
      process.exit(1);
    }
    createBugfixBranch(args[1]);
    break;

  case 'hotfix':
    if (!args[1]) {
      console.error('Usage: node scripts/git-helpers.js hotfix <hotfix-name>');
      process.exit(1);
    }
    createHotfixBranch(args[1]);
    break;

  case 'commit':
    if (args.length < 3) {
      console.error('Usage: node scripts/git-helpers.js commit <type> [scope] <message>');
      console.error('Example: node scripts/git-helpers.js commit feat login "add automatic login"');
      process.exit(1);
    }
    commitChanges(args[1], args[2]?.startsWith('(') ? args[2] : undefined, args.slice(2).join(' '));
    break;

  case 'push':
    pushBranch();
    break;

  case 'merge-develop':
    mergeToDevelop();
    break;

  case 'merge-main':
    mergeToMain();
    break;

  default:
    console.log(`
Git Helper Scripts
==================

Usage: node scripts/git-helpers.js <command> [options]

Commands:
  feature <name>        Create a new feature branch
  bugfix <name>         Create a new bugfix branch
  hotfix <name>         Create a new hotfix branch
  commit <type> [scope] <message>  Commit changes with conventional format
  push                  Push current branch to origin
  merge-develop         Merge current branch to develop
  merge-main            Merge current branch to main

Examples:
  node scripts/git-helpers.js feature add-chef-filtering
  node scripts/git-helpers.js bugfix fix-login-timeout
  node scripts/git-helpers.js commit feat login "add automatic login"
  node scripts/git-helpers.js push
    `);
    break;
}

