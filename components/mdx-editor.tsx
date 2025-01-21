'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Editor } from '@monaco-editor/react';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Copy, Sun, Moon } from 'lucide-react';
import { MDXProvider } from '@mdx-js/react';
import { MDXRemote } from 'next-mdx-remote';

const DEFAULT_CONTENT = `# Welcome to MDX Editor

This is a professional MDX editor with real-time preview.

## Features

- ✨ Syntax highlighting
- 📝 Real-time preview
- 🎨 Dark/Light theme
- ↔️ Resizable panels
- 📱 Mobile responsive

### Code Example

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Table Example

| Feature | Status |
|---------|--------|
| Editor | ✅ |
| Preview | ✅ |
| Themes | ✅ |
| Responsive | ✅ |
`;

const components = {
  table: React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>((props, ref) => (
    <div className="my-6 w-full overflow-y-auto">
      <table ref={ref} className="w-full border-collapse border border-border" {...props} />
    </div>
  )),
  thead: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
    <thead ref={ref} className="bg-muted" {...props} />
  )),
  th: React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableHeaderCellElement>>((props, ref) => (
    <th ref={ref} className="border border-border px-4 py-2 text-left font-semibold" {...props} />
  )),
  td: React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableDataCellElement>>((props, ref) => (
    <td ref={ref} className="border border-border px-4 py-2" {...props} />
  )),
  pre: React.forwardRef<HTMLPreElement, React.HTMLAttributes<HTMLPreElement>>((props, ref) => (
    <pre ref={ref} className="not-prose rounded-lg bg-muted p-4" {...props} />
  )),
  p: React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>((props, ref) => (
    <p ref={ref} className="mb-4" {...props} />
  )),
  h1: React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>((props, ref) => (
    <h1 ref={ref} className="mb-6 text-4xl font-bold" {...props} />
  )),
  h2: React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>((props, ref) => (
    <h2 ref={ref} className="mb-4 mt-8 text-2xl font-semibold" {...props} />
  )),
  h3: React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>((props, ref) => (
    <h3 ref={ref} className="mb-4 mt-6 text-xl font-semibold" {...props} />
  )),
  ul: React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>((props, ref) => (
    <ul ref={ref} className="mb-4 list-disc pl-6" {...props} />
  )),
  ol: React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>((props, ref) => (
    <ol ref={ref} className="mb-4 list-decimal pl-6" {...props} />
  )),
  li: React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>((props, ref) => (
    <li ref={ref} className="mb-1" {...props} />
  )),
  code: React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ className, ...props }, ref) => (
    <code ref={ref} className={className ? className : "bg-muted px-1.5 py-0.5 rounded-sm"} {...props} />
  )),
};

export default function MDXEditor() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [compiledSource, setCompiledSource] = useState<any>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const compileMarkdown = useCallback(async (markdown: string) => {
    if (!markdown) return;

    setCompileError(null);
    
    try {
      const compiled = await serialize(markdown, {
        mdxOptions: {
          development: process.env.NODE_ENV === 'development',
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [rehypeHighlight, { ignoreMissing: true }]
          ],
        },
        parseFrontmatter: false,
      });
      setCompiledSource(compiled);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compile markdown';
      console.error('Compilation error:', errorMessage);
      setCompileError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to compile markdown. Please check your syntax.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(() => {
      compileMarkdown(content);
    }, 500);

    return () => clearTimeout(timer);
  }, [content, compileMarkdown, mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    try {
      const saved = localStorage.getItem('mdx-content');
      if (saved) {
        setContent(saved);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }, [mounted]);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    
    setContent(value);
    try {
      localStorage.setItem('mdx-content', value);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Success',
        description: 'Content copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy content',
        variant: 'destructive',
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">MDX Editor</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            aria-label="Copy content"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={content}
                onChange={handleEditorChange}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />

          <Panel defaultSize={50} minSize={30}>
            <ScrollArea className="h-full">
              <div className="prose dark:prose-invert max-w-none p-8">
                {compileError ? (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                    <h3 className="font-semibold">Compilation Error</h3>
                    <p className="mt-1 text-sm">{compileError}</p>
                  </div>
                ) : compiledSource && mounted ? (
                  <MDXProvider components={components}>
                    <MDXRemote {...compiledSource} components={components} />
                  </MDXProvider>
                ) : null}
              </div>
            </ScrollArea>
          </Panel>
        </PanelGroup>
      </div>
      <Toaster />
    </div>
  );
}