const fs = require('fs');

function updateActions(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add FiEdit3 and FiTrash2 to react-icons/fi if missing
  if (!content.includes('FiEdit3') && content.includes('react-icons/fi')) {
    content = content.replace(/from\s+'react-icons\/fi';/, `, FiEdit3, FiTrash2 } from 'react-icons/fi';`);
    // Need to handle the multiline import correctly. 
    // Let's just do a simpler replacement.
    content = content.replace(/FiArrowLeft,/g, 'FiArrowLeft, FiEdit3, FiTrash2,');
  }

  // If the import is different, just add it on a new line
  if (!content.includes('FiEdit3')) {
    content = content.replace(/import \{([\s\S]*?)\} from 'react-icons\/fi';/, (match, group) => {
      return `import {${group}, FiEdit3, FiTrash2 } from 'react-icons/fi';`;
    });
  }

  // Replace text buttons with icons
  content = content.replace(
    /<button onClick=\{\(\) => startEdit\(row\)\}[^>]+>\s*<span[^>]+>Edit<\/span>\s*<\/button>\s*<button onClick=\{\(\) => deleteCategory\(row\.id\)\}[^>]+>\s*<span[^>]+>Delete<\/span>\s*<\/button>/g,
    `<button onClick={() => startEdit(row)} className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteCategory(row.id)} className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete">
            <FiTrash2 className="w-4 h-4" />
          </button>`
  );

  fs.writeFileSync(file, content);
  console.log('Updated', file);
}

updateActions('src/admin/pages/TrainingCategoriesManager.jsx');
updateActions('src/admin/pages/ServiceCategoriesManager.jsx');
try { updateActions('src/admin/pages/BlogCategoriesManager.jsx'); } catch(e){}
