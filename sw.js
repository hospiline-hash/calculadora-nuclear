// Service Worker - Calculadora F-18
// Sem este arquivo, o navegador não considera o site "instalável" como app.
// Ele faz cache só da casca do app (HTML/ícones), para abrir mais rápido.
// Não interfere em nada nos dados do Firebase: toda consulta ao banco
// continua indo direto para a internet, nunca passa pelo cache.

const CACHE_NOME = 'calc-f18-cache-v1';
const ARQUIVOS_CACHE = [
  './index.html',
  './calculadora.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NOME).then((cache) => {
      return cache.addAll(ARQUIVOS_CACHE).catch(() => {
        // Se algum arquivo não existir (ex: logo.png com outro nome),
        // não trava a instalação do app por causa disso.
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Nunca mexe em chamadas ao Firebase (login, banco de dados, etc).
  // Elas sempre vão direto para a internet, em tempo real.
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('firebaseapp.com')) {
    return;
  }

  // Para os arquivos do próprio app: tenta a rede primeiro (para sempre
  // pegar a versão mais nova), e só usa o cache se estiver sem internet.
  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(event.request, copia));
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});
