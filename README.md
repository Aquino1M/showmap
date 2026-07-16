# ShowMap

Gestão de turnês, agenda, propostas, escritórios, agentes e planos com Supabase.

## Rodar localmente

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Em `.env.local`, use somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Nunca exponha chaves secretas.

## Publicar com segurança

1. Projeto novo: execute `supabase/setup.sql` no SQL Editor. Projeto existente: aplique somente as migrations pendentes em `supabase/`.
2. Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.
3. Crie o Administrador Master em **Authentication > Users** e publique a função:

```bash
npx supabase functions deploy manage-user --project-ref <seu-project-ref>
```

Defina `SHOWMAP_ALLOWED_ORIGINS` com os domínios autorizados. `migration-clean-start.sql` apaga dados e serve apenas para testes.

## Verificar

```bash
npm run lint
npm run test
npm run build
```
