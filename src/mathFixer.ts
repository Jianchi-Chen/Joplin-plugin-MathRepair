export function fix_math_MD(md: string): string {
    console.log("Original MD:", md);
    let result = md.replace(/\r\n/g, "\n");

    const normalizeMathExpr = (expr: string): string => {
        return (
            expr
                // ChatGPT 经常把 LaTeX 命令转义成双反斜杠（如 \\begin）
                .replace(/\\\\([a-zA-Z]+)/g, "\\$1")
                // 统一乘号两侧空格
                .replace(/\s+\\times\s+/g, "\\times")
                // 去掉行尾多余空格，避免 KaTeX 解析异常
                .replace(/[ \t]+$/gm, "")
                .trim()
        );
    };

    const wrapDisplay = (expr: string): string => {
        return `\n$$\n${normalizeMathExpr(expr)}\n$$\n`;
    };

    const isMathLike = (line: string): boolean => {
        const t = line.trim();
        if (!t) return false;
        if (/^[#>*`-]/.test(t)) return false;
        if (/^\$\$/.test(t) || /\$/.test(t)) return false;
        return (
            /\\[a-zA-Z]+/.test(t) ||
            /[A-Za-z][A-Za-z0-9_]*\s*=/.test(t) ||
            /\^|_\{|_\w/.test(t)
        );
    };

    // A) 忽略待办编号前缀：1.xxx -> xxx
    result = result.replace(/^\s*\d+\.\s*/gm, "");

    // B0) 先处理完整的转义块：\$\$ ... \$\$ / \\$\\$ ... \\$\\$
    result = result.replace(/\\+\$\\+\$([\s\S]*?)\\+\$\\+\$/g, (_, expr) => {
        return wrapDisplay(expr);
    });

    // B) 修复剩余被转义的块分隔符：\$\$ 或 \\$\\$ -> $$
    result = result.replace(/\\+\$\\+\$/g, "$$");

    // 1) 统一 display math：\[ ... \] -> $$ ... $$（支持多行）
    result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => {
        return wrapDisplay(expr);
    });

    // 1b) 统一 display math：[ ... ] -> $$ ... $$（支持多行）
    result = result.replace(
        /(^|\n)\s*\[\s*\n?([\s\S]*?)\n?\s*\]\s*(?=\n|$)/g,
        (_, pfx, expr) => {
            return `${pfx}${wrapDisplay(expr)}`;
        },
    );

    // 2) 修复行内数学：\( ... \) -> $ ... $
    result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, expr) => {
        return `$${normalizeMathExpr(expr)}$`;
    });

    // 3) 统一已有的 $$ ... $$ 块，确保内部也完成命令去转义
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
        return wrapDisplay(expr);
    });

    // 3b) 列表中的数学项：- (...) 或 - 含美元数学，统一成引用列表 >-
    result = result.replace(/^\s*-\s*(.+)$/gm, (_, content) => {
        const raw = String(content).trim();
        let fixed = raw;

        // 仅对明显数学内容处理，避免影响普通列表
        const hasMathSignal =
            /\\[a-zA-Z]+|\^|_=|=|\(|\)|\$/.test(raw) || /[A-Za-z]\^/.test(raw);
        if (!hasMathSignal) return `- ${raw}`;

        // 若是纯括号表达式，包成行内数学
        if (!fixed.includes("$") && /^\(.+\)$/.test(fixed)) {
            fixed = `$${fixed}$`;
        }

        // 若美元符号数量为奇数，补齐闭合
        const dollarCount = (fixed.match(/\$/g) || []).length;
        if (dollarCount % 2 === 1) fixed = `${fixed}$`;

        return `>- ${fixed}`;
    });

    // 3c) 单行公式（未包裹）自动提升为 display math
    const mathBlocks: string[] = [];
    const protectedResult = result.replace(/\$\$[\s\S]*?\$\$/g, (block) => {
        const token = `__MATH_BLOCK_${mathBlocks.length}__`;
        mathBlocks.push(block);
        return token;
    });

    result = protectedResult.replace(/^\s*([^\n]+)\s*$/gm, (_, line) => {
        const t = String(line).trim();
        if (/^__MATH_BLOCK_\d+__$/.test(t)) return t;
        if (!isMathLike(t)) return line;
        return wrapDisplay(t).trim();
    });

    result = result.replace(/__MATH_BLOCK_(\d+)__/g, (_, index) => {
        return mathBlocks[Number(index)] ?? "";
    });

    // 4) 清理怪异空格与过多空行
    result = result
        .replace(/ +\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    console.log("Fixed MD:", result);
    return `${result}\n`;
}
