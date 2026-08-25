"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as EditorType } from "tinymce";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
  minHeight?: string;
}

export default function RichEditor({
  content,
  onChange,
  placeholder = "Write something...",
  autoFocus = false,
  editable = true,
  minHeight = "200px",
}: RichEditorProps) {
  const editorRef = useRef<EditorType | null>(null);

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      onInit={(evt, editor) => {
        editorRef.current = editor;
      }}
      disabled={!editable}
      value={content}
      onEditorChange={(html) => onChange(html)}
      init={{
        height: minHeight,
        menubar: false,
        statusbar: false,
        branding: false,
        resize: true,
        placeholder: placeholder,
        auto_focus: autoFocus ? "end" : undefined,
        skin: "oxide",
        content_css: "default",
        toolbar:
          "bold italic | h2 h3 | bullist numlist | blockquote code | forecolor backcolor | removeformat",
        plugins: ["lists", "code"],
        mobile: {
          toolbar: "bold italic | bullist numlist | blockquote | removeformat",
        },
        style_formats: [
          { title: "Bold text", inline: "b" },
          { title: "Red text", inline: "span", styles: { color: "#ff0000" } },
          { title: "Red header", block: "h1", styles: { color: "#ff0000" } },
          { title: "Example 1", inline: "span", classes: "example1" },
          { title: "Example 2", inline: "span", classes: "example2" },
        ],
        content_style: `
          body { font-family: inherit; font-size: 14px; color: #1a1d29; }
        `,
        setup: (editor) => {
          editor.on("keydown", () => {
            // Ensure onChange fires on every keystroke
          });
        },
      }}
    />
  );
}
