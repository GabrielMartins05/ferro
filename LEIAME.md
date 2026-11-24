# Fitness

App de treino de força, cárdio, alimentação e foco, com níveis 1–4 e janela de treino.

## Estrutura

| Arquivo | O que é |
|---|---|
| `src/app.html` | O app (telas, regras, login, sincronização) |
| `src/admin.html` | Painel de admin (web) |
| `src/foods.json` | Lista padrão de comidas prontas |
| `config.json` | URL e chave pública do Supabase |
| `supabase/schema.sql` | Banco: tabelas, segurança e funções do admin |
| `privacidade.html`, `termos.html` | Política de Privacidade e Termos de Uso |
| `android/`, `ios/` | Projetos nativos (Capacitor) |
| `assets/icon.png` | Ícone 1024×1024 usado para gerar os ícones nativos |

Depois de mudar qualquer coisa em `src/` ou `config.json`, rode `npm run cap:sync`, que gera o `index.html`, o `admin.html` e a pasta `www/` e copia tudo para os projetos nativos.

## Ligar o login e a nuvem (Supabase, grátis)

1. Crie uma conta em https://supabase.com e um projeto novo (região São Paulo).
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para o `config.json`. A chave anon é pública por natureza: a segurança vem das regras do banco. Nunca coloque a chave `service_role` aqui.
4. Em **Authentication → URL Configuration**, coloque `https://gabrielmartins05.github.io/ferro/` em **Site URL** e em **Redirect URLs**.
5. Rode `npm run cap:sync`, abra o app, crie sua conta e confirme o e-mail.
6. No SQL Editor, rode `update public.profiles set role = 'admin' where email = 'SEU_EMAIL';`. Em Ajustes aparece **Abrir painel de admin** (ou acesse `admin.html`).

## Gerar o app

- **Android:** instale o Android Studio, rode `npx cap open android` e use Build → Build APK para testar no celular. Publicar no Google Play custa US$ 25 uma vez.
- **iOS:** precisa de um Mac com Xcode (`npx cap open ios`) e da conta Apple Developer (US$ 99 por ano) para publicar.

## Antes de publicar em loja

- Trocar `[COLOQUE AQUI O E-MAIL DE CONTATO]` em `privacidade.html` e `termos.html`.
- Escolher um nome próprio para a loja (não pode usar marca de terceiros nem só "Fitness").
- Se adicionar login com Google, a Apple exige também "Entrar com Apple".
