import joplin from "../api";
import { MenuItemLocation } from "../api/types";
import { fix_math_MD } from "./mathFixer";

joplin.plugins.register({
    onStart: async function () {
        // 1. 注册命令
        await joplin.commands.register({
            name: "fixMdFormat",
            label: "Fix Math Exper",

            execute: async () => {
                const selectedText = (await joplin.commands.execute(
                    "selectedText",
                )) as string;

                console.log("Selected Text:", selectedText);

                if (!selectedText) {
                    console.log("没有选中任何内容");
                    return;
                }

                const fixedText = fix_math_MD(selectedText);

                await joplin.commands.execute("replaceSelection", fixedText);
            },
        });

        // 2. 加入右键菜单
        await joplin.views.menuItems.create(
            "fixMdMenu",
            "fixMdFormat",
            MenuItemLocation.EditorContextMenu,
        );
    },
});
