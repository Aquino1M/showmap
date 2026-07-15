# ShowMap

Painel de agenda, propostas, escritórios, agentes e planos. O Supabase armazena os dados e a função `manage-user` aplica as permissões no servidor.

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Em `.env.local`, informe somente a URL e a chave **publishable** do Supabase. Nunca use chave secreta no navegador ou no Git.

## Instalar ou atualizar o banco

1. Projeto novo: execute `supabase/setup.sql` no SQL Editor.
2. Projeto existente: execute, uma única vez e nesta ordem, `migration-profile-link.sql`, `migration-event-details.sql` e `migration-plans.sql`.
3. Crie o Administrador Master em **Authentication > Users** com o e-mail definido no SQL.
4. Publique a função segura:

```bash
npx supabase functions deploy manage-user --project-ref veszdgbonolvmcpablol
```

`migration-clean-start.sql` apaga dados e serve apenas para ambiente de teste.

## Validar

```bash
npm run lint
npm run build
```
