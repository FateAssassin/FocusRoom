import "server-only";
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "em", "s", "code",
    "ul", "ol", "li",
    "blockquote",
    "pre",
    "a",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeBlogHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
        FORBID_ATTR: ["style", "srcset"],
    });
}