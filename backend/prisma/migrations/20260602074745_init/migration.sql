-- CreateTable
CREATE TABLE "Cliente" (
    "id_cliente" SERIAL NOT NULL,
    "nome_cliente" TEXT NOT NULL,
    "apelido_cliente" TEXT,
    "email_cliente" TEXT NOT NULL,
    "senha_cliente" TEXT NOT NULL,
    "sexo_cliente" TEXT,
    "BI_cliente" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "TipoConta" (
    "id_tipo" INTEGER NOT NULL,
    "nome_tipo" TEXT NOT NULL,

    CONSTRAINT "TipoConta_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "Conta" (
    "id_conta" SERIAL NOT NULL,
    "numero_conta" TEXT NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "id_tipo" INTEGER,
    "id_cliente" INTEGER,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id_conta")
);

-- CreateTable
CREATE TABLE "TiposOperacao" (
    "id_tipo_O" INTEGER NOT NULL,
    "nome_operacao" TEXT NOT NULL,

    CONSTRAINT "TiposOperacao_pkey" PRIMARY KEY ("id_tipo_O")
);

-- CreateTable
CREATE TABLE "Operacao" (
    "id_operacao" SERIAL NOT NULL,
    "data_operacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DOUBLE PRECISION NOT NULL,
    "id_tipo_O" INTEGER,
    "numero_conta" TEXT,
    "conta_relacionada" TEXT,
    "taxa_cobrada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descricao" TEXT,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id_operacao")
);

-- CreateTable
CREATE TABLE "PasswordHistory" (
    "id" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_cliente_key" ON "Cliente"("email_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_BI_cliente_key" ON "Cliente"("BI_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "Conta_numero_conta_key" ON "Conta"("numero_conta");

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoConta"("id_tipo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conta" ADD CONSTRAINT "Conta_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_id_tipo_O_fkey" FOREIGN KEY ("id_tipo_O") REFERENCES "TiposOperacao"("id_tipo_O") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_numero_conta_fkey" FOREIGN KEY ("numero_conta") REFERENCES "Conta"("numero_conta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordHistory" ADD CONSTRAINT "PasswordHistory_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;
