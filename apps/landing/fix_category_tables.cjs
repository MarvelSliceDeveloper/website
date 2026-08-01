const fs = require('fs');

function processFile(filename, iconComponent) {
  let content = fs.readFileSync(filename, 'utf8');
  
  // Replace the cancel button with the destructive AdminButton if it exists
  content = content.replace(
    /<AdminButton type="button" onClick=\{resetForm\} variant="secondary" size="md">\s*Cancel\s*<\/AdminButton>/g,
    `<AdminButton type="button" onClick={resetForm} variant="destructive" size="md">\n              Cancel\n            </AdminButton>`
  );
  content = content.replace(
    /<button type="button" onClick=\{resetForm\}\s*className="[^"]*bg-red-600[^"]*">[\s\S]*?Cancel[\s\S]*?<\/button>/g,
    `<AdminButton type="button" onClick={resetForm} variant="destructive" size="md">\n              Cancel\n            </AdminButton>`
  );

  // If AdminButton isn't imported, import it
  if (!content.includes('import AdminButton')) {
    content = content.replace(
      /import PageShell from "\.\.\/components\/ui\/PageShell";/,
      `import PageShell from "../components/ui/PageShell";\nimport AdminButton from "../components/AdminButton";`
    );
  }

  // Import DataTable and Badge
  if (!content.includes('import DataTable')) {
    content = content.replace(
      /import PageShell from "\.\.\/components\/ui\/PageShell";/,
      `import PageShell from "../components/ui/PageShell";\nimport DataTable from '../components/ui/DataTable';\nimport Badge from '../components/Badge';\nimport EmptyState from '../components/EmptyState';`
    );
  }

  // Add the columns definition before return
  const columnsDef = `
  const columns = [
    {
      header: 'Name',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-neutral-900">{row.name}</p>
          <p className="text-xs text-neutral-500">/{row.slug}</p>
        </div>
      )
    },
    {
      header: 'Description',
      cell: (row) => <p className="text-sm text-neutral-600 truncate max-w-xs">{row.description || '-'}</p>
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status ? 'success' : 'default'}>
          {row.status ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Order',
      accessor: 'sort_order'
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => startEdit(row)} className="p-1.5 text-neutral-400 hover:text-admin-600 hover:bg-admin-50 rounded-lg transition-colors">
            <span className="text-xs font-medium px-2 py-1 bg-white border border-neutral-200 rounded-md">Edit</span>
          </button>
          <button onClick={() => deleteCategory(row.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <span className="text-xs font-medium text-red-600 px-2 py-1 bg-white border border-red-200 rounded-md">Delete</span>
          </button>
        </div>
      )
    }
  ];
`;
  if (!content.includes('const columns = [')) {
    content = content.replace(/(\s+return \(\s+<PageShell)/, columnsDef + '$1');
  }

  // Replace the old list with DataTable
  const listRegex = /\{categories\.length === 0 \? \([\s\S]*?<div className="bg-white rounded-lg border border-admin-200 overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*\)/g;
  
  if (content.match(listRegex)) {
    content = content.replace(
      listRegex,
      `{categories.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={${iconComponent}}
            title="No categories yet"
            description="Get started by adding your first category."
          />
        </div>
      ) : (
        <DataTable columns={columns} data={categories} searchable={false} />
      )}`
    );
  }

  fs.writeFileSync(filename, content);
  console.log('Updated ' + filename);
}

processFile('src/admin/pages/TrainingCategoriesManager.jsx', 'FiGrid');
processFile('src/admin/pages/ServiceCategoriesManager.jsx', 'FiServer');
try {
  processFile('src/admin/pages/BlogCategoriesManager.jsx', 'FiFileText');
} catch(e) {}
