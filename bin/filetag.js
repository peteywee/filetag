#!/usr/bin/env node

const FileTag = require('../lib');
const pkg = require('../package.json');

const args = process.argv.slice(2);

/**
 * Print help text.
 * @returns {void}
 */
function printHelp() {
  const helpText = `
FileTag - A Node.js file tagging system

Usage:
  filetag <command> <options>

Commands:
  add <file: string> <tag1: string> [tag2: string ...]   Add tags to a file
  remove <file: string> <tag1: string> [tag2: string ...]   Remove tags from a file
  list <file: string>                                       List tags for a file
  search <tag1: string> [tag2: string ...] [--all]   Search files by tags
  tags                                                  List all tags
  all                                                    List all files and their tags
  clear <file: string>                                    Clear all tags from a file
  help                                                   Show this help message

Options:
  --all        When searching, require all tags to match (AND logic)
  --db <path: string>   Specify database file path (default: .filetag.json)

Examples:
  filetag add document.pdf work important
  filetag list document.pdf
  filetag search work
  filetag search work important --all
  filetag remove document.pdf important
  `;

  console.log(helpText);
}

async function main() {
  const startTime = Date.now();

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  // --version / -v
  if (args.includes('--version') || args.includes('-v')) {
    console.log(pkg.version);
    process.exit(0);
  }

  // Parse database path option and output format
  let dbPath = '.filetag.json';
  const dbIndex = args.indexOf('--db');
  if (dbIndex !== -1 && args[dbIndex + 1]) {
    dbPath = args[dbIndex + 1];
    args.splice(dbIndex, 2);
  }

  // JSON output flag
  const jsonOutput = args.includes('--json');
  if (jsonOutput) {
    // remove the flag so command parsing is simpler later
    const idx = args.indexOf('--json');
    args.splice(idx, 1);
  }

  const command = args[0];
  const fileTag = new FileTag(dbPath);

  try {
    switch (command) {
    case 'add': {
      if (args.length < 3) {
        console.error('Error: add command requires file path and at least one tag');
        process.exit(1);
      }
      const filePath = args[1];
      const tags = args.slice(2);
      const result = await fileTag.addTags(filePath, tags);
      if (jsonOutput) {
        console.log(JSON.stringify({ file: filePath, tags: result }));
      } else {
        console.log(`Tags added to ${filePath}:`);
        console.log(result.join(', '));
      }
      break;
    }

    case 'remove': {
      if (args.length < 3) {
        console.error('Error: remove command requires file path and at least one tag');
        process.exit(1);
      }
      const filePath = args[1];
      const tags = args.slice(2);
      const result = await fileTag.removeTags(filePath, tags);
      if (jsonOutput) {
        console.log(JSON.stringify({ file: filePath, tags: result }));
      } else {
        console.log(`Remaining tags for ${filePath}:`);
        console.log(result.length > 0 ? result.join(', ') : '(no tags)');
      }
      break;
    }

    case 'list': {
      if (args.length < 2) {
        console.error('Error: list command requires file path');
        process.exit(1);
      }
      const filePath = args[1];
      const tags = await fileTag.getTags(filePath);
      if (jsonOutput) {
        console.log(JSON.stringify({ file: filePath, tags }));
      } else {
        console.log(`Tags for ${filePath}:`);
        console.log(tags.length > 0 ? tags.join(', ') : '(no tags)');
      }
      break;
    }

    case 'search': {
      if (args.length < 2) {
        console.error('Error: search command requires at least one tag');
        process.exit(1);
      }
      const matchAll = args.includes('--all');
      const tags = args.slice(1).filter(arg => arg !== '--all');
      const results = await fileTag.findByTags(tags, matchAll);
      if (jsonOutput) {
        console.log(JSON.stringify({ tags, matchAll, files: results }));
      } else {
        console.log(`Files with tag${tags.length > 1 ? 's' : ''} ${tags.join(', ')} ${matchAll ? '(all)' : '(any)'}:`);
        if (results.length === 0) {
          console.log('(no files found)');
        } else {
          results.forEach(file => console.log(`  ${file}`));
        }
      }
      break;
    }

    case 'tags': {
      const tags = await fileTag.listAllTags();
      if (jsonOutput) {
        console.log(JSON.stringify({ tags }));
      } else {
        console.log('All tags:');
        if (tags.length === 0) {
          console.log('(no tags)');
        } else {
          tags.forEach(tag => console.log(`  ${tag}`));
        }
      }
      break;
    }

    case 'all': {
      const all = await fileTag.listAll();
      if (jsonOutput) {
        console.log(JSON.stringify(all));
      } else {
        console.log('All files and tags:');
        const entries = Object.entries(all);
        if (entries.length === 0) {
          console.log('(no files tagged)');
        } else {
          entries.forEach(([file, data]) => {
            console.log(`\n${file}:`);
            console.log(`  Tags: ${data.tags.join(', ') || '(none)'}`);
            console.log(`  Created: ${data.created}`);
            console.log(`  Modified: ${data.modified}`);
          });
        }
      }
      break;
    }

    case 'clear': {
      if (args.length < 2) {
        console.error('Error: clear command requires file path');
        process.exit(1);
      }
      const filePath = args[1];
      await fileTag.clearTags(filePath);
      console.log(`All tags cleared from ${filePath}`);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "filetag help" for usage information');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime}ms`);
  }
}

main();