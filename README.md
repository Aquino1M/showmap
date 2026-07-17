# ShowMap

Gestão de agenda, oportunidades, agentes, planos e mapa logístico para escritórios de shows.

## Executar localmente

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Em `.env.local`, use apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Banco e funções

1. Em um projeto novo, execute `supabase/setup.sql` no SQL Editor.
2. Em projeto existente, aplique apenas as migrations ainda pendentes em `supabase/`.
3. Para o assistente comercial, execute `supabase/migration-assistant-knowledge.sql` e publique as Edge Functions `manage-user` e `commercial-assistant`.
4. Em Supabase Authentication, desative o cadastro público.

`migration-clean-start.sql` remove dados de teste. Nunca execute esse arquivo em produção.

## Verificar antes de publicar

```bash
npm run lint
npm run test
npm run build
```

## Segurança

- Supabase é a fonte principal; o navegador mantém somente uma cópia local de apoio.
- Importações `.xlsx` e `.csv` têm limite de 5 MB e exigem revisão antes de salvar.
- Nunca coloque chaves secretas no navegador, no Git ou em arquivos versionados.
- A instalação como aplicativo funciona em HTTPS (Vercel) e usa o menu do navegador quando ele não oferece o botão nativo.
