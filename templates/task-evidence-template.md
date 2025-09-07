# Task Evidence Template

## Task Information
- **Task ID:** [Archon Task ID or Reference]
- **Task Title:** [Clear, descriptive title]
- **Completion Date:** [YYYY-MM-DD]
- **Assignee:** [Person/Agent responsible]
- **Task Type:** [build/feature/bugfix/documentation/infrastructure]

## Evidence Summary
**Status:** [COMPLETED/IN-REVIEW/BLOCKED]
**Quality Gate Validation:** [PASSED/FAILED]
**Evidence Level:** [COMPLETE/PARTIAL/MISSING]

## Before State
Document the initial state before work began:

### Technical State
- **TypeScript Errors:** [Count or "N/A"]
- **Test Status:** [Passing/Failing count or "N/A"]
- **Build Status:** [Success/Failed or "N/A"]
- **Performance Metrics:** [If applicable]

### Functionality State
- **Existing Behavior:** [Description of what was working/broken]
- **User Impact:** [Description of user-facing issues]
- **Dependencies:** [What was blocked by this task]

## After State
Document the final state after completion:

### Technical State
- **TypeScript Errors:** 0 (or specific count with explanation)
- **Test Status:** [X/Y tests passing, coverage %]
- **Build Status:** [Success/Failed with details]
- **Performance Metrics:** [Before vs After comparison]

### Functionality State
- **New Behavior:** [Description of what now works]
- **User Impact:** [Description of user-facing improvements]
- **Dependencies Unblocked:** [What can now proceed]

## Validation Evidence

### Automated Validation
```bash
# Quality Gate Validation Results
./scripts/quality-gate-validator.sh [task-type]

# Compilation Check
npx tsc --noEmit --skipLibCheck 2>&1 | grep "error" | wc -l
# Result: [0 for success, >0 for failures]

# Test Results
npm test
# Result: [Pass/Fail with specific test counts]

# Build Validation
npm run build
# Result: [Success/Failed]
```

### Manual Validation
- [ ] **Functionality Testing:** [Describe tests performed]
- [ ] **Integration Testing:** [Describe integration points validated]
- [ ] **Error Handling:** [Describe error scenarios tested]
- [ ] **Performance Testing:** [Describe performance validation]

### Artifacts & Documentation
- **Files Changed:** 
  - [path/to/file1.ts] - [Description of changes]
  - [path/to/file2.ts] - [Description of changes]

- **Documentation Updated:**
  - [ ] README.md updated
  - [ ] API documentation updated
  - [ ] Inline code comments added
  - [ ] Architecture docs updated

- **Test Coverage:**
  - [ ] Unit tests added/updated
  - [ ] Integration tests added/updated
  - [ ] E2E tests added/updated

## Risk Assessment
### Deployment Risk: [LOW/MEDIUM/HIGH]
- **Breaking Changes:** [Yes/No - Description]
- **Database Changes:** [Yes/No - Migration required]
- **API Changes:** [Yes/No - Backward compatibility]
- **Configuration Changes:** [Yes/No - Environment updates needed]

### Rollback Plan
- **Rollback Complexity:** [Simple/Medium/Complex]
- **Rollback Steps:** [Specific steps if rollback needed]
- **Data Recovery:** [Any data migration rollback needed]

## Business Impact
### Value Delivered
- **Primary Benefit:** [Main business value achieved]
- **Secondary Benefits:** [Additional positive impacts]
- **User Experience:** [How users are impacted]

### Success Metrics
- **Technical Metrics:** [Performance improvements, error reduction]
- **Business Metrics:** [Revenue impact, user satisfaction]
- **Operational Metrics:** [Deployment time, maintenance effort]

## Quality Gates Checklist
### Development Quality
- [ ] Code follows project conventions
- [ ] Security best practices applied
- [ ] Error handling implemented
- [ ] Logging added appropriately
- [ ] Performance optimizations applied

### Testing Quality
- [ ] Unit tests written and passing
- [ ] Integration tests verify functionality
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Performance tests pass

### Documentation Quality
- [ ] Code is self-documenting
- [ ] Complex logic explained in comments
- [ ] API documentation updated
- [ ] User-facing documentation updated

### Deployment Quality
- [ ] Configuration externalized
- [ ] Environment-specific settings handled
- [ ] Deployment scripts updated
- [ ] Monitoring/alerting configured

## Review & Approval
### Technical Review
- **Reviewer:** [Name/Role]
- **Review Date:** [YYYY-MM-DD]
- **Status:** [APPROVED/CHANGES-REQUESTED/REJECTED]
- **Comments:** [Reviewer feedback]

### Quality Assurance
- **QA Tester:** [Name/Role]
- **Test Date:** [YYYY-MM-DD]
- **Status:** [PASSED/FAILED]
- **Test Results:** [Link to test results or summary]

### Product Approval
- **Product Owner:** [Name/Role]
- **Approval Date:** [YYYY-MM-DD]
- **Status:** [APPROVED/CHANGES-REQUESTED]
- **Business Validation:** [Meets requirements Yes/No]

## Additional Notes
[Any additional context, gotchas, or important information for future reference]

## Evidence Verification Commands
For future verification of this task completion:

```bash
# Quick validation
./scripts/quality-gate-validator.sh

# Detailed TypeScript check
npx tsc --noEmit --skipLibCheck

# Full test suite
npm test

# Build verification
npm run build

# Specific functionality test
[Any specific commands to verify this feature works]
```

---
**Evidence Report Generated:** [Date/Time]
**Report Location:** [File path]
**Git Commit:** [Commit hash when task completed]