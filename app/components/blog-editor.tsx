"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type BlogEditorProps = {
    initialContent?: string;
    onChange: (html: string) => void;
};

export default function BlogEditor({ initialContent = "", onChange }: BlogEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
        ],
        content: initialContent,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "blog-prose min-h-[280px] px-4 py-3 focus:outline-none",
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);

    if (!editor) {
        return (
            <div className="border border-gray-300 rounded-md bg-white">
                <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Loading editor…
                </div>
                <div className="min-h-[280px] px-4 py-3 text-gray-400">…</div>
            </div>
        );
    }

    return (
        <div className="border border-gray-300 rounded-md bg-white shadow-sm overflow-hidden">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2">
            <ToolbarButton
                title="Bold (Ctrl+B)"
                icon="bi-type-bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
            />
            <ToolbarButton
                title="Italic (Ctrl+I)"
                icon="bi-type-italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
            />
            <ToolbarButton
                title="Underline (Ctrl+U)"
                icon="bi-type-underline"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
            />
            <ToolbarButton
                title="Strikethrough"
                icon="bi-type-strikethrough"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive("strike")}
            />

            <Divider />

            <ToolbarButton
                title="Heading 1"
                label="H1"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive("heading", { level: 1 })}
            />
            <ToolbarButton
                title="Heading 2"
                label="H2"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive("heading", { level: 2 })}
            />
            <ToolbarButton
                title="Heading 3"
                label="H3"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive("heading", { level: 3 })}
            />
            <ToolbarButton
                title="Paragraph"
                label="P"
                onClick={() => editor.chain().focus().setParagraph().run()}
                active={editor.isActive("paragraph") && !editor.isActive("heading")}
            />

            <Divider />

            <ToolbarButton
                title="Bullet list"
                icon="bi-list-ul"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
            />
            <ToolbarButton
                title="Numbered list"
                icon="bi-list-ol"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
            />
            <ToolbarButton
                title="Blockquote"
                icon="bi-quote"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
            />

            <Divider />

            <ToolbarButton
                title="Inline code"
                icon="bi-code"
                onClick={() => editor.chain().focus().toggleCode().run()}
                active={editor.isActive("code")}
            />
            <ToolbarButton
                title="Code block"
                icon="bi-code-square"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive("codeBlock")}
            />
            <ToolbarButton
                title="Horizontal rule"
                icon="bi-hr"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                active={false}
            />

            <Divider />

            <ToolbarButton
                title="Undo (Ctrl+Z)"
                icon="bi-arrow-counterclockwise"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                active={false}
            />
            <ToolbarButton
                title="Redo (Ctrl+Y)"
                icon="bi-arrow-clockwise"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                active={false}
            />
            <ToolbarButton
                title="Clear formatting"
                icon="bi-eraser"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                active={false}
            />
        </div>
    );
}

type ToolbarButtonProps = {
    title: string;
    onClick: () => void;
    active: boolean;
    disabled?: boolean;
    icon?: string;
    label?: string;
};

function ToolbarButton({ title, onClick, active, disabled, icon, label }: ToolbarButtonProps) {
    const base =
        "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded text-sm transition-colors";
    const activeClass = active
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-200";
    const disabledClass = disabled ? "opacity-40 cursor-not-allowed hover:bg-transparent" : "cursor-pointer";
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${activeClass} ${disabledClass}`}
        >
            {icon ? <i className={`bi ${icon}`}></i> : <span className="font-semibold">{label}</span>}
        </button>
    );
}

function Divider() {
    return <span className="mx-1 h-6 w-px bg-gray-300" aria-hidden />;
}
