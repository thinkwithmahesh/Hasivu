# Evidence-Based Task Validation Checklist

**Purpose**: Prevent task status inflation by requiring measurable evidence for all completion claims.

## Pre-Task Completion Requirements

### 1. Compilation Evidence ✅
```bash
# REQUIRED: Validate TypeScript compilation before marking any task "complete"
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# ACCEPTANCE CRITERIA: 
# - If task claims error reduction: Must provide before/after counts
# - If task claims "0 errors": Must show evidence of 0 count
# - If task claims "build system working": Must demonstrate successful compilation
```

### 2. Test Execution Evidence ✅
```bash
# REQUIRED: Validate test execution for any claims about functionality
npm test 2>&1 | tee test-results.log

# ACCEPTANCE CRITERIA:
# - If task claims functionality works: Must show passing tests
# - If task claims coverage: Must provide actual coverage reports
# - If task claims integration: Must show working end-to-end tests
```

### 3. Before/After Metrics 📊
**REQUIRED DOCUMENTATION**:
- **Baseline State**: Error count, test results, system state before work
- **Final State**: Error count, test results, system state after work  
- **Delta Analysis**: Specific improvement metrics with evidence
- **Validation Method**: How evidence was collected and verified

### 4. Working Code Validation 🔧
```bash
# REQUIRED: Demonstrate actual functionality
# - Can code compile without errors?
# - Can tests run and pass? 
# - Can system start without crashes?
# - Can claimed features actually execute?
```

## Task Status Criteria

### ✅ "Completed" Status Requirements
- [ ] All TypeScript compilation errors resolved (0 count confirmed)
- [ ] All relevant tests passing (execution evidence provided)
- [ ] Functionality demonstrated through working examples
- [ ] Before/after metrics documented with evidence
- [ ] Code actually deployable and executable

### 🔄 "Review" Status Requirements  
- [ ] Work functionally complete but needs validation
- [ ] Evidence provided for all completion claims
- [ ] Test results support claimed functionality
- [ ] Ready for independent verification

### 📋 "Todo" Status (Default)
- [ ] Work not yet complete or evidence insufficient
- [ ] Claims cannot be substantiated with measurements
- [ ] Compilation errors prevent deployment
- [ ] Tests failing or not executable

## Quality Gates Framework

### Gate 1: Evidence Collection
- **Requirement**: All progress claims backed by tool execution results
- **Validation**: Screenshots, command output, log files, metrics
- **Standard**: No subjective assessments without objective measurements

### Gate 2: Measurement Validation  
- **Requirement**: Before/after metrics for all improvement claims
- **Validation**: Consistent measurement methodology across sessions
- **Standard**: Same tools, same parameters, same validation approach

### Gate 3: Functionality Proof
- **Requirement**: Working demonstrations for all functional claims  
- **Validation**: Code must compile, tests must pass, features must work
- **Standard**: End-to-end validation from compilation to execution

### Gate 4: Progress Tracking
- **Requirement**: Accurate status based on actual completion state
- **Validation**: Status matches evidence, not aspirations or partial work
- **Standard**: Conservative status assignment with evidence backing

## Anti-Patterns to Avoid

### ❌ Status Inflation Examples
1. **False Completion**: Marking tasks "done" without working code
2. **Exaggerated Metrics**: Claiming "7,306 → 0 errors" without evidence
3. **Aspirational Status**: Describing desired state as current reality
4. **Progress Projection**: Claiming success based on future intentions

### ❌ Evidence-Free Claims
1. **Unmeasured Success**: "Build system fully operational" without compilation proof
2. **Quantified Improvements**: Specific error counts without validation
3. **Production Readiness**: Deployment claims without working systems
4. **Functional Claims**: Feature descriptions without working demonstrations

## Implementation Protocol

### Daily Validation Routine
1. **Start Session**: Document current system state (errors, tests, functionality)
2. **Track Changes**: Record all modifications with before/after evidence  
3. **Validate Claims**: Test all functionality and compilation before status changes
4. **Update Tasks**: Status reflects measurable reality, not aspirations
5. **Document Evidence**: All progress backed by tool execution results

### Quality Gate Checkpoints
- **Before Status Change**: Validate evidence supports new status
- **Before Task Completion**: Ensure all acceptance criteria met with proof
- **Before Claims**: Measure actual state vs claimed improvements
- **Before Documentation**: Verify all assertions can be independently validated

## Success Metrics

### Process Health Indicators
- **Task Accuracy**: 100% of "completed" tasks have working functionality
- **Evidence Coverage**: 100% of progress claims backed by measurements  
- **Status Reliability**: Task status accurately reflects system state
- **Measurement Consistency**: Same validation methods across all tasks

### Quality Outcomes
- **Compilation Success**: All "completed" tasks contribute to working build
- **Test Reliability**: All functional claims supported by passing tests
- **Deployment Readiness**: "Production ready" claims backed by deployable code
- **Progress Transparency**: Clear visibility into actual vs claimed progress

---

**CRITICAL REMINDER**: Task status must reflect evidence-based reality, not aspirational descriptions of desired outcomes. When in doubt, err toward conservative status assignment with clear evidence requirements for advancement.