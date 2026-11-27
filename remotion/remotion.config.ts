// Configuração do Remotion (vale para o studio e para o render pela linha de comando)
import fs from "node:fs";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Neste ambiente na nuvem já existe um Chrome sem interface; no seu computador o Remotion baixa o dele sozinho.
const CHROME = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(CHROME)) Config.setBrowserExecutable(CHROME);
// WebGL (Three.js) por software quando não há placa de vídeo
Config.setChromiumOpenGlRenderer("swangle");
