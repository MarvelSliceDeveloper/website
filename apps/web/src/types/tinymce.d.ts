// Minimal ambient types for "tinymce", which is only shipped as a browser
// bundle (tinymce.min.js) and is never resolved from node_modules by the app.
// @tinymce/tinymce-react's own types import Editor/TinyMCE/EditorEvent/Events
// from "tinymce"; this shim supplies those names so the wrapper type-checks.
declare module "tinymce" {
  export interface Editor {
    id: string;
    on(eventName: string, handler: (...args: unknown[]) => void): void;
    off(eventName: string, handler?: (...args: unknown[]) => void): void;
    getContent(args?: unknown): string;
    setContent(content: string, args?: unknown): void;
    destroy(): void;
    remove(): void;
  }

  export interface EditorEvent<A> {
    type: string;
    target: Editor;
    [key: string]: unknown;
  }

  export interface RawEditorOptions {
    selector?: string;
    setup?: (editor: Editor) => void;
    init_instance_callback?: (editor: Editor) => void;
    plugins?: string | string[];
    toolbar?: string | string[];
    height?: number | string;
    [key: string]: unknown;
  }

  export interface TinyMCE {
    init(options: RawEditorOptions): Promise<Editor[]>;
    get(id: string): Editor | null;
    remove(): void;
    [key: string]: unknown;
  }

  export namespace Events {
    export interface EditorEventMap {
      [key: string]: unknown;
    }
  }
}
