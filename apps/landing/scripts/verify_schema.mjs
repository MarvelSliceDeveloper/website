import fs from 'fs';

const seedContent = fs.readFileSync('backup/seed.sql', 'utf8');
const schemaContent = fs.readFileSync('schema.sql', 'utf8') + '\n' + fs.readFileSync('services-schema.sql', 'utf8');

// Extract all INSERT statements: INSERT INTO public."tableName" ("col1", "col2") VALUES ...
const regex = /INSERT INTO public\."([^"]+)" \(([^)]+)\)/g;

const tableColumns = {};

let match;
while ((match = regex.exec(seedContent)) !== null) {
  const tableName = match[1];
  const cols = match[2].split(',').map(c => c.trim().replace(/"/g, ''));
  if (!tableColumns[tableName]) {
    tableColumns[tableName] = new Set();
  }
  cols.forEach(c => tableColumns[tableName].add(c));
}

console.log('--- Column Verification ---');
const missing = [];
for (const [table, cols] of Object.entries(tableColumns)) {
  for (const col of cols) {
    if (!schemaContent.includes(col) || !schemaContent.includes(table)) {
      missing.push({ table, col });
    }
  }
}

console.log('Potentially missing table/columns in schema.sql:');
console.log(missing);
