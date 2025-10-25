#!/usr/bin/env node

const FileTag = require('../lib');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
FileTag - A Node.js file tagging system

Usage:
  filetag add <file> <tag1> [tag2 ...]     Add tags to a file
  filetag remove <file> <tag1> [tag2 ...]  Remove tags from a file
  filetag list <file>                      List tags for a file
  filetag search <tag1> [tag2 ...] [--all] Search files by tags
  filetag tags                             List all tags
  filetag all                              List all files and their tags
  filetag clear <file>                     Clear all tags from a file
  filetag help                             Show this help message

Options:
  --all        When searching, require all tags to match (AND logic)
  --db <path>  Specify database file path (default: .filetag.json)

Examples:
  filetag add document.pdf work important
  filetag list document.pdf
  filetag search work
  filetag search work important --all
  filetag remove document.pdf important
  `);
}

async function main() {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  // Parse database path option
  let dbPath = '.filetag.json';
  const dbIndex = args.indexOf('--db');
  if (dbIndex !== -1 && args[dbIndex + 1]) {
    dbPath = args[dbIndex + 1];
    args.splice(dbIndex, 2);
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
      console.log(`Tags added to ${filePath}:`);
      console.log(result.join(', '));
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
      console.log(`Remaining tags for ${filePath}:`);
      console.log(result.length > 0 ? result.join(', ') : '(no tags)');
      break;
    }

    case 'list': {
      if (args.length < 2) {
        console.error('Error: list command requires file path');
        process.exit(1);
      }
      const filePath = args[1];
      const tags = await fileTag.getTags(filePath);
      console.log(`Tags for ${filePath}:`);
      console.log(tags.length > 0 ? tags.join(', ') : '(no tags)');
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
      console.log(`Files with tag${tags.length > 1 ? 's' : ''} ${tags.join(', ')} ${matchAll ? '(all)' : '(any)'}:`);
      if (results.length === 0) {
        console.log('(no files found)');
      } else {
        results.forEach(file => console.log(`  ${file}`));
      }
      break;
    }

    case 'tags': {
      const tags = await fileTag.listAllTags();
      console.log('All tags:');
      if (tags.length === 0) {
        console.log('(no tags)');
      } else {
        tags.forEach(tag => console.log(`  ${tag}`));
      }
      break;
    }

    case 'all': {
      const all = await fileTag.listAll();
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
  }
}

main();
