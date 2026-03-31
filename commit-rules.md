# Git Commit Message Convention

When generating, suggesting, or performing git commits, always follow the Conventional Commits specification.

## 1. Structure
Format: `<type>(<scope>): <subject>`
(Leave a blank line before the body and footer if they exist)

## 2. Allowed Types
- `feat`: A new feature (corresponds to MINOR in semantic versioning).
- `fix`: A bug fix (corresponds to PATCH in semantic versioning).
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `build`: Changes that affect the build system or external dependencies (example scopes: gulp, npm, poetry).
- `ci`: Changes to CI configuration files and scripts.
- `chore`: Other changes that don't modify src or test files.
- `revert`: Reverts a previous commit.

## 3. Writing Rules
- **Subject Line**: 
    - Use the imperative, present tense ("add" not "added", "change" not "changed").
    - Max 50 characters.
    - No period (.) at the end.
    - Capitalize the first letter of the subject.
- **Scope**: Should be a noun describing a section of the codebase (e.g., `auth`, `api`, `ui`, `core`).
- **Body**: (Optional) Use it to explain the "what" and "why" of the change, not the "how". Wrap at 72 characters.
- **Breaking Changes**: Start with `BREAKING CHANGE:` in the footer or add a `!` after the type (e.g., `feat!: rewrite auth logic`).

## 4. Agent Instructions
- When I ask you to "commit the changes", first summarize the work and then provide the commit command using this format.
- If there is an associated Issue ID, include `Closes #ID` in the footer.