lines = open('src/ui/styles.css').read()

replacements = {
    # .grid-params
    'gap: 1rem;\n  margin-bottom: 1rem;': 'gap: 0.5rem;\n  margin-bottom: 0.5rem;',
    # label
    'font-size: 0.8rem;\n  font-weight: 600;': 'font-size: 0.65rem;\n  font-weight: 600;',
    # input
    'font-size: 0.9rem;\n  padding: 0.5rem 0.75rem;': 'font-size: 0.75rem;\n  padding: 0.25rem 0.4rem;',
    # .btn-row
    'gap: 0.5rem;\n  align-items: center;': 'gap: 0.25rem;\n  align-items: center;',
    # button
    'font-size: 0.875rem;\n  font-weight: 500;\n  padding: 0.5rem 1rem;': 'font-size: 0.75rem;\n  font-weight: 500;\n  padding: 0.25rem 0.5rem;',
    # .playback-bar
    'padding: 0.5rem 0.75rem;': 'padding: 0.25rem 0.5rem;',
    'margin-top: 0.5rem;': 'margin-top: 0.25rem;',
    # .status-explanation
    'padding: 0.5rem 0.75rem;\n  border-radius: 0 0.375rem 0.375rem 0;\n  font-size: 0.85rem;': 'padding: 0.25rem 0.5rem;\n  border-radius: 0 0.375rem 0.375rem 0;\n  font-size: 0.75rem;',
    'margin-top: 0.75rem;': 'margin-top: 0.25rem;',
    # .fragment-card
    'font-size: 0.95rem;\n  background-color: var(--bg-primary);\n  border: 1px solid var(--border-color);\n  border-radius: 0.375rem;\n  padding: 0.5rem 0.75rem;': 'font-size: 0.8rem;\n  background-color: var(--bg-primary);\n  border: 1px solid var(--border-color);\n  border-radius: 0.375rem;\n  padding: 0.25rem 0.4rem;',
    # .theatre-container
    'gap: 0.5rem;\n  padding: 0.5rem;\n  background-color: var(--bg-primary);\n  border: 1px dashed var(--border-color);\n  border-radius: 0.375rem;\n  min-height: 80px;': 'gap: 0.25rem;\n  padding: 0.35rem;\n  background-color: var(--bg-primary);\n  border: 1px dashed var(--border-color);\n  border-radius: 0.375rem;\n  min-height: 60px;',
    # .alignment-row
    'font-size: 0.95rem;\n  letter-spacing: 0.15em;': 'font-size: 0.8rem;\n  letter-spacing: 0.1em;',
    # .align-label
    'width: 90px;\n  font-size: 0.75rem;': 'width: 65px;\n  font-size: 0.6rem;',
    'width: 75px;\n  font-size: 0.65rem;': 'width: 65px;\n  font-size: 0.6rem;',
    # .char-cell
    'width: 24px;\n  height: 32px;': 'width: 16px;\n  height: 22px;',
    'width: 20px;\n  height: 28px;': 'width: 16px;\n  height: 22px;',
    # .metrics-row
    'gap: 1rem;\n  margin-bottom: 1.25rem;': 'gap: 0.5rem;\n  margin-bottom: 0.5rem;',
    # .metric-card
    'padding: 0.75rem 1rem;': 'padding: 0.35rem 0.5rem;',
    # .metric-title
    'font-size: 0.75rem;\n  text-transform: uppercase;': 'font-size: 0.6rem;\n  text-transform: uppercase;',
    # .metric-value
    'font-size: 1.35rem;\n  font-weight: 700;\n  color: var(--text-primary);\n  margin-top: 0.25rem;': 'font-size: 0.95rem;\n  font-weight: 700;\n  color: var(--text-primary);\n  margin-top: 0.15rem;',
    # .stacked-alignment-view
    'gap: 0.75rem;': 'gap: 0.5rem;',
    # .legend
    'gap: 1rem;\n  font-size: 0.8rem;\n  color: var(--text-secondary);\n  margin-top: 0.75rem;': 'gap: 0.5rem;\n  font-size: 0.65rem;\n  color: var(--text-secondary);\n  margin-top: 0.25rem;',
}

for k, v in replacements.items():
    lines = lines.replace(k, v)

with open('src/ui/styles.css', 'w') as f:
    f.write(lines)
