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

for file in files:
    path = os.path.join('src', 'admin', 'pages', file)
    if not os.path.exists(path): continue
    
    with open(path, 'r') as f:
        content = f.read()
    
    # We want to find all <SectionAccordion title="X"> ... </SectionAccordion>
    # and we want to generate a list of tabs.
    
    # Actually, a simpler way is to maintain the form but just hide the unselected ones.
    # We can inject a state for activeTab, and replace SectionAccordion with a div that only shows if activeTab == 'X'.
    # But wait, we also need to build the left nav!
    
    # Let's extract all titles from SectionAccordion
    titles = re.findall(r'<SectionAccordion[^>]*title="([^"]+)"', content)
    
    if not titles:
        continue
        
    print(f"Refactoring {file}, found titles: {titles}")
    
