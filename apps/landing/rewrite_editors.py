import os
import re

files = [
    'AboutPageEditor.jsx',
    'BlogPageEditor.jsx',
    'CareerPageEditor.jsx',
    'ContactPageEditor.jsx',
    'ServicesPageEditor.jsx',
    'TrainingPageEditor.jsx'
]

def slugify(title):
    # Remove HTML entities like &quot;
    title = re.sub(r'&[^;]+;', '', title)
    # Remove non-word chars and replace spaces with hyphens
    title = re.sub(r'[^\w\s-]', '', title).strip().lower()
    return re.sub(r'[-\s]+', '-', title)

for file in files:
    path = os.path.join('src', 'admin', 'pages', file)
    if not os.path.exists(path): continue
    
    with open(path, 'r') as f:
        content = f.read()

    # Find all <SectionAccordion title="...">
    # We will replace them with 
    # {activeTab === 'slug' && ( <div> ... </div> )}
    
    titles = re.findall(r'<SectionAccordion[^>]*title="([^"]+)"', content)
    if not titles:
        continue
        
    tabs = []
    for t in titles:
        tabs.append({"id": slugify(t), "title": t})
        
    # Replace SectionAccordions
    def replacer(match):
        title = match.group(1)
        id_ = slugify(title)
        rest = match.group(2) # attributes like defaultExpanded
        return f"{{activeTab === '{id_}' && (\n        <div className=\"space-y-6\">\n          <h2 className=\"text-xl font-bold text-gray-900 border-b border-gray-200 pb-4 mb-6\">{title}</h2>"

    new_content = re.sub(r'<SectionAccordion[^>]*title="([^"]+)"([^>]*)>', replacer, content)
    new_content = new_content.replace('</SectionAccordion>', '</div>\n      )}')
    
    # We need to insert state: const [activeTab, setActiveTab] = useState('...');
    # Find the top of the component (e.g. `const { dirty, reset } = useDirty(...);` or `const [saving, setSaving]`)
    # We'll just put it right after `export default function ...() {`
    
    first_tab = tabs[0]['id'] if tabs else 'hero'
    state_injection = f"\n  const [activeTab, setActiveTab] = useState('{first_tab}');\n"
    new_content = re.sub(r'(export default function \w+\(\) \{\n)', r'\1' + state_injection, new_content)
    
    # We need to wrap the <form> content in a two-column layout.
    # Currently it's:
    # <form onSubmit={handleSave} className="space-y-6">
    #   ...
    # </form>
    
    # Replace the form tag
    tabs_js = ",\n                ".join([f"{{ id: '{t['id']}', title: \"{t['title']}\" }}" for t in tabs])
    
    sidebar_html = f"""
      <div className="flex gap-6 items-start">
        <div className="w-[220px]">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 space-y-0.5">
              {{[
                {tabs_js}
              ].map(tab => (
                <button
                  key={{tab.id}}
                  type="button"
                  onClick={{() => setActiveTab(tab.id)}}
                  className={{`cursor-pointer w-full flex items-center text-sm font-medium text-left transition-all rounded-lg min-h-[40px] pl-3 pr-2.5 py-2 ${{activeTab === tab.id ? 'bg-admin-600 text-white font-semibold shadow-sm' : 'text-gray-600 hover:bg-admin-50 hover:text-admin-600'}}`}}
                >
                  <span className="flex-1 truncate">{{tab.title}}</span>
                </button>
              ))}}
            </div>
          </nav>
        </div>
        <div className="flex-1 min-w-0">
          <form onSubmit={{handleSave}} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
"""
    
    new_content = re.sub(r'<form[^>]*onSubmit=\{handleSave\}[^>]*>', sidebar_html, new_content)
    
    # We need to close the extra div after </form>
    new_content = new_content.replace('</form>', '</form>\n        </div>\n      </div>')
    
    with open(path, 'w') as f:
        f.write(new_content)
        
    print(f"Updated {file}")

