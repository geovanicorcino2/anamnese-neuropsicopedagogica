# Anamnese Neuropsicopedagógica

App desktop (Windows) para Ana Paula M. Gontijo — Neuropsicopedagoga Especialista em ABA,
Humana Clínica de Saúde Integrada. Preenche a ficha de anamnese infantil (19 seções, 135
campos, réplica digital de `ANANMESES NEUROPSICOPEDAGOGA.docx`) e exporta as respostas em
Word (.docx) e PDF em layout compacto (grade de 2 colunas pras respostas curtas), com logo e
borda configuráveis — por padrão replicam o timbre visual original (2 formas decorativas de
canto), mas qualquer usuário pode subir sua própria logo/borda na aba **Perfil**, ou remover as
duas pra um relatório sem timbre.

100% local (SQLite via `sql.js`, sem backend) pro banco de fichas — os dados são de menores, então
tudo fica só no computador. A única chamada de rede do app é a aba **Sugestões de Intervenção**
(opcional, exige configurar um provedor de IA no Perfil, e só chama a API quando o usuário clica
em "Gerar sugestões" — nunca automaticamente).

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
              geração de DOCX (OOXML cru + JSZip) e PDF (HTML/CSS + printToPDF), upload de
              logo/borda (main/perfil), cliente de IA multi-provedor (main/ia)
  preload/    bridge tipada (window.api) exposta via contextBridge
  renderer/   UI React (rotas, componentes, tema)
scripts/      geração de identidade visual, validação do schema, teste manual de exportação
assets/identidade-visual/   os 2 logos originais extraídos do docx (fonte da verdade das imagens)
```

## Campos condicionais e progresso

Campos com `campoDetalheId` (ex.: "Relação dos pais hoje" → "Qual") só mostram o campo de
detalhe quando a resposta principal bate com o `valorGatilho` definido no schema (ex.: "Outro"
pra seleções, "Sim" pra Sim/Não, "Outras" pra múltipla escolha) — ver
`src/core/services/progressoFicha.ts`. A barra de progresso trata cada par (campo + detalhe)
como uma unidade só: resposta que não pede detalhe = 100%; pediu detalhe e está vazio = 50%.

## Identidade visual e IA (configurável, aba Perfil)

- **Logo** e **borda** são opcionais e independentes — sem nenhum dos dois, o relatório sai sem
  timbre algum. A Ana Paula já vem com a logo pessoal pré-configurada; sem borda customizada, os
  builders caem automaticamente nas formas vetoriais originais (nunca ficam sem nada por engano).
- **IA** (aba Perfil, seção "Inteligência Artificial"): provedor (Anthropic/OpenAI/Gemini/
  personalizado compatível com OpenAI) + chave + modelo. Usada só pela aba **Sugestões de
  Intervenção** — nunca automaticamente, e a ficha inteira (todas as respostas) é enviada pro
  provedor configurado quando o usuário clica em "Gerar sugestões", então vale avisar a
  profissional sobre isso antes de configurar uma chave.

## Como validar depois de mexer no código

1. `npm run typecheck` — precisa terminar sem saída (exit code 0).
2. `npm run validar-schema` — precisa dizer "OK".
3. `npm run dev` — a janela deve abrir sem erro no terminal (main/preload) nem no DevTools do
   renderer (abrir com Ctrl+Shift+I dentro da janela).
4. Se mexeu no schema do banco (`schemaSql.ts`), teste a migração: rode o app apontando pro
   `anamnese.db` de uma versão anterior (ou restaure `scratch/anamnese-backup-pre-v2.db` como
   exemplo) e confirme que abre sem apagar nada.
5. Teste manual: criar uma ficha → preencher pelo menos um campo de cada tipo (incluindo a
   tabela de familiares e um campo com `campoDetalheId`, tipo "Relação dos pais hoje") →
   **Exportar** → gerar DOCX e PDF → conferir que o layout ficou compacto (grade de 2 colunas) e
   que logo/borda aparecem conforme configurado no Perfil (ou a borda vetorial original, se
   nenhuma tiver sido enviada). Testar Ctrl+C/Ctrl+V e o menu de botão direito num campo de
   texto. Testar a aba Sugestões sem IA configurada (deve avisar com link pro Perfil, não
   travar) e, se tiver uma chave de teste, com IA configurada.
6. Antes de distribuir: `npm run build:win`, instalar o `.exe` gerado em `dist/` numa máquina
   limpa (ou na mesma) e confirmar que abre.

## Limitações conhecidas

- As posições das 2 formas decorativas vetoriais (fallback sem borda customizada) no rodapé são
  uma aproximação por simetria com o cabeçalho — o documento original usa
  `relativeFrom="leftMargin"` combinado com rotação, cuja matemática exata do Word não valia a
  pena reproduzir pixel a pixel para um acento decorativo de canto. Ver comentário em
  `src/main/assets/identidadeVisual.ts`.
- Borda personalizada (imagem enviada pelo usuário) é esticada pra preencher os 4 slots de
  canto, sem preservar proporção — os 4 slots têm tamanhos diferentes entre si, então não dá pra
  encaixar uma imagem arbitrária nos 4 sem cortar ou esticar.
- Ícone e splash screen do instalador ainda são os padrões do Electron.
- Sem assinatura de código no instalador (ver seção acima).
- Chave de API de IA fica salva em texto plano no banco local (mesmo nível de proteção dos
  outros dados do app — arquivo local, sem sincronização/nuvem).
