const fs = require('fs');

function replaceNav(file, replaceFunc) {
  let content = fs.readFileSync(file, 'utf8');
  content = replaceFunc(content);
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}

replaceNav('src/admin/pages/HomePageEditor.jsx', (content) => {
  return content
    .replace(
      /bg-admin-50 text-admin-600 font-semibold border-l-\[3px\] border-admin-600 -ml-\[1px\]/g,
      "bg-admin-600 text-white font-semibold shadow-sm"
    )
    .replace(
      /text-gray-600 hover:bg-admin-50 hover:text-admin-600 border-l-\[3px\] border-transparent/g,
      "text-gray-600 hover:bg-admin-50 hover:text-admin-600"
    )
    .replace(
      /bg-admin-50 text-admin-600/g,
      "bg-admin-600 text-white shadow-sm"
    )
    .replace(
      /selectedNav\.key === item\.key \? 'text-admin-600' : 'text-gray-400'/g,
      "selectedNav.key === item.key ? 'text-white' : 'text-gray-400'"
    );
});

replaceNav('src/admin/pages/ServiceEditor.jsx', (content) => {
  return content
    .replace(
      /bg-admin-50 text-admin-600 font-semibold border-l-\[3px\] border-admin-600 -ml-\[1px\]/g,
      "bg-admin-600 text-white font-semibold shadow-sm"
    )
    .replace(
      /text-neutral-600 hover:bg-admin-50 hover:text-admin-600 border-l-\[3px\] border-transparent/g,
      "text-neutral-600 hover:bg-admin-50 hover:text-admin-600"
    )
    .replace(
      /bg-admin-50 text-admin-600/g,
      "bg-admin-600 text-white shadow-sm"
    )
    .replace(
      /tab === t \? "text-admin-600" : "text-neutral-400"/g,
      "tab === t ? 'text-white' : 'text-neutral-400'"
    );
});

replaceNav('src/admin/pages/CourseEditor.jsx', (content) => {
  return content
    .replace(
      /bg-admin-50 text-admin-600 font-semibold border-l-\[3px\] border-admin-600 -ml-\[1px\]/g,
      "bg-admin-600 text-white font-semibold shadow-sm"
    )
    .replace(
      /text-neutral-600 hover:bg-admin-50 hover:text-admin-600 border-l-\[3px\] border-transparent/g,
      "text-neutral-600 hover:bg-admin-50 hover:text-admin-600"
    )
    .replace(
      /bg-admin-50 text-admin-600/g,
      "bg-admin-600 text-white shadow-sm"
    )
    .replace(
      /tab === t \? "text-admin-600" : "text-neutral-400"/g,
      "tab === t ? 'text-white' : 'text-neutral-400'"
    );
});
