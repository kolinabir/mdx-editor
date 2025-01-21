/* eslint-disable @next/next/no-img-element */
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

type ComponentProps = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: any;
};

const components = {
  // Base components
  p: (props: ComponentProps) => <p className="mb-4 leading-7" {...props} />,
  h1: (props: ComponentProps) => (
    <h1 className="mb-6 text-4xl font-bold tracking-tight" {...props} />
  ),
  h2: (props: ComponentProps) => (
    <h2
      className="mb-4 mt-8 text-2xl font-semibold tracking-tight flex items-center gap-2"
      {...props}
    />
  ),
  h3: (props: ComponentProps) => (
    <h3 className="mb-4 mt-6 text-xl font-semibold tracking-tight" {...props} />
  ),
  h4: (props: ComponentProps) => (
    <h4 className="mb-4 mt-6 text-lg font-semibold tracking-tight" {...props} />
  ),

  // List components
  ul: (props: ComponentProps) => (
    <ul className="mb-4 list-disc pl-6 space-y-2" {...props} />
  ),
  ol: (props: ComponentProps) => (
    <ol className="mb-4 list-decimal pl-6 space-y-2" {...props} />
  ),
  li: (props: ComponentProps) => <li className="leading-7" {...props} />,

  // Inline components
  a: ({ href, children, ...props }: ComponentProps & { href?: string }) => (
    <a
      href={href}
      className="text-blue-500 hover:text-blue-600 hover:underline transition-colors inline-block"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // Enhanced image component
  img: ({
    src = "",
    alt,
    width,
    style,
    ...props
  }: ComponentProps & {
    src?: string;
    alt?: string;
    width?: string | number;
  }) => {
    // Function to verify if URL is valid
    const isValidUrl = (urlString: string) => {
      try {
        new URL(urlString);
        return true;
      } catch (e) {
        return false;
      }
    };

    // Handle empty or invalid src
    const imageSrc = isValidUrl(src)
      ? src
      : `https://placehold.co/600x400?text=${encodeURIComponent(
          alt || "Image"
        )}`;

    // Determine if it's a badge
    const isBadge = src?.includes("shields.io") || src?.includes("badge");

    return (
      <img
        src={imageSrc}
        alt={alt || ""}
        style={{
          ...style,
          width: width || (isBadge ? "auto" : "100%"),
          maxWidth: isBadge ? "none" : "100%",
        }}
        className={`
          ${isBadge ? "inline-block h-6" : "rounded-lg my-4"} 
          mx-auto
        `}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = `https://placehold.co/600x400?text=${encodeURIComponent(
            alt || "Image"
          )}`;
        }}
        {...props}
      />
    );
  },

  // Container components
  div: ({ style, children, ...props }: ComponentProps) => (
    <div style={style} className="w-full my-4" {...props}>
      {children}
    </div>
  ),
};

export default function MDXEditor() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState("");
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
        // Preprocess the markdown to fix common issues
        let processedMarkdown = markdown
          // Fix HTML comments
          .replace(/<!--[\s\S]*?-->/g, "")
          // Fix div alignment
          .replace(/<div align="(.*?)">/g, '<div style={{ textAlign: "$1" }}>')
          // Fix img alignment
          .replace(
            /<img align="(.*?)"(.*?)>/g,
            '<img style={{ float: "$1" }}$2>'
          )
          // Allow <img> without an explicit closing tag by converting them to self-closing format
          .replace(/<img([^>]*)(?<!\/)>/g, "<img$1/>")
          // Auto-close unclosed <div> tags
          .replace(/<div([^>]*)>(?![\s\S]*<\/div>)/g, "<div$1></div>")
          // Remove &nbsp;
          .replace(/&nbsp;/g, " ")
          // Fix HTML style attributes
          .replace(/style="([^"]*)"/g, (match, styles) => {
            const cssProps = styles
              .split(";")
              .filter(Boolean)
              .map((prop: string) => {
                const [key, value] = prop.split(":").map((s) => s.trim());
                return `${key}: "${value}"`;
              })
              .join(", ");
            return `style={{ ${cssProps} }}`;
          });

        let openDivs = (processedMarkdown.match(/<div\b(?!\/)/g) || []).length;
        let closedDivs = (processedMarkdown.match(/<\/div>/g) || []).length;
        if (openDivs > closedDivs) {
          processedMarkdown += "</div>".repeat(openDivs - closedDivs);
        }

        const compiled = await serialize(processedMarkdown, {
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

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setContent(value);
    try {
      localStorage.setItem("github-readme-content", value);
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
          setContent(text);
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
            <PanelGroup direction="vertical">
              <Panel defaultSize={80} minSize={10}>
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
              <PanelResizeHandle className="h-2 bg-border hover:bg-primary/20 transition-colors" />
              {/* <Panel defaultSize={20} minSize={10}>
              </Panel> */}
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors" />

          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={80} minSize={10}>
                <ScrollArea className="h-full">
                  <div className="prose dark:prose-invert max-w-none p-8">
                    {compileError ? (
                      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                        <h3 className="font-semibold">Compilation Error</h3>
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                          {compileError}
                        </p>
                      </div>
                    ) : compiledSource && mounted ? (
                      <MDXProvider components={components}>
                        <MDXRemote
                          {...compiledSource}
                          components={components}
                        />
                      </MDXProvider>
                    ) : null}
                  </div>
                </ScrollArea>
              </Panel>
              <PanelResizeHandle className="h-2 bg-border hover:bg-primary/20 transition-colors" />
              {/* <Panel defaultSize={20} minSize={10}>
              </Panel> */}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
      <Toaster />
    </div>
  );
}
