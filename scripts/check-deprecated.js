#!/usr/bin/env node
const fs = require('fs');

function findDeprecated(obj, path = '') {
  const found = [];
  if (!obj || typeof obj !== 'object') return found;

  if (obj.deprecated) {
    found.push({ path, name: obj.name || obj.pkg ? obj.pkg?.name || '' : '', deprecated: obj.deprecated });
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        found.push(...findDeprecated(v, `${path}/${key}[${i}]`));
      });
    } else if (val && typeof val === 'object') {
      found.push(...findDeprecated(val, `${path}/${key}`));
    }
  }

  return found;
}

function main() {
  const file = process.argv[2] || 'pnpm-deps.json';
  if (!fs.existsSync(file)) {
    console.error(`Deps file not found: ${file}`);
    process.exit(2);
  }

  const content = fs.readFileSync(file, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error('Failed to parse deps JSON:', err.message);
    process.exit(2);
  }

  const deprecated = findDeprecated(data);
  if (deprecated.length === 0) {
    console.log('No deprecated packages found.');
    process.exit(0);
  }

  console.error('Deprecated packages found:');
  deprecated.forEach(d => {
    console.error(`- ${d.path} ${d.name || ''} => ${d.deprecated}`);
  });
  process.exit(1);
}

main();
