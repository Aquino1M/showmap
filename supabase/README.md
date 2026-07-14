# Supabase

## Banco de dados

Execute `setup.sql` uma vez no SQL Editor. Ele cria tabelas, políticas e o perfil automático do Master.

`migration-clean-start.sql` é opcional e destrutivo: remove testes, escritórios e eventos, preservando o Master.

## Função de logins

`functions/manage-user` cria, edita e exclui contas. Ela usa as credenciais protegidas fornecidas pelo Supabase.

No terminal do projeto:

```bash
npx supabase login
npx supabase link --project-ref veszdgbonolvmcpablol
npx supabase functions deploy manage-user --project-ref veszdgbonolvmcpablol
```

Não cadastre variáveis `SUPABASE_` em **Edge Functions > Secrets**: o prefixo é reservado. Não exponha chaves secretas.

Confirme a função ativa em **Edge Functions** e crie um escritório para testar o login.
