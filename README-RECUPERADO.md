# Synapsa Brain: fontes recuperados do Worker publicado (12/11/2026)

Recuperados do source map do Worker em produção. Contém o Worker (core + shared runtime + edge).
NÃO contém: a Central (React, apps/central), testes, tipos TypeScript puros (shared/types, fin-painel, prospeccao, crm-painel)
nem package.json/tsconfig. A Central continua funcionando em produção (arquivos estáticos já publicados).

Build:  esbuild src/index.ts --bundle --format=esm --target=es2022 --platform=neutral --main-fields=module,main --sourcemap \
          --outfile=out/index.js --alias:@brain/core=./packages/core/src/index.ts --alias:@brain/shared=./packages/shared/src/index.ts \
          --external:cloudflare:workers --external:node:*
Deploy: PUT /accounts/<id>/workers/scripts/synapsa-brain (multipart: metadata, index.js, index.js.map) com
        keep_bindings=[secret_text,plain_text,json,secret_key] e keep_assets=true.

## Como este repositório foi montado (12/11/2026)
- Base: árvore de 17/out/2026 (Central antiga, server local, testes, package.json, tsconfig, wrangler).
- Por cima: fontes do Worker de produção recuperados do source map (packages/core/src, packages/shared/src, apps/edge/src). Esses são os arquivos de runtime ATUAIS (CRM, Financeiro, Prospecção, e-mail, webhook Resend).
- Arquivos só-de-tipos (shared/types.ts, core/types.ts, etc.) são os de 17/out: podem estar defasados e precisar de ajuste para o typecheck passar.
- apps/central é a versão de 17/out. A Central em produção (Financeiro, CRM, Prospecções) é mais nova e o fonte dela se perdeu: NÃO republicar a Central a partir daqui sem reescrever essas telas.
