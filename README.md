WilcoBank - Instruções de Execução

1. Clonar e instalar
cmd
git clone https://github.com/TEU_USERNAME/wilcobank.git
cd wilcobank
Instalar backend:
cmd
cd backend
npm install
Instalar frontend:
cmd
cd ..frontend
npm install

2. Configurar variáveis de ambiente
Criar ficheiro backend\.env:
cmd
cd ..backend
Conteúdo do backend\.env:
env
DATABASE_URL="postgresql://postgres:SUA_PASSWORD@db.seu-projeto.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:SUA_PASSWORD@db.seu-projeto.supabase.co:5432/postgres"
JWT_SECRET="sua_chave_secreta_aqui_minimo_32_caracteres"
PORT=3001
NODE_ENV=development
Criar ficheiro frontend\.env.local:
cmd
cd ..frontend
Conteúdo do frontend\.env.local:
env
VITE_API_URL=http://localhost:3001/api

3. Gerar Prisma Client e criar tabelas automaticamente
cmd
cd ..backend
npx prisma generate
npx prisma migrate dev --name init
 Este comando cria todas as tabelas automaticamente no Supabase!

4. Inserir dados iniciais (seed)
cmd
npx prisma db seed
 Insere tipos de conta e tipos de operação automaticamente!
Se o seed não funcionar, executa no SQL Editor do Supabase:
sql
INSERT INTO "TipoConta" (id_tipo, nome_tipo) VALUES (1, 'Corrente'), (2, 'Poupanca')
ON CONFLICT (id_tipo) DO NOTHING;

INSERT INTO "TiposOperacao" ("id_tipo_O", nome_operacao) VALUES 
  (1, 'Levantamento'), (2, 'Deposito'), (3, 'Transferencia'), 
  (4, 'Juros'), (5, 'Taxa de Serviço')
ON CONFLICT ("id_tipo_O") DO NOTHING;
5. Executar

Opção A - Terminais separados:
Terminal 1 (backend):
cmd
cd backend
npm start
Terminal 2 (frontend):
cmd
cd frontend
npm run dev
Opção B - Tudo junto (raiz do projeto):
Na raiz do projeto, criar package.json:
cmd
cd ..\wilcobank
Conteúdo do package.json na raiz:

JSON
{
  "scripts": {
    "dev": "concurrently -n "BACK,FRONT" -c "green,yellow" "cd backend && npm start" "cd frontend && npm run dev""
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}

Instalar e executar:
cmd
npm install
npm run dev


6. Aceder
Frontend: http://localhost:5173
Backend: http://localhost:3001



🌐 Produção (Deploy)
Backend - Railway
railway.app → New Project → GitHub repo
Root Directory: backend
Variables:
DATABASE_URL
DIRECT_URL
JWT_SECRET
PORT=3001
NODE_ENV=production
Deploy
Frontend - Vercel
vercel.com → Add New Project
Root Directory: frontend
Framework: Vite
Variable: VITE_API_URL=https://teu-backend.up.railway.app/api
Deploy
🔧 Comandos úteis



Comando	Descrição

npm start	Inicia backend
npm run dev	Inicia frontend (Vite)
npm run build	Build frontend para produção
npx prisma generate	Gera Prisma Client
npx prisma migrate dev	Cria/atualiza tabelas
npx prisma db seed	Insere dados iniciais
npx prisma studio	Abre GUI da base de dados
git add . && git commit -m "msg" && git push	Envia código
