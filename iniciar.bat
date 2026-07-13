@echo off
title Iniciar Projeto ShowMap

echo =========================================
echo Iniciando o ambiente de desenvolvimento...
echo =========================================

:: Verifica se a pasta node_modules existe. Se não existir, avisa para rodar npm install
if not exist "node_modules" (
echo [AVISO] Pasta node_modules não encontrada!
echo Instalando dependencias...
npm install
)

:: Abre o projeto no VS Code (se estiver instalado no PATH)
echo Abrindo o Visual Studio Code...
start code .

:: Inicia o servidor de desenvolvimento do Vite
echo Iniciando o servidor Vite...
npm run dev

pause