const fs = require('fs');
const path = require('path');

const adminPagesDir = path.join(__dirname, 'src', 'admin', 'pages');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Form Cancel buttons
  // Match buttons containing Cancel text.
  content = content.replace(/(<button[^>]*?)text-gray-\d+(.*?>\s*Cancel\s*<\/button>)/gi, '$1text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm font-medium px-4 py-2$2');
  
  // Specific case for NavMenuManager Cancel button which has `text-sm text-gray-400 hover:text-gray-600 transition-colors`
  content = content.replace(/(<button[^>]*?)text-gray-400 hover:text-gray-600([^>]*?>\s*Cancel\s*<\/button>)/gi, '$1px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm$2');
  
  // Other Cancel buttons (white background ones)
  content = content.replace(/text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300([^>]*?>\s*Cancel\s*<\/button>)/gi, 'text-white bg-red-600 hover:bg-red-700 shadow-sm border-transparent$1');

  // 2. Add / Save / Update buttons in forms
  // Let's standardise the primary form buttons (indigo to blue)
  content = content.replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-blue-600 hover:bg-blue-700');
  content = content.replace(/bg-indigo-500 hover:bg-indigo-600/g, 'bg-blue-600 hover:bg-blue-700');
  content = content.replace(/text-indigo-600 bg-indigo-50 hover:bg-indigo-100/g, 'text-blue-600 bg-blue-50 hover:bg-blue-100');

  // 3. Table Action Icons - Delete
  // Often it's text-destructive-400 or text-red-500 or text-gray-400 hover:text-red-500
  // Let's make all delete buttons explicitly red.
  content = content.replace(/text-gray-300 hover:text-red-500 hover:bg-red-50/g, 'text-red-500 hover:text-red-600 hover:bg-red-50');
  content = content.replace(/text-gray-400 hover:text-red-500/g, 'text-red-500 hover:text-red-600');
  content = content.replace(/text-destructive-400 hover:text-destructive-600/g, 'text-red-500 hover:text-red-600');
  content = content.replace(/text-red-400 hover:text-red-600/g, 'text-red-500 hover:text-red-600');

  // If there's a text "Delete" in tables without icon, let's leave it as is or replace if we find specific ones. 
  // Mostly they already use FiTrash2. Just need to ensure they are red.

  // 4. Table Action Icons - Edit
  // Edit is currently often text-gray-300 hover:text-amber-500 hover:bg-amber-50 or text-gray-400 hover:text-indigo-600
  // The user wants edit to be blue and pencil icon. FiEdit3 is the pencil icon.
  content = content.replace(/text-gray-300 hover:text-amber-500 hover:bg-amber-50/g, 'text-blue-500 hover:text-blue-600 hover:bg-blue-50');
  content = content.replace(/text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/g, 'text-blue-500 hover:text-blue-600 hover:bg-blue-50');
  content = content.replace(/text-gray-400 hover:text-indigo-600/g, 'text-blue-500 hover:text-blue-600');
  
  // Replace text "Edit" with FiEdit3 where applicable? No, just ensuring the icons are blue.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(adminPagesDir);
files.forEach(file => {
  if (file.endsWith('.jsx')) {
    refactorFile(path.join(adminPagesDir, file));
  }
});
