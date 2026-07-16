# ShowMap

Gestão de turnês, agenda, propostas, escritórios, agentes e planos com Supabase.

## Local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Em `.env.local`, informe apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca publique chaves secretas.

## Produção

1. Projeto novo: execute `supabase/setup.sql` no SQL Editor.
2. Projeto existente: execute as migrations pendentes em `supabase/`, incluindo `migration-auth-hardening.sql`.
3. Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.
4. Crie o Administrador Master em **Authentication > Users** e publique:

```bash
npx supabase functions deploy manage-user --project-ref <seu-project-ref>
```

Configure `SHOWMAP_ALLOWED_ORIGINS` na Edge Function com os domínios permitidos. `migration-clean-start.sql` apaga dados e é exclusiva para testes.

## Verificação

```bash
npm run test
npm run lint
npm run build
```
