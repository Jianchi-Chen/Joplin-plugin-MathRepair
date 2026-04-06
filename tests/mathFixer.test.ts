import { describe, expect, it } from "vitest";
import { fix_math_MD } from "../src/mathFixer";

describe("fix_math_MD", () => {
    it("converts multiline \\[...\\] display math and unescapes commands", () => {
        const input = String.raw`\[
G =
\\begin{bmatrix}
\\mathbf{v}_1 \\cdot \\mathbf{v}_1 & \\mathbf{v}_1 \\cdot \\mathbf{v}_2
\\end{bmatrix}
\]`;

        const out = fix_math_MD(input);
        expect(out).toBe(
            [
                "$$",
                "G =",
                "\\begin{bmatrix}",
                "\\mathbf{v}_1 \\cdot \\mathbf{v}_1 & \\mathbf{v}_1 \\cdot \\mathbf{v}_2",
                "\\end{bmatrix}",
                "$$",
                "",
            ].join("\n"),
        );
    });

    it("converts inline \\(...\\) to $...$", () => {
        const input = String.raw`ChatGPT 格式：\( \lambda = 1 \)`;
        const out = fix_math_MD(input);
        expect(out).toContain("$\\lambda = 1$");
    });

    it("converts escaped dollar block delimiters", () => {
        const input = String.raw`\$\$
\\mathbf{y} = f(\\mathbf{x})
\$\$`;
        const out = fix_math_MD(input);
        expect(out).toBe(["$$", "\\mathbf{y} = f(\\mathbf{x})", "$$", ""].join("\n"));
    });

    it("ignores todo numbering and normalizes math bullets", () => {
        const input = `1.- ( J^T J )\n\n2.- 伪逆 $(J^T J)^{-1} J^T )`;
        const out = fix_math_MD(input);
        expect(out).toContain(">- $( J^T J )$");
        expect(out).toContain(">- 伪逆 $(J^T J)^{-1} J^T )$");
    });

    it("wraps standalone math-like single line into $$ block", () => {
        const input = String.raw`\mathrm{comp}_{\mathbf{b}}\mathbf{a}=\frac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|}`;
        const out = fix_math_MD(input);
        expect(out).toContain("$$");
        expect(out).toContain(
            String.raw`\mathrm{comp}_{\mathbf{b}}\mathbf{a}=\frac{\mathbf{a}\cdot\mathbf{b}}{|\mathbf{b}|}`,
        );
    });

    it("converts bracketed display block [ ... ] to $$", () => {
        const input = String.raw`[
P\mathbf{a} = \text{a 在 b 上的投影}
]`;
        const out = fix_math_MD(input);
        expect(out).toBe(
            ["$$", String.raw`P\mathbf{a} = \text{a 在 b 上的投影}`, "$$", ""].join("\n"),
        );
    });
});
