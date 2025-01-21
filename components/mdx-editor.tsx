"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "@monaco-editor/react";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sun, Moon, Upload } from "lucide-react";
import { MDXProvider } from "@mdx-js/react";
import { MDXRemote } from "next-mdx-remote";

// Default content showing proper MDX syntax
const DEFAULT_GITHUB_README = `# My Awesome Project

<div style={{ textAlign: 'center' }}>

![Project Banner](https://via.placeholder.com/800x400)

[![GitHub stars](https://img.shields.io/github/stars/username/repo)](https://github.com/username/repo/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/username/repo)](https://github.com/username/repo/network)
[![GitHub issues](https://img.shields.io/github/issues/username/repo)](https://github.com/username/repo/issues)
[![GitHub license](https://img.shields.io/github/license/username/repo)](https://github.com/username/repo/blob/main/LICENSE)

</div>

## 🚀 About The Project

A brief description of your project goes here. Make it compelling!

### Built With

* [Next.js](https://nextjs.org/)
* [React](https://reactjs.org/)
* [TypeScript](https://www.typescriptlang.org/)

## 🛠️ Installation

1. Clone the repo
   \`\`\`sh
   git clone https://github.com/username/repo.git
   \`\`\`

2. Install NPM packages
   \`\`\`sh
   npm install
   \`\`\`

## 📝 Usage

Add usage examples here...

## 🤝 Contributing

Contributions are welcome!

## 📫 Contact

Your Name - [@twitter_handle](https://twitter.com/twitter_handle)

Project Link: [https://github.com/username/repo](https://github.com/username/repo)
`;

const components = {
  // Base components
  p: (props) => <p className="mb-4 leading-7" {...props} />,
  h1: (props) => (
    <h1 className="mb-6 text-4xl font-bold tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2
      className="mb-4 mt-8 text-2xl font-semibold tracking-tight"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mb-4 mt-6 text-xl font-semibold tracking-tight" {...props} />
  ),
  h4: (props) => (
    <h4 className="mb-4 mt-6 text-lg font-semibold tracking-tight" {...props} />
  ),

  // List components
  ul: (props) => <ul className="mb-4 list-disc pl-6 space-y-2" {...props} />,
  ol: (props) => <ol className="mb-4 list-decimal pl-6 space-y-2" {...props} />,
  li: (props) => <li className="leading-7" {...props} />,

  // Inline components
  a: ({ href, ...props }) => (
    <a
      href={href}
      className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  img: (props) => (
    <img
      className="max-w-full h-auto rounded-lg my-4"
      loading="lazy"
      {...props}
    />
  ),

  // Code components
  pre: (props) => (
    <pre
      className="overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-800 p-4 my-4"
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={
        className
          ? `${className} text-sm`
          : "bg-gray-100 dark:bg-gray-800 rounded-md px-1.5 py-0.5 text-sm"
      }
      {...props}
    />
  ),

  // Table components
  table: (props) => (
    <div className="my-6 w-full overflow-x-auto">
      <table
        className="w-full border-collapse border border-gray-200 dark:border-gray-700"
        {...props}
      />
    </div>
  ),
  thead: (props) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
  ),
  th: (props) => (
    <th
      className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border border-gray-200 dark:border-gray-700 px-4 py-2"
      {...props}
    />
  ),

  // Container components
  div: (props) => <div {...props} />,
};

export default function MDXEditor() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState(DEFAULT_GITHUB_README);
  const [compiledSource, setCompiledSource] = useState<any>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const compileMarkdown = useCallback(
    async (markdown: string) => {
      if (!markdown) return;

      setCompileError(null);

      try {
        const compiled = await serialize(markdown, {
          mdxOptions: {
            development: process.env.NODE_ENV === "development",
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [rehypeHighlight, { ignoreMissing: true }],
            ],
          },
          parseFrontmatter: false,
        });
        setCompiledSource(compiled);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to compile markdown";
        console.error("Compilation error:", errorMessage);
        setCompileError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to compile markdown. Please check your syntax.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

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
      const saved = localStorage.getItem("github-readme-content");
      if (saved) {
        setContent(saved);
      }
    } catch (error) {
      console.error("Failed to load content:", error);
    }
  }, [mounted]);

  // Convert HTML-style markdown to MDX-style before setting content
  const preprocessMarkdown = (markdown: string) => {
    // Convert <div align="center"> to MDX style
    markdown = markdown.replace(
      /<div align="center">/g,
      '<div style={{ textAlign: "center" }}>'
    );

    // Add similar conversions for other HTML attributes as needed
    return markdown;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;

    const processedValue = preprocessMarkdown(value);
    setContent(processedValue);
    try {
      localStorage.setItem("github-readme-content", processedValue);
    } catch (error) {
      console.error("Failed to save content:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          const processedText = preprocessMarkdown(text);
          setContent(processedText);
          toast({
            title: "Success",
            description: "File loaded successfully",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Success",
        description: "Content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive",
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-2 flex justify-between items-center">
        <h1 className="text-xl font-bold">GitHub README Editor</h1>
        <div className="flex gap-2">
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer"
              aria-label="Upload file"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".md,.mdx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
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
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
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
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  wordWrap: "on",
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
