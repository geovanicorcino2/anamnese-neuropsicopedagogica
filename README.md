# Anamnese Neuropsicopedagógica

App desktop (Windows) para Ana Paula M. Gontijo — Neuropsicopedagoga Especialista em ABA,
Humana Clínica de Saúde Integrada. Preenche a ficha de anamnese infantil (19 seções, ~138
campos, réplica digital de `ANANMESES NEUROPSICOPEDAGOGA.docx`) e exporta as respostas em
Word (.docx) e PDF com o mesmo timbre visual do documento original — os 2 logos e as 2 formas
decorativas de canto.

100% local (SQLite via `sql.js`, sem backend, sem rede) — os dados são de menores, então tudo
fica só no computador.

## Rodar em desenvolvimento

```bash
npm install
npm run dev
```

Abre a janela do Electron com hot-reload no processo de renderização. Na primeira execução, o
banco é criado em `%APPDATA%\anamnese-neuropsicopedagogica\anamnese.db` e o perfil profissional
é pré-preenchido com os dados extraídos do timbre original (editável na aba **Perfil**).

## Gerar o instalável (.exe)

```bash
npm run build:win
```

Gera um instalador NSIS em `dist/`. Sem assinatura de código — o Windows SmartScreen vai avisar
"editor desconhecido" no primeiro uso, o que é esperado para uma distribuição sem certificado.

**Armadilha conhecida (encontrada e resolvida em 2026-08-11):** mesmo sem assinar nada, o
`electron-builder` baixa um pacote auxiliar (`winCodeSign`) que contém binários de macOS, e
extrair esse pacote cria links simbólicos — o que falha com "Cannot create symbolic link: O
cliente não tem o privilégio necessário" numa conta Windows sem permissão de symlink (padrão fora
do modo desenvolvedor). Isso trava só a etapa final de embrulhar o app num instalador `.exe` com
metadados via `rcedit`/`signtool` — o empacotamento do app em si (`dist\win-unpacked\Anamnese
Neuropsicopedagógica.exe`) funciona normalmente mesmo sem resolver isso. Neste computador já foi
resolvido ativando o Modo Desenvolvedor do Windows, e o cache baixado fica salvo em
`%LOCALAPPDATA%\electron-builder\Cache` — builds futuros aqui não devem tropeçar nisso de novo. Se
precisar gerar o instalador numa máquina nova, uma destas duas saídas resolve (fazer uma vez só):
`%LOCALAPPDATA%\electron-builder\Cache`):
- Ativar o **Modo desenvolvedor** do Windows (Configurações → Privacidade e segurança → Para
  desenvolvedores), ou
- Rodar `npm run build:win` uma vez **como Administrador**.

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run typecheck` | `tsc --noEmit` nos três lados (core, main/preload, renderer) |
| `npm run validar-schema` | Confere `src/core/data/anamneseSchema.ts`: ids duplicados, opções vazias, `campoDetalheId` órfão, seção sem campo |
| `npm run gerar-identidade-visual` | Regera `src/main/assets/identidadeVisual.ts` a partir de `assets/identidade-visual/*.png\|jpeg` — rodar só se os arquivos de logo mudarem |
| `npx tsx --tsconfig tsconfig.node.json scripts/testarExportacaoDocx.ts` | Gera um `.docx` de teste com dados fictícios em `scratch/`, útil pra conferir a exportação sem passar pela UI |

## Estrutura

```
src/
  core/       schema dos campos, tipos do banco, validação e montagem do conteúdo exportado —
              TypeScript puro, sem Electron nem React (portável se um dia surgir versão mobile)
  main/       processo principal do Electron: banco (sql.js), repositórios, handlers de IPC,
              geração de DOCX (OOXML cru + JSZip) e PDF (HTML/CSS + printToPDF)
  preload/    bridge tipada (window.api) exposta via contextBridge
  renderer/   UI React (rotas, componentes, tema)
scripts/      geração de identidade visual, validação do schema, teste manual de exportação
assets/identidade-visual/   os 2 logos originais extraídos do docx (fonte da verdade das imagens)
```

## Como validar depois de mexer no código

1. `npm run typecheck` — precisa terminar sem saída (exit code 0).
2. `npm run validar-schema` — precisa dizer "OK".
3. `npm run dev` — a janela deve abrir sem erro no terminal (main/preload) nem no DevTools do
   renderer (abrir com Ctrl+Shift+I dentro da janela).
4. Teste manual: criar uma ficha → preencher pelo menos um campo de cada seção (incluindo a
   tabela de familiares) → **Exportar** → gerar DOCX e PDF → abrir os dois e conferir visualmente
   que os 2 logos e as 2 formas decorativas (roxa e verde) aparecem nos cantos, e que as
   respostas preenchidas aparecem no texto. Fechar e reabrir o app pra confirmar que a ficha
   persistiu.
5. Antes de distribuir: `npm run build:win`, instalar o `.exe` gerado em `dist/` numa máquina
   limpa (ou na mesma) e confirmar que abre.

## Limitações conhecidas (primeira versão)

- As posições das 2 formas decorativas no rodapé são uma aproximação por simetria com o
  cabeçalho — o documento original usa `relativeFrom="leftMargin"` combinado com rotação, cuja
  matemática exata do Word não valia a pena reproduzir pixel a pixel para um acento decorativo
  de canto. Ver comentário em `src/main/assets/identidadeVisual.ts`.
- Os campos com `campoDetalheId` (ex.: "Tem medo?" → "Qual?") sempre aparecem no formulário,
  mesmo quando a resposta principal não justifica preencher o detalhe — não há show/hide
  condicional ainda.
- Ícone e splash screen do instalador ainda são os padrões do Electron.
- Sem assinatura de código no instalador (ver seção acima).
