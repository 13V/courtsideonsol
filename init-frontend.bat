@echo off
set PATH=C:\Users\Administrator\.gemini\antigravity\scratch\tools\node-v20.18.0-win-x64;%PATH%
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --no-git --no-turbo --no-react-compiler
