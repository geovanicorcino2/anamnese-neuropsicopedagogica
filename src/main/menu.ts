import { Menu, type BrowserWindow, type MenuItemConstructorOptions } from "electron";

// Sem um Menu de aplicativo explícito com papéis de Edição, atalhos como Ctrl+C/Ctrl+V podem
// não funcionar de forma confiável em todas as plataformas, e o menu de contexto (botão direito)
// não mostra Cortar/Copiar/Colar. As duas funções abaixo resolvem isso.

export function instalarMenuAplicativo(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Desfazer" },
        { role: "redo", label: "Refazer" },
        { type: "separator" },
        { role: "cut", label: "Recortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Colar" },
        { role: "selectAll", label: "Selecionar tudo" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

export function instalarMenuContexto(win: BrowserWindow): void {
  win.webContents.on("context-menu", (_evento, params) => {
    if (!params.isEditable) return;

    const template: MenuItemConstructorOptions[] = [
      { role: "cut", label: "Recortar", enabled: params.editFlags.canCut },
      { role: "copy", label: "Copiar", enabled: params.editFlags.canCopy },
      { role: "paste", label: "Colar", enabled: params.editFlags.canPaste },
      { type: "separator" },
      { role: "selectAll", label: "Selecionar tudo", enabled: params.editFlags.canSelectAll },
    ];

    Menu.buildFromTemplate(template).popup();
  });
}
