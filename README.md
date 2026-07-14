# ShowMap

Painel de agenda, propostas e contratantes para escritórios e agentes. Dados e logins usam Supabase.

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Preencha `.env.local` com URL e chave **publishable**. Nunca exponha chave secreta.

## Primeiro acesso e banco de dados

1. Execute `supabase/setup.sql` uma vez no SQL Editor.
2. Crie o Master em **Authentication > Users** com o e-mail indicado em `setup.sql`.
3. Publique `manage-user` conforme [supabase/README.md](supabase/README.md).

O Master cria escritórios e agentes; a Edge Function cria ou remove seus logins.

## Comandos

```bash
npm run dev
npm run lint
npm run build
```
