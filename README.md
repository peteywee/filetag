# filetag

A Node.js file tagging system for organizing and managing files with metadata tags.

## Features

- 🏷️ Add multiple tags to any file
- 🔍 Search files by tags with AND/OR logic
- 📝 Store tags in a simple JSON database
- 🚀 Easy-to-use CLI interface
- 💾 Persistent tag storage
- 📊 List all tags and tagged files

Notes:

- Tags are normalized on input: they are trimmed and converted to lowercase. For example, " Work " and "work" are treated as the same tag.
- Database writes are atomic: saves write to a temporary file and rename into place to reduce risk of corruption.
- CLI supports machine-readable JSON output via the `--json` flag and shows package version with `--version` or `-v`.

## Installation

### Local Installation

We use pnpm. Install dependencies with:

```bash
pnpm install
```

### Global Installation

Install globally with pnpm:

```bash
pnpm install -g .
```

## Usage

### Command Line Interface

```bash
# Add tags to a file
filetag add document.pdf work important

# List tags for a file
filetag list document.pdf

# Search for files with specific tags (OR logic - any tag matches)
filetag search work

# Search for files with all specified tags (AND logic)
filetag search work important --all

# Remove tags from a file
filetag remove document.pdf important

# List all tags in the database
filetag tags

# List all files and their tags
filetag all

# Clear all tags from a file
filetag clear document.pdf

# Show help
filetag help
```

For pnpm users or to run the local CLI directly:

```bash
pnpm exec filetag -- add document.pdf work important

 
```

### Programmatic API

```javascript
const FileTag = require('filetag');

// Create a FileTag instance
const fileTag = new FileTag('.filetag.json');

// Add tags to a file
await fileTag.addTags('document.pdf', ['work', 'important']);

// Get tags for a file
const tags = await fileTag.getTags('document.pdf');
console.log(tags); // ['work', 'important']

// Search for files by tags
const files = await fileTag.findByTags(['work'], false);

// List all tags
const allTags = await fileTag.listAllTags();

// Remove tags
await fileTag.removeTags('document.pdf', ['important']);

// Clear all tags from a file
await fileTag.clearTags('document.pdf');
```

## API Reference

### `new FileTag(dbPath)`

Create a new FileTag instance.

- `dbPath` (string): Path to the JSON database file (default: `.filetag.json`)

### `addTags(filePath, tags)`

Add tags to a file.

- `filePath` (string): Path to the file
- `tags` (array): Array of tag strings
- Returns: `Promise<array>` - Updated array of all tags for the file

### `removeTags(filePath, tags)`

Remove tags from a file.

- `filePath` (string): Path to the file
- `tags` (array): Array of tag strings to remove
- Returns: `Promise<array>` - Remaining tags for the file

### `getTags(filePath)`

Get all tags for a file.

- `filePath` (string): Path to the file
- Returns: `Promise<array>` - Array of tags

### `findByTags(tags, matchAll)`

Find files by tags.

- `tags` (array): Array of tags to search for
- `matchAll` (boolean): If true, file must have all tags; if false, any tag matches
- Returns: `Promise<array>` - Array of file paths

### `listAllTags()`

List all unique tags in the database.

- Returns: `Promise<array>` - Sorted array of all tags

### `listAll()`

Get all files with their tags.

- Returns: `Promise<object>` - Object mapping file paths to their tag data

### `clearTags(filePath)`

Clear all tags from a file.

- `filePath` (string): Path to the file
- Returns: `Promise<void>`

## Database Format

Tags are stored in a JSON file (default: `.filetag.json`) with the following structure:

```json
{
  "/absolute/path/to/file.txt": {
    "tags": ["tag1", "tag2"],
    "created": "2024-01-01T00:00:00.000Z",
    "modified": "2024-01-01T00:00:00.000Z"
  }
}
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
