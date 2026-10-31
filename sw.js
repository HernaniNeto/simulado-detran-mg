// Deixa o simulado funcionando sem internet depois da primeira visita.
'use strict';

var CACHE = 'simulado-v1';
var ESPERA_REDE = 3000;
var BASE = [
  './', 'app.js', 'estilo.css', 'manifest.webmanifest',
  'dados/banco.js', 'dados/extras.js', 'fontes/montserrat.woff2',
  'simbolos/bandeira.svg', 'simbolos/brasao.png',
  'icones/icone-180.png', 'icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-mascara-512.png'
];

// As figuras saem dos próprios dados, assim a lista não precisa de manutenção.
// Uma figura que falhe não impede a instalação: ela volta a ser buscada ao aparecer.
function guardarPlacas(cache) {
  return Promise.all(['dados/banco.js', 'app.js'].map(function (arquivo) {
    return cache.match(arquivo).then(function (r) { return r.text(); });
  })).then(function (textos) {
    var nomes = {};
    (textos.join(' ').match(/[A-Za-z0-9-]+\.(?:png|svg)/g) || []).forEach(function (n) { nomes[n] = true; });
    return Promise.all(Object.keys(nomes).map(function (nome) {
      var url = 'placas/' + nome;
      return fetch(url).then(function (r) {
        if (r.ok) return cache.put(url, r);
      }).catch(function () { /* fica para depois */ });
    }));
  });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(BASE).then(function () { return guardarPlacas(cache); });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (chaves) {
    return Promise.all(chaves.filter(function (c) { return c !== CACHE; }).map(function (c) { return caches.delete(c); }));
  }).then(function () { return self.clients.claim(); }));
});

function doCache(pedido) {
  return caches.match(pedido, { ignoreSearch: true }).then(function (r) {
    return r || (pedido.mode === 'navigate' ? caches.match('./') : undefined);
  });
}

// Página, código e questões: tenta a rede para pegar atualizações, sem travar em sinal ruim.
function redePrimeiro(pedido) {
  var rede = fetch(pedido).then(function (r) {
    if (r.ok) {
      var copia = r.clone();
      caches.open(CACHE).then(function (cache) { cache.put(pedido, copia); });
    }
    return r;
  });
  var espera = new Promise(function (resolver) {
    setTimeout(function () { doCache(pedido).then(resolver); }, ESPERA_REDE);
  });
  return Promise.race([rede, espera]).then(function (r) {
    return r || rede;
  }).catch(function () {
    return doCache(pedido).then(function (r) { return r || Response.error(); });
  });
}

// Figuras, fonte e ícones quase não mudam.
function cachePrimeiro(pedido) {
  return caches.match(pedido).then(function (salvo) {
    return salvo || fetch(pedido).then(function (r) {
      if (r.ok) {
        var copia = r.clone();
        caches.open(CACHE).then(function (cache) { cache.put(pedido, copia); });
      }
      return r;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var pedido = e.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  var estatico = /\.(?:png|svg|woff2)$/.test(new URL(pedido.url).pathname);
  e.respondWith(estatico ? cachePrimeiro(pedido) : redePrimeiro(pedido));
});
