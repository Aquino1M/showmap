# ShowMap

Gestão de turnês, agendas, propostas, escritórios, agentes e planos com Supabase.

## Rodar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Use apenas as variáveis públicas do Supabase. Nunca publique chaves secretas.

## Banco e segurança

1. Projeto novo: execute `supabase/setup.sql`.
2. Projeto existente: execute, uma vez, `migration-profile-link.sql`, `migration-event-details.sql`, `migration-plans.sql`, `migration-artist-name.sql` e `migration-auth-hardening.sql`, nessa ordem.
3. Em **Authentication > Sign In / Providers**, desative **Allow new users to sign up**.
4. Crie o Administrador Master em **Authentication > Users** e publique:

```bash
npx supabase functions deploy manage-user --project-ref <seu-project-ref>
```

`migration-clean-start.sql` apaga dados e é exclusiva para teste.

## Validar

```bash
npm run test
npm run lint
npm run build
```
