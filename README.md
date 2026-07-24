# ShowMap

Plataforma para escritórios de shows gerenciarem agenda, oportunidades, agentes, planos e rotas.

## Desenvolvimento

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Configure somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no navegador. Antes de publicar:

```bash
npm run lint
npm run test
npm run build
```

## Supabase

1. Projeto novo: execute `supabase/setup.sql`.
2. Projeto existente: aplique apenas as migrations pendentes.
3. Publique as funções `manage-user` e `commercial-assistant`.
4. Desative o cadastro público em Authentication.

Segredos (`SUPABASE_SERVICE_ROLE_KEY` e `OPENROUTER_API_KEY`) pertencem somente às Edge Functions. Nunca os salve no frontend ou no Git.

`migration-clean-start.sql` apaga dados de teste e não deve ser executado em produção.

## Dados

O Supabase é a fonte principal; o navegador mantém uma cópia local de contingência. Planilhas `.xlsx` e `.csv` aceitam até 5 MB e exigem revisão antes da gravação.
