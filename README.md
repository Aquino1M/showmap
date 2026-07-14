# ShowMap

Sistema de agenda, propostas, contratantes, escritórios e agentes. O Supabase guarda os dados; a Edge Function aplica permissões para cada perfil.

## Executar

```bash
npm install
copy .env.example .env.local
npm run dev
```

Use somente a URL e a chave **publishable** em `.env.local`. Chaves secretas ficam apenas no ambiente do Supabase.

## Configurar o Supabase

1. Execute `supabase/setup.sql` no SQL Editor em um projeto novo.
2. Crie o Administrador Master em **Authentication > Users**, com o e-mail definido no SQL.
3. Publique a função:

```bash
npx supabase login
npx supabase functions deploy manage-user --project-ref veszdgbonolvmcpablol
```

Em uma instalação já existente, execute também `supabase/migration-profile-link.sql` uma vez. Não use `migration-clean-start.sql` em produção: ele apaga os dados de teste.

## Permissões

- Master: gerencia todos os escritórios, agentes e registros.
- Escritório: gerencia os agentes e a agenda do próprio escritório.
- Agente: registra e acompanha propostas do próprio escritório.

As operações de dados passam pela Edge Function `manage-user`; ela valida o usuário autenticado antes de alterar ou listar dados.

## Verificar antes de publicar

```bash
npm run lint
npm run build
```
