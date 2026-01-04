import os
import re

def get_absolute_path_from_relative(file_path, relative_import):
    # file_path is something like 'src/screens/Home/HomeScreen/utils.tsx'
    # relative_import is something like '../../../actions/SPHandlers'
    file_dir = os.path.dirname(file_path)
    # Join the directory of the file with the relative import
    absolute_path = os.path.normpath(os.path.join(file_dir, relative_import))
    return absolute_path

def replace_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match imports: import ... from '../...' or import '../...'
    # It also handles double quotes and multi-line imports
    # We focus on imports starting with ../
    pattern = r"(import\s+(?:[\w\s{},*]+\s+from\s+)?|export\s+(?:[\w\s{},*]+\s+from\s+)?)['\"](\.\./[^'\"]+)['\"]"

    def replacement(match):
        prefix = match.group(1)
        relative_path = match.group(2)
        
        # Get the absolute path from the root
        abs_path = get_absolute_path_from_relative(file_path, relative_path)
        
        # Normalize path separators to forward slashes just in case
        abs_path = abs_path.replace(os.sep, '/')
        
        # If the absolute path doesn't start with '..', it's inside the project root.
        # We replace it with @/path
        if not abs_path.startswith('..'):
            return f"{prefix}'@/{abs_path}'"
        
        return match.group(0)

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    count = 0
    # Process both src and components, constants, etc. if they are mapped in tsconfig.
    # The tsconfig says "@/src/*": ["./src/*"] and "@/*": ["./*"]
    # So we should probably target everything that ends up being in src/ or other root folders.
    
    # Let's focus on everything for now.
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'android' in dirs:
            dirs.remove('android')
        if 'ios' in dirs:
            dirs.remove('ios')
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.relpath(os.path.join(root, file), '.')
                if replace_imports(file_path):
                    print(f"Updated: {file_path}")
                    count += 1
    print(f"Total files updated: {count}")

if __name__ == "__main__":
    main()
