# ShowMap

Agenda, propostas, contratantes, escritórios e agentes. O Supabase armazena os dados; a função `manage-user` valida permissões no servidor.

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Preencha `.env.local` somente com a URL e a chave **publishable**. Nunca use uma chave secreta no navegador ou no Git.

## Configurar o Supabase

1. Em um projeto novo, execute `supabase/setup.sql` no SQL Editor.
2. Crie o Administrador Master em **Authentication > Users**, usando o e-mail definido no SQL.
3. Publique a função:

```bash
npx supabase login
npx supabase functions deploy manage-user --project-ref veszdgbonolvmcpablol
```

Para instalações já existentes, execute `supabase/migration-profile-link.sql` uma única vez. `migration-clean-start.sql` apaga dados e não deve ser usado em produção.

## Perfis

- Master: gerencia todos os dados.
- Escritório: gerencia sua agenda e seus agentes.
- Agente: registra e acompanha propostas do próprio escritório.

## Validar

```bash
npm run lint
npm run build
```
