import re

with open('src/ui/styles.css', 'r') as f:
    content = f.read()

def replace(pattern, replacement):
    global content
    content = re.sub(pattern, replacement, content)

# General layout
replace(r'padding: 0\.75rem;(\n})', r'padding: 0.5rem;\1') # body padding
replace(r'(body \{\n.*?padding:) 1\.5rem;', r'\1 0.5rem;')

# .app-container
replace(r'(\.app-container \{[^}]*?gap:) 1rem;', r'\1 0.75rem;')

# .main-layout
replace(r'(\.main-layout \{[^}]*?gap:) 1rem;', r'\1 0.75rem;')
replace(r'grid-template-columns: 380px 1fr;', r'grid-template-columns: 320px 1fr;') # Make RHS slightly wider

# Layout RHS and LHS
replace(r'(\.layout-lhs \{[^}]*?gap:) 0\.75rem;', r'\1 0.5rem;')
replace(r'(\.layout-rhs \{[^}]*?gap:) 0\.75rem;', r'\1 0.5rem;')

# Fixed Panel min-height
replace(r'(\.fixed-panel \{\n\s*min-height:) 180px;', r'\1 140px;')

# Header
replace(r'(header \{\n.*?padding-bottom:) 0\.5rem;', r'\1 0.25rem;')
replace(r'(header h1 \{\n.*?font-size:) 1\.25rem;', r'\1 1.1rem;')
replace(r'(header p \{\n.*?font-size:) 0\.85rem;', r'\1 0.75rem;')
replace(r'(header p \{\n.*?)margin-top: 0\.25rem;', r'\1margin-top: 0.15rem;')

# Panels
replace(r'(\.panel \{\n.*?padding:) 0\.75rem;', r'\1 0.5rem;')
replace(r'(\.panel-title \{\n.*?font-size:) 0\.9rem;', r'\1 0.85rem;')
replace(r'(\.panel-title \{\n.*?)margin-bottom: 0\.5rem;', r'\1margin-bottom: 0.35rem;')

# Forms and buttons
replace(r'(label \{\n.*?font-size:) 0\.75rem;', r'\1 0.65rem;')
replace(r'(input\[type=\'text\'\].*?padding:) 0\.35rem 0\.5rem;', r'\1 0.25rem 0.4rem;')
replace(r'(input\[type=\'text\'\].*?font-size:) 0\.85rem;', r'\1 0.75rem;')

replace(r'(button \{\n.*?padding:) 0\.35rem 0\.75rem;', r'\1 0.25rem 0.5rem;')
replace(r'(button \{\n.*?font-size:) 0\.8rem;', r'\1 0.75rem;')

# Fragment cards
replace(r'(\.fragment-card \{\n.*?padding:) 0\.5rem 0\.75rem;', r'\1 0.25rem 0.5rem;')
replace(r'(\.fragment-card \{\n.*?font-size:) 0\.95rem;', r'\1 0.8rem;')

# Playback controls
replace(r'(\.playback-bar \{\n.*?padding:) 0\.5rem 0\.75rem;', r'\1 0.35rem 0.5rem;')
replace(r'(\.playback-bar \{\n.*?)margin-top: 0\.5rem;', r'\1margin-top: 0.25rem;')

# Status explanation
replace(r'(\.status-explanation \{\n.*?padding:) 0\.5rem 0\.75rem;', r'\1 0.35rem 0.5rem;')
replace(r'(\.status-explanation \{\n.*?font-size:) 0\.85rem;', r'\1 0.75rem;')
replace(r'(\.status-explanation \{\n.*?)margin-top: 0\.75rem;', r'\1margin-top: 0.25rem;')

# Theater
replace(r'(\.theatre-container \{\n.*?gap:) 0\.5rem;', r'\1 0.25rem;')
replace(r'(\.theatre-container \{\n.*?padding:) 0\.5rem;', r'\1 0.35rem;')

replace(r'(\.align-label \{\n.*?width:) 90px;', r'\1 65px;')
replace(r'(\.align-label \{\n.*?font-size:) 0\.75rem;', r'\1 0.6rem;')

replace(r'(\.alignment-row \{\n.*?font-size:) 0\.95rem;', r'\1 0.8rem;')
replace(r'(\.char-cell \{\n.*?width:) 20px;', r'\1 16px;')
replace(r'(\.char-cell \{\n.*?height:) 28px;', r'\1 22px;')

# Metrics
replace(r'(\.metrics-row \{\n.*?gap:) 1rem;', r'\1 0.5rem;')
replace(r'(\.metrics-row \{\n.*?)margin-bottom: 1\.25rem;', r'\1margin-bottom: 0.5rem;')

replace(r'(\.metric-card \{\n.*?padding:) 0\.75rem 1rem;', r'\1 0.35rem 0.5rem;')
replace(r'(\.metric-title \{\n.*?font-size:) 0\.75rem;', r'\1 0.6rem;')
replace(r'(\.metric-value \{\n.*?font-size:) 1\.35rem;', r'\1 0.95rem;')
replace(r'(\.metric-value \{\n.*?)margin-top: 0\.25rem;', r'\1margin-top: 0.15rem;')

# Legend
replace(r'(\.legend \{\n.*?gap:) 0\.75rem;', r'\1 0.5rem;')
replace(r'(\.legend \{\n.*?font-size:) 0\.75rem;', r'\1 0.65rem;')
replace(r'(\.legend \{\n.*?)margin-top: 0\.5rem;', r'\1margin-top: 0.25rem;')

with open('src/ui/styles.css', 'w') as f:
    f.write(content)
