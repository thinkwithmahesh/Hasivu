# HASIVU Platform - Code Quality Rules

## Formatting and Code Style

1. **Format TypeScript and JavaScript files with Prettier after editing** - Ensure consistent code formatting across the project
2. **Run ESLint with auto-fix on TypeScript and JavaScript files after editing** - Maintain code quality and catch issues early
3. **Check TypeScript types before committing any changes** - Prevent type-related runtime errors

## Testing and Quality Assurance

4. **Run unit tests after modifying test files** - Ensure changes don't break existing functionality
5. **Run type checking after editing TypeScript files** - Catch type errors before they reach production
6. **Run test coverage analysis when tests are modified** - Maintain test coverage standards

## Security and Validation

7. **Run security audit before any file operations** - Check for vulnerable dependencies
8. **Validate database migrations before applying** - Ensure database schema integrity
9. **Check for hardcoded secrets before saving any file** - Prevent security vulnerabilities

## Build and Deployment

10. **Run build process after significant changes** - Ensure the application builds successfully
11. **Generate Swagger documentation after API route changes** - Keep API documentation up-to-date
12. **Run health check after deployment-related changes** - Verify system health

## Git and Version Control

13. **Run git status when finishing any development task** - Show current repository state
14. **Load recent git changes when starting a new session** - Provide context for development work

## Database and Infrastructure

15. **Generate Prisma client after schema changes** - Ensure database types are current
16. **Run database seed after schema migrations** - Maintain consistent development data
