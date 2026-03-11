import os, base64, json

base = os.path.dirname(os.path.abspath(__file__))

# Files stored as base64 to avoid quoting issues
files_b64 = json.loads(open(os.path.join(base, '_files_data.json')).read())

for fname, b64content in files_b64.items():
    content = base64.b64decode(b64content).decode('utf-8')
    filepath = os.path.join(base, fname)
    with open(filepath, 'w') as f:
        f.write(content)
    lines = content.count(chr(10))
    print(f"Written: {fname} ({lines} lines)")

# Cleanup
os.remove(os.path.join(base, '_files_data.json'))
os.remove(os.path.join(base, '_write_files.py'))
print("Cleanup done")
