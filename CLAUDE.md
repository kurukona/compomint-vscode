# Claude Code Assistant Guidelines

## Claude Code Tools

This project uses Claude Code with the following built-in tools:

### Available Tools
- **Task**: Launch agents for complex searches and file operations
- **Bash**: Execute shell commands with timeout support
- **Glob**: Fast file pattern matching with glob patterns
- **Grep**: Content search using regular expressions
- **LS**: List files and directories
- **Read**: Read file contents with line number support
- **Edit**: Exact string replacement in files
- **MultiEdit**: Multiple edits to a single file in one operation
- **Write**: Write new files or overwrite existing ones
- **NotebookRead/NotebookEdit**: Jupyter notebook operations
- **WebFetch**: Fetch and analyze web content
- **TodoRead/TodoWrite**: Task management and tracking
- **WebSearch**: Search the web for current information

### Development Workflow
- Use **Task** tool for complex searches when unsure of file locations
- Use **Glob** and **Grep** for targeted file and content searches
- Prefer **Edit** and **MultiEdit** over **Write** for existing files
- Use **TodoWrite** to track multi-step tasks and progress

## Language Usage Rules

When working on this project, please follow these language conventions:

1. **Code Comments**: Write all code comments in **English**
   - Use clear, concise English for inline comments
   - Document functions and methods in English
   - Keep variable and function names in English

2. **Prompt Outputs**: Respond to prompts in **Korean**
   - All conversational responses should be in Korean
   - Explanations and descriptions should be in Korean
   - Error messages and status updates should be in Korean

3. **Markdown Documentation**: Write all markdown documents in **English**
   - README files should be in English
   - Technical documentation should be in English
   - API documentation should be in English

## Examples

### Code Comments (English)
```javascript
// This function validates Compomint templates
function validateTemplate() {
    // Check for duplicate template IDs
    const templateIds = new Set();
    // ...
}
```

### Prompt Response (Korean)
"템플릿 유효성 검사를 완료했습니다. 중복된 템플릿 ID가 발견되어 수정이 필요합니다."

### Markdown Documentation (English)
```markdown
## Template Validation

This feature validates Compomint templates by checking for:
- Duplicate template IDs
- Syntax errors
- Unbalanced delimiters
```