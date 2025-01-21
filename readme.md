# Project Bolt

A modern web development project using cutting-edge technologies.

## Features

- Modern technology stack
- Modular architecture
- Scalable design
- Easy deployment

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/project-bolt.git
cd project-bolt
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
project/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   └── styles/
└── package.json
```

## Available Scripts

- `npm run dev` - Starts development server
- `npm run build` - Creates production build
- `npm run test` - Runs test suite
- `npm run lint` - Runs linting

## MDX Editor Component

The project includes a powerful MDX editor component that provides a modern editing experience for creating and previewing GitHub README files and other Markdown content.

### Editor Features

- **Real-time Preview**: Side-by-side editing with live preview
- **Syntax Highlighting**: Support for Markdown and code blocks
- **Theme Support**: Light and dark mode themes
- **Auto-formatting**: Built-in Markdown formatting capabilities
- **Error Handling**: Real-time error detection and highlighting
- **File Operations**:
  - Upload existing Markdown files
  - Copy content to clipboard
  - Save content locally

### Editor Controls

- 💾 Save - Save current content
- 📝 Format - Auto-format the document
- ↩️ Word Wrap - Toggle word wrapping
- 🔢 Line Numbers - Toggle line numbers
- 📊 Minimap - Toggle code minimap
- 📤 Upload - Import Markdown files
- 📋 Copy - Copy content to clipboard
- 🌓 Theme - Switch between light/dark themes

### Technical Features

- Monaco Editor integration
- MDX compilation with next-mdx-remote
- Support for GitHub Flavored Markdown
- Custom component mapping for enhanced rendering
- Image handling with fallback support
- Code syntax highlighting
- Responsive layout with resizable panels

### Usage Example

```jsx
import MDXEditor from "@/components/mdx-editor";

export default function Page() {
  return <MDXEditor />;
}
```

### Supported Markdown Features

- Headers (H1-H6)
- Lists (ordered and unordered)
- Links and Images
- Code blocks with syntax highlighting
- Tables
- Task lists
- GitHub-style badges
- Embedded HTML
- Custom components

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
