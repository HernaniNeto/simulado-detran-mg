(function () {
  'use strict';

  var TOTAL = 30, MINIMO = 20, DURACAO = 60 * 60 * 1000;
  // Sorteio próximo do tamanho de cada módulo do banco oficial, com reforço em
  // infrações (módulo 2). A Senatran não publicou os critérios da prova real.
  var COTAS = { 1: 8, 2: 6, 3: 11, 4: 5 };
  var MIN_PLACAS = 4;
  // As 12 clássicas incluem 5 de níveis de infração, uma de cada grupo.
  var COTA_CLASSICAS = 12, MIN_NIVEIS = 5;
  var LETRAS = ['A', 'B', 'C', 'D'];
  var CHAVE = { prova: 'detran.prova', hist: 'detran.historico', erradas: 'detran.erradas', vistas: 'detran.vistas', letras: 'detran.letras', contraste: 'detran.contraste' };

  var app = document.getElementById('app');
  var BANCO = window.BANCO, GUIA = window.GUIA, MODULOS = window.MODULOS, CLASSICAS = window.CLASSICAS;
  var porId = {}, ehClassica = {};
  BANCO.forEach(function (q) { porId[q.i] = q; });
  CLASSICAS.forEach(function (c) { c.ids.forEach(function (id) { ehClassica[id] = true; }); });

  var estado = { tela: 'inicio', sessao: null, resultado: null, filtro: 'erradas', aba: 'R', busca: '', confirmar: false };
  var relogio = null, avisados = {}, pedidoInstalar = null;

  function aplicarAcessibilidade() {
    var raiz = document.documentElement;
    var letras = ler(CHAVE.letras, 0);
    if (letras) raiz.dataset.letras = letras; else delete raiz.dataset.letras;
    if (ler(CHAVE.contraste, false)) raiz.dataset.contraste = '1'; else delete raiz.dataset.contraste;
  }

  /* Utilidades */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* segue sem salvar */ }
  }
  function apagar(chave) {
    try { localStorage.removeItem(chave); } catch (e) { /* nada a fazer */ }
  }
  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function normalizar(t) { return t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }
  function temFigura(q) { return !!q.g; }

  function avisar(texto) {
    var el = document.getElementById('aviso');
    el.textContent = texto;
    el.classList.add('visivel');
    clearTimeout(avisar.t);
    avisar.t = setTimeout(function () { el.classList.remove('visivel'); }, 5000);
  }

  /* Sorteio */
  function criarItem(q) {
    var alternativas = embaralhar([q.c].concat(q.x));
    return { id: q.i, alts: alternativas, certa: alternativas.indexOf(q.c), resp: null, marcada: false };
  }

  function sortearProva() {
    var vistas = ler(CHAVE.vistas, []), recentes = {};
    vistas.forEach(function (id) { recentes[id] = true; });
    var usadas = {}, placasUsadas = {}, escolhidas = [], restam = { 1: COTAS[1], 2: COTAS[2], 3: COTAS[3], 4: COTAS[4] }, placas = 0;

    function pode(q) {
      if (restam[q.m] <= 0) return false;
      var chave = normalizar(q.t);
      if (usadas[chave]) return false;
      if (q.p && placasUsadas[q.p]) return false;
      // Guarda vagas do módulo 1 para o mínimo de placas.
      if (q.m === 1 && !temFigura(q) && restam[1] <= MIN_PLACAS - placas) return false;
      return true;
    }
    function usar(q) {
      usadas[normalizar(q.t)] = true;
      if (q.p) placasUsadas[q.p] = true;
      if (temFigura(q) && q.m === 1) placas++;
      restam[q.m]--;
      escolhidas.push(q);
    }
    // As clássicas ignoram as questões já vistas: é isso que as faz voltar.
    function pegarClassica(tema) {
      var q = embaralhar(tema.ids.map(function (id) { return porId[id]; })).filter(pode)[0];
      if (q) usar(q);
      return !!q;
    }
    function pegarClassicas() {
      var niveis = embaralhar(CLASSICAS.filter(function (c) { return c.nivel; }));
      var sorteados = niveis.slice(0, MIN_NIVEIS);
      var demais = embaralhar(niveis.slice(MIN_NIVEIS).concat(CLASSICAS.filter(function (c) { return !c.nivel; })));
      var qtd = 0;
      sorteados.concat(demais).forEach(function (tema) {
        if (qtd < COTA_CLASSICAS && pegarClassica(tema)) qtd++;
      });
    }
    function pegar(lista) {
      var novas = embaralhar(lista.filter(function (q) { return !recentes[q.i]; }));
      var repetidas = embaralhar(lista.filter(function (q) { return recentes[q.i]; }));
      novas.concat(repetidas).forEach(function (q) {
        if (pode(q)) usar(q);
      });
    }

    pegarClassicas();
    var outras = BANCO.filter(function (q) { return !ehClassica[q.i]; });
    embaralhar(outras.filter(function (q) { return q.m === 1 && temFigura(q) && !recentes[q.i]; })).concat(
      embaralhar(outras.filter(function (q) { return q.m === 1 && temFigura(q) && recentes[q.i]; }))
    ).forEach(function (q) {
      if (placas < MIN_PLACAS && pode(q)) usar(q);
    });
    [1, 2, 3, 4].forEach(function (m) {
      pegar(outras.filter(function (q) { return q.m === m; }));
    });

    gravar(CHAVE.vistas, escolhidas.map(function (q) { return q.i; }).concat(vistas).slice(0, 300));
    return embaralhar(escolhidas);
  }

  /* Início de sessão */
  function comecarProva() {
    avisados = {};
    estado.sessao = {
      tipo: 'prova',
      itens: sortearProva().map(criarItem),
      atual: 0,
      inicio: Date.now(),
      fim: Date.now() + DURACAO
    };
    salvarProva();
    irPara('prova');
  }
  function salvarProva() {
    if (estado.sessao && estado.sessao.tipo === 'prova') gravar(CHAVE.prova, estado.sessao);
  }
  function comecarTreino(titulo, questoes) {
    if (!questoes.length) { avisar('Ainda não há questões para treinar aqui.'); return; }
    estado.sessao = {
      tipo: 'treino',
      titulo: titulo,
      itens: embaralhar(questoes).slice(0, 20).map(criarItem),
      atual: 0
    };
    irPara('prova');
  }

  function irPara(tela) {
    estado.tela = tela;
    estado.confirmar = false;
    pararRelogio();
    desenhar();
    window.scrollTo(0, 0);
  }

  /* Cronômetro */
  function pararRelogio() {
    if (relogio) { clearInterval(relogio); relogio = null; }
  }
  function iniciarRelogio() {
    pararRelogio();
    atualizarRelogio();
    relogio = setInterval(atualizarRelogio, 250);
  }
  function atualizarRelogio() {
    var s = estado.sessao;
    if (!s || s.tipo !== 'prova') return;
    var resta = s.fim - Date.now();
    if (resta <= 0) { entregar(true); return; }
    var el = document.getElementById('tempo');
    if (el) {
      el.textContent = mmss(resta);
      var caixa = el.parentNode;
      caixa.classList.toggle('alerta', resta <= 10 * 60000 && resta > 5 * 60000);
      caixa.classList.toggle('urgente', resta <= 5 * 60000);
    }
    [[10, 'Restam 10 minutos de prova.'], [5, 'Restam 5 minutos de prova.'], [1, 'Resta 1 minuto. A prova será entregue ao zerar o tempo.']].forEach(function (a) {
      if (resta <= a[0] * 60000 && resta > (a[0] * 60000 - 3000) && !avisados[a[0]]) {
        avisados[a[0]] = true;
        avisar(a[1]);
      }
    });
  }

  /* Entrega */
  function entregar(porTempo) {
    var s = estado.sessao;
    pararRelogio();
    var acertos = 0, porModulo = {};
    s.itens.forEach(function (it) {
      var m = porId[it.id].m;
      porModulo[m] = porModulo[m] || { certas: 0, total: 0 };
      porModulo[m].total++;
      if (it.resp === it.certa) { acertos++; porModulo[m].certas++; }
    });
    estado.resultado = {
      itens: s.itens,
      acertos: acertos,
      aprovado: acertos >= MINIMO,
      gasto: Math.min(Date.now() - s.inicio, DURACAO),
      brancos: s.itens.filter(function (it) { return it.resp === null; }).length,
      porModulo: porModulo,
      porTempo: !!porTempo
    };
    var hist = ler(CHAVE.hist, []);
    hist.unshift({ quando: Date.now(), acertos: acertos, gasto: estado.resultado.gasto });
    gravar(CHAVE.hist, hist.slice(0, 20));
    registrarErradas(s.itens);
    apagar(CHAVE.prova);
    estado.sessao = null;
    estado.filtro = acertos === TOTAL ? 'todas' : 'erradas';
    irPara('resultado');
  }
  function registrarErradas(itens) {
    var erradas = ler(CHAVE.erradas, []);
    itens.forEach(function (it) {
      if (it.resp === null) return;
      var pos = erradas.indexOf(it.id);
      if (it.resp === it.certa) { if (pos >= 0) erradas.splice(pos, 1); }
      else if (pos < 0) erradas.push(it.id);
    });
    gravar(CHAVE.erradas, erradas);
  }

  /* Partes visuais */
  function figuras(q) {
    if (!q.g) return '';
    return '<div class="figuras">' + q.g.map(function (g) {
      var via = /^(LFO|LMS|LBO|LPP|MCA|FTP|LRE)/.test(g);
      return '<div class="figura' + (via ? ' via' : '') + '"><img src="placas/' + esc(g) + '" alt="' +
        (via ? 'Sinalização pintada na via citada na questão' : 'Placa de trânsito citada na questão') + '"></div>';
    }).join('') + '</div>';
  }

  var ICONES = {
    prova: '<path d="M9 2h6a2 2 0 0 1 2 2h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1a2 2 0 0 1 2-2zm0 2v2h6V4H9zm7.3 7.3-5.3 5.3-2.3-2.3-1.4 1.4 3.7 3.7 6.7-6.7-1.4-1.4z"/>',
    placa: '<path d="M12 1.5 22.5 12 12 22.5 1.5 12 12 1.5zM11 7v7h2V7h-2zm0 8.5v2h2v-2h-2z"/>',
    lista: '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h7v-2H7z"/>',
    cone: '<path d="M10.2 3h3.6l1.1 4H9.1l1.1-4zM8.5 9h7l1.1 4H7.4l1.1-4zm-1.6 6h10.2l1.1 4H21v2H3v-2h2.8l1.1-4z"/>'
  };
  function icone(nome) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONES[nome] + '</svg>';
  }

  function provaAtiva() {
    var p = ler(CHAVE.prova, null);
    return p && p.fim > Date.now() ? p : null;
  }

  function faixa() {
    var letras = ler(CHAVE.letras, 0), contraste = ler(CHAVE.contraste, false);
    return '<div class="faixa"><div class="miolo"><span>Simulado para estudo. Não é um site oficial do Detran-MG.</span>' +
      '<div class="faixa-acoes"><span>Letras</span>' +
      '<button data-letras="1" aria-label="Aumentar letras"' + (letras >= 2 ? ' disabled' : '') + '>A+</button>' +
      '<button data-letras="-1" aria-label="Diminuir letras"' + (letras <= 0 ? ' disabled' : '') + '>A−</button>' +
      '<button data-acao="contraste" aria-pressed="' + contraste + '">Contraste</button>' +
      (pedidoInstalar ? '<button class="instalar" data-acao="instalar">Instalar app</button>' : '') + '</div></div></div>';
  }

  function cabecalho(ativo) {
    var ativa = provaAtiva();
    var itens = [['inicio', 'Início'], [ativa ? 'continuar' : 'comecar', ativa ? 'Continuar a prova' : 'Fazer a prova'], ['treino', 'Treinar'], ['guia', 'Placas e sinalização'], ['provas', 'Minhas provas']];
    return '<header class="cabecalho"><div class="miolo">' +
      '<img class="bandeira" src="simbolos/bandeira.svg" alt="Bandeira de Minas Gerais">' +
      '<img class="brasao" src="simbolos/brasao.png" alt="Brasão de Minas Gerais">' +
      '<div class="marca"><b>Simulado Detran-MG</b><span>Prova teórica para a CNH em Minas Gerais</span></div>' +
      '</div></header><nav class="menu sobre-escuro" aria-label="Menu principal"><div class="miolo">' +
      itens.map(function (m) {
        return '<button data-acao="' + m[0] + '"' + (m[0] === ativo ? ' aria-current="page"' : '') + '>' + m[1] + '</button>';
      }).join('') + '</div></nav>';
  }

  function idsNiveis() {
    return CLASSICAS.filter(function (c) { return c.nivel; }).reduce(function (ids, c) { return ids.concat(c.ids); }, []);
  }

  function telaInicio() {
    var ativa = provaAtiva();
    var hist = ler(CHAVE.hist, []);
    var erradas = ler(CHAVE.erradas, []);
    var contagem = {};
    BANCO.forEach(function (q) { contagem[q.m] = (contagem[q.m] || 0) + 1; });
    var comFigura = BANCO.filter(temFigura).length;

    var linhas = Object.keys(MODULOS).map(function (m) {
      return '<li><button data-treino="' + m + '">' + esc(MODULOS[m]) + '<small>' + contagem[m] + '</small></button></li>';
    }).join('');
    linhas = '<li><button data-treino="placas">Só placas e sinalização<small>' + comFigura + '</small></button></li>' + linhas;
    linhas = '<li><button data-treino="classicas">Clássicas que mais se repetem<small>' + Object.keys(ehClassica).length + '</small></button></li>' +
      '<li><button data-treino="niveis">Níveis de infração e pontos<small>' + idsNiveis().length + '</small></button></li>' + linhas;
    if (erradas.length) {
      linhas = '<li><button data-treino="erradas">Questões que você errou<small>' + erradas.length + '</small></button></li>' + linhas;
    }

    var tabela = hist.length
      ? '<table class="historico"><thead><tr><th>Data</th><th>Resultado</th><th class="num">Acertos</th><th class="num">Tempo</th></tr></thead><tbody>' +
        hist.slice(0, 6).map(function (h) {
          var ok = h.acertos >= MINIMO;
          return '<tr><td>' + new Date(h.quando).toLocaleDateString('pt-BR') + '</td><td class="' + (ok ? 'passou' : 'nao-passou') + '">' + (ok ? 'Aprovado' : 'Reprovado') +
            '</td><td class="num">' + h.acertos + '/' + TOTAL + '</td><td class="num">' + mmss(h.gasto) + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="sem-provas">As provas que você entregar aparecem aqui, com a nota e o tempo gasto.</p>';

    var chamada = ativa
      ? '<button class="botao principal" data-acao="continuar">Continuar a prova (' + mmss(ativa.fim - Date.now()) + ')</button>'
      : '<button class="botao principal" data-acao="comecar">Começar a prova</button>';

    return cabecalho('inicio') + '<main class="miolo">' +
      '<section class="abertura"><div class="abertura-texto">' +
      '<h1>Treine para a prova teórica do <span class="sem-quebra">Detran-MG</span></h1>' +
      '<p>Questões reais do Banco Nacional de Questões da Senatran, de onde saem as provas de todos os Detrans, mais perguntas extras sobre níveis de infração. Cada prova traz ' + COTA_CLASSICAS + ' clássicas, que voltam sempre, sendo ' + MIN_NIVEIS + ' de níveis de infração, e ' + (TOTAL - COTA_CLASSICAS) + ' sorteadas entre as demais.</p>' +
      chamada +
      '</div><div class="abertura-bandeira"><img src="simbolos/bandeira.svg" alt="Bandeira de Minas Gerais, com o triângulo vermelho e o lema Libertas quae sera tamen"></div></section>' +
      '<section class="regras" aria-label="Como é a prova">' +
      '<div class="regra"><div class="sinal-regra sinal-losango"><b>30</b></div><span>questões de múltipla escolha</span></div>' +
      '<div class="regra"><div class="sinal-regra sinal-circulo"><div><b>60</b><small>min</small></div></div><span>de prova, com cronômetro</span></div>' +
      '<div class="regra"><div class="sinal-regra sinal-placa"><b>20</b></div><span>acertos para ser aprovado</span></div>' +
      '</section>' +
      '<section class="acesso"><h2>Acesso rápido</h2><div class="colunas">' +
      '<div class="coluna" id="treino"><div class="coluna-topo">' + icone('cone') + '<h3>Treinar</h3><p>Sem cronômetro, com a resposta certa na hora.</p></div><ul class="lista-temas">' + linhas + '</ul></div>' +
      '<div class="coluna"><div class="coluna-topo">' + icone('placa') + '<h3>Placas e sinalização</h3><p>Placas, marcas na via, semáforos e gestos do agente.</p></div>' +
      '<div class="tira-placas"><img src="placas/R-1.svg" alt="Placa Parada obrigatória"><img src="placas/R-19-60.svg" alt="Placa Velocidade máxima de 60 km/h"><img src="placas/A-14.png" alt="Placa Semáforo à frente"><img src="placas/A-32b.png" alt="Placa Passagem sinalizada de pedestres"><img src="placas/SAU-10.png" alt="Placa Pronto-socorro"></div>' +
      '<div class="centro"><button class="pilula" data-acao="guia">Estudar placas</button></div></div>' +
      '<div class="coluna" id="provas"><div class="coluna-topo">' + icone('lista') + '<h3>Minhas provas</h3><p>Seu histórico fica salvo neste navegador.</p></div>' + tabela + '</div>' +
      '</div></section></main>' + rodape();
  }

  function rodape() {
    return '<footer class="rodape sobre-escuro"><div class="miolo"><img class="selo" src="simbolos/brasao.png" alt=""><div>' +
      '<p><b>Simulado independente, feito para estudo.</b> Não é um serviço do Detran-MG, da Senatran nem do Governo de Minas Gerais, e o resultado não vale para o processo da CNH.</p>' +
      '<p>Regras conforme a Resolução Contran nº 1.020/2025, arts. 33 e 34: 30 questões, no mínimo uma hora de prova e 20 acertos para aprovação. Questões do Banco Nacional de Questões, versão 1.0 (Senatran), e extras sobre infrações escritas a partir do CTB. A Senatran não divulga quais questões caem mais: as clássicas são uma seleção de temas recorrentes, não uma estatística oficial. Origem das figuras e dos símbolos em CREDITOS.txt.</p>' +
      '<p><button data-acao="limpar">Apagar meu histórico e minhas questões erradas</button></p></div></div></footer>';
  }

  function telaProva() {
    var s = estado.sessao, it = s.itens[s.atual], q = porId[it.id], treino = s.tipo === 'treino';
    var respondida = it.resp !== null;
    var estrada = s.itens.map(function (x, i) {
      var c = 'traco';
      if (treino && x.resp !== null) c += x.resp === x.certa ? ' acertou' : ' errou';
      else if (x.resp !== null) c += ' respondida';
      if (i === s.atual) c += ' atual';
      if (x.marcada) c += ' marcada';
      var estadoTxt = x.resp !== null ? 'respondida' : 'sem resposta';
      return '<button class="' + c + '" data-ir="' + i + '" aria-label="Questão ' + (i + 1) + ', ' + estadoTxt + (x.marcada ? ', marcada para revisar' : '') + '"' +
        (i === s.atual ? ' aria-current="true"' : '') + '>' + (i + 1) + '</button>';
    }).join('');
    var colunas = ' style="--n:' + s.itens.length + '"';

    var alts = it.alts.map(function (a, i) {
      var c = 'alt', marcada = it.resp === i;
      if (treino && respondida) {
        if (i === it.certa) c += ' certa';
        else if (marcada) c += ' errada';
      }
      return '<button class="' + c + '" role="radio" aria-checked="' + marcada + '" data-alt="' + i + '"' + (treino && respondida ? ' disabled' : '') +
        '><span class="letra">' + LETRAS[i] + '</span><span>' + esc(a) + '</span></button>';
    }).join('');

    var explicacao = treino && respondida
      ? '<div class="comentario"><b>' + (it.resp === it.certa ? 'Você acertou' : 'Resposta certa: ' + LETRAS[it.certa]) + '</b>' + esc(q.k) +
        (q.o ? '<p class="nota-banco">' + esc(q.o) + '</p>' : '') + '</div>'
      : '';

    var ultima = s.atual === s.itens.length - 1;
    var cabeca = '<div class="painel-esq"><img class="bandeira" src="simbolos/bandeira.svg" alt="Bandeira de Minas Gerais">' + (treino
      ? '<span class="titulo-treino">' + esc(s.titulo) + '</span></div><div class="painel-acoes"><button class="botao" data-acao="sair-treino">Sair do treino</button></div>'
      : '<div class="cronometro" role="timer" aria-label="Tempo restante"><time id="tempo">' + mmss(s.fim - Date.now()) + '</time><span>restantes</span></div></div>' +
        '<div class="painel-acoes"><button class="botao principal" data-acao="pedir-entrega">Entregar prova</button></div>');

    var respondidas = s.itens.filter(function (x) { return x.resp !== null; }).length;
    var janela = '';
    if (estado.confirmar) {
      var faltam = s.itens.length - respondidas;
      var marcadas = s.itens.filter(function (x) { return x.marcada; }).length;
      janela = '<div class="fundo-janela"><div class="janela" role="dialog" aria-modal="true" aria-labelledby="titulo-janela">' +
        '<h2 id="titulo-janela">Entregar a prova agora?</h2><p>' +
        (faltam ? 'Você deixou ' + plural(faltam, 'questão', 'questões') + ' sem resposta. Questão em branco conta como erro.' : 'Você respondeu todas as questões.') +
        (marcadas ? ' ' + plural(marcadas, 'questão está marcada', 'questões estão marcadas') + ' para revisar.' : '') +
        '</p><p>Ainda restam ' + mmss(s.fim - Date.now()) + '.</p>' +
        '<div class="navegar"><button class="botao" data-acao="voltar-prova">Voltar à prova</button><button class="botao principal" data-acao="entregar">Entregar prova</button></div></div></div>';
    }

    return '<header class="painel sobre-escuro"><div class="miolo"><div class="painel-topo">' + cabeca + '</div>' +
      '<nav class="estrada" aria-label="Questões"' + colunas + '>' + estrada + '</nav></div></header>' +
      '<main class="questao"><div class="miolo">' +
      '<div class="questao-topo"><span>Questão ' + (s.atual + 1) + ' de ' + s.itens.length + ' em ' + esc(MODULOS[q.m]) + '</span>' +
      (treino ? '' : '<button class="btn-marcar" data-acao="marcar" aria-pressed="' + it.marcada + '">' + (it.marcada ? 'Marcada para revisar' : 'Marcar para revisar') + '</button>') + '</div>' +
      '<div class="enunciado"><h2 id="enunciado">' + esc(q.t) + '</h2>' + figuras(q) + '</div>' +
      '<div class="alternativas" role="radiogroup" aria-labelledby="enunciado">' + alts + '</div>' + explicacao +
      '<div class="navegar"><button class="botao" data-acao="anterior"' + (s.atual === 0 ? ' disabled' : '') + '>Anterior</button>' +
      (ultima
        ? (treino ? '<button class="botao principal" data-acao="sair-treino">Concluir treino</button>' : '<button class="botao principal" data-acao="pedir-entrega">Entregar prova</button>')
        : '<button class="botao principal" data-acao="proxima">Próxima</button>') + '</div>' +
      '<p class="atalhos">Atalhos: teclas A, B, C e D para responder, setas para trocar de questão.</p>' +
      '</div></main>' + janela;
  }

  function porcentagem(acertos) {
    return (acertos / TOTAL * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  }

  function telaResultado() {
    var r = estado.resultado;
    var frase = r.aprovado
      ? 'Você passou do mínimo de ' + MINIMO + ' acertos (' + porcentagem(MINIMO) + ').'
      : (MINIMO - r.acertos === 1 ? 'Faltou 1 acerto' : 'Faltaram ' + (MINIMO - r.acertos) + ' acertos') + ' para chegar aos ' + MINIMO + ' (' + porcentagem(MINIMO) + ').';
    if (r.porTempo) frase = 'O tempo acabou e a prova foi entregue automaticamente. ' + frase;

    var temas = Object.keys(MODULOS).map(function (m) {
      var t = r.porModulo[m] || { certas: 0, total: 0 };
      return '<div class="tema-linha"><span>' + esc(MODULOS[m]) + '</span><span class="num">' + t.certas + '/' + t.total + '</span></div>';
    }).join('');

    var filtros = [['erradas', 'Erradas e em branco'], ['marcadas', 'Marcadas'], ['todas', 'Todas']].map(function (f) {
      return '<button class="filtro" data-filtro="' + f[0] + '" aria-pressed="' + (estado.filtro === f[0]) + '">' + f[1] + '</button>';
    }).join('');

    var itens = r.itens.map(function (it, n) {
      var q = porId[it.id];
      var acertou = it.resp === it.certa;
      if (estado.filtro === 'erradas' && acertou) return '';
      if (estado.filtro === 'marcadas' && !it.marcada) return '';
      var alts = it.alts.map(function (a, i) {
        var c = 'alt';
        if (i === it.certa) c += ' certa';
        else if (i === it.resp) c += ' errada';
        return '<div class="' + c + '"><span class="letra">' + LETRAS[i] + '</span><span>' + esc(a) + (i === it.resp ? ' (sua resposta)' : '') + '</span></div>';
      }).join('');
      var selo = it.resp === null ? '<span class="selo-resultado nao-passou">Em branco</span>' : (acertou ? '<span class="selo-resultado passou">Acertou</span>' : '<span class="selo-resultado nao-passou">Errou</span>');
      return '<article class="item-revisao"><div class="questao-topo"><span>Questão ' + (n + 1) + '</span>' + selo + '</div>' +
        '<div class="enunciado"><h3>' + esc(q.t) + '</h3>' + figuras(q) + '</div>' +
        '<div class="alternativas">' + alts + '</div>' +
        '<div class="comentario"><b>Por quê</b>' + esc(q.k) + (q.o ? '<p class="nota-banco">' + esc(q.o) + '</p>' : '') + '</div></article>';
    }).join('');
    if (!itens) itens = '<p class="vazio">Nenhuma questão neste filtro.</p>';

    return cabecalho('') + '<main class="miolo"><section class="veredito ' + (r.aprovado ? 'aprovado' : 'reprovado') + '">' +
      '<img class="selo" src="simbolos/brasao.png" alt="Brasão de Minas Gerais"><div>' +
      '<h1>' + (r.aprovado ? 'Aprovado' : 'Reprovado') + '</h1><p>' + esc(frase) + ' Tempo usado: ' + mmss(r.gasto) + '.' +
      (r.brancos ? ' ' + plural(r.brancos, 'questão ficou', 'questões ficaram') + ' em branco.' : '') + '</p></div>' +
      '<div class="placar" aria-label="' + r.acertos + ' acertos em ' + TOTAL + ', ' + porcentagem(r.acertos) + '">' + r.acertos + '<small>/' + TOTAL + '</small>' +
      '<span class="placar-porcentagem">' + porcentagem(r.acertos) + ' de acertos</span></div></section>' +
      '<div class="acoes-resultado"><button class="botao principal" data-acao="comecar">Fazer nova prova</button><button class="botao" data-acao="inicio">Voltar ao início</button></div>' +
      '<section class="painel-branco"><h2>Acertos por assunto</h2>' + temas + '</section>' +
      '<section class="painel-branco"><h2>Revisão das questões</h2><div class="filtros">' + filtros + '</div>' + itens + '</section></main>' + rodape();
  }

  var ABAS = [['R', 'Regulamentação'], ['A', 'Advertência'], ['I', 'Indicação'], ['H', 'Marcas na via'], ['S', 'Semáforos e agentes']];

  function grade(lista, via) {
    var termo = normalizar(estado.busca);
    var filtrada = lista.filter(function (p) { return !termo || normalizar(p[0] + ' ' + p[1]).indexOf(termo) >= 0; });
    if (!filtrada.length) return '<p class="vazio">Nenhuma placa encontrada para “' + esc(estado.busca) + '”. Tente outro nome ou código.</p>';
    return '<div class="grade-placas">' + filtrada.map(function (p) {
      return '<div class="placa-item' + (via ? ' via' : '') + '"><img loading="lazy" src="placas/' + esc(p[2]) + '" alt="' + esc(p[1]) + '"><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>' + (p[3] ? '<p>' + esc(p[3]) + '</p>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function luz(cores) {
    return '<div class="caixa-luz" aria-hidden="true">' + cores.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div>';
  }
  var APAGADA = '#3b3e42';

  function conteudoSemaforos() {
    return '<div class="grupo-regras"><h2>Semáforo para veículos</h2><div class="semaforos">' +
      '<div class="semaforo">' + luz(['#d8232a', APAGADA, APAGADA]) + '<div><b>Vermelho</b><p>Parada obrigatória.</p></div></div>' +
      '<div class="semaforo">' + luz([APAGADA, '#f6c90e', APAGADA]) + '<div><b>Amarelo</b><p>Atenção: pare, salvo se isso gerar situação de perigo.</p></div></div>' +
      '<div class="semaforo">' + luz([APAGADA, APAGADA, '#1f9d55']) + '<div><b>Verde</b><p>Siga, se a passagem estiver livre e segura.</p></div></div>' +
      '</div></div>' +
      '<div class="grupo-regras"><h2>Semáforo para pedestres</h2><dl>' +
      '<dt>Vermelho</dt><dd>Não atravesse.</dd>' +
      '<dt>Vermelho intermitente</dt><dd>O sinal vai mudar. Não comece a travessia; quem já começou deve terminar.</dd>' +
      '<dt>Verde</dt><dd>Pode atravessar.</dd></dl></div>' +
      '<div class="grupo-regras"><h2>Quem manda primeiro</h2><p>O art. 89 do CTB define a ordem: as ordens do agente valem mais que qualquer sinal, e os sinais valem mais que as regras gerais de circulação.</p></div>' +
      '<div class="grupo-regras"><h2>Gestos do agente</h2><dl>' +
      '<dt>Braço levantado na vertical, palma para a frente</dt><dd>Parada obrigatória para todos os veículos. Em cruzamentos, quem já está nele não precisa parar.</dd>' +
      '<dt>Braços estendidos na horizontal, palmas para a frente</dt><dd>Parada para os veículos que vêm de direções que cortam a linha dos braços.</dd>' +
      '<dt>Braço estendido na horizontal, palma para a frente, do lado do trânsito a que se destina</dt><dd>Parada para os veículos que vêm de direções que cortam a linha do braço.</dd>' +
      '<dt>Braço estendido na horizontal, palma para baixo, com movimentos verticais</dt><dd>Diminua a velocidade.</dd>' +
      '<dt>Braço estendido para a frente, antebraço movendo em direção às costas do agente</dt><dd>Siga, para quem havia recebido ordem de parada.</dd></dl></div>' +
      '<div class="grupo-regras"><h2>Sinais de apito</h2><dl>' +
      '<dt>Um silvo breve</dt><dd>Siga.</dd><dt>Dois silvos breves</dt><dd>Pare.</dd><dt>Um silvo longo</dt><dd>Diminua a marcha.</dd></dl><p>Os silvos são usados junto com os gestos do agente.</p></div>';
  }

  function conteudoGuia() {
    if (estado.aba === 'S') return conteudoSemaforos();
    return grade(GUIA[estado.aba], estado.aba === 'H');
  }

  function telaGuia() {
    var abas = ABAS.map(function (a) {
      return '<button class="aba" role="tab" data-aba="' + a[0] + '" aria-selected="' + (estado.aba === a[0]) + '">' + a[1] + '</button>';
    }).join('');
    var busca = estado.aba === 'S' ? '' :
      '<input class="busca" id="busca" type="search" placeholder="Buscar por nome ou código" aria-label="Buscar placa por nome ou código" value="' + esc(estado.busca) + '">';
    return cabecalho('guia') + '<main class="miolo"><section class="topo-guia"><h1>Placas e sinalização</h1><div class="abas" role="tablist">' + abas + '</div>' + busca + '</section>' +
      '<div id="conteudo-guia">' + conteudoGuia() + '</div></main>' + rodape();
  }

  /* Desenho */
  function desenhar() {
    var t = estado.tela;
    app.innerHTML = faixa() + (t === 'prova' ? telaProva() : t === 'resultado' ? telaResultado() : t === 'guia' ? telaGuia() : telaInicio());
    if (t === 'prova' && estado.sessao.tipo === 'prova') iniciarRelogio();
    if (estado.confirmar) {
      var b = app.querySelector('.janela [data-acao="voltar-prova"]');
      if (b) b.focus();
    }
  }
  function trocarQuestao(i) {
    var s = estado.sessao;
    if (i < 0 || i >= s.itens.length) return;
    s.atual = i;
    salvarProva();
    desenhar();
    window.scrollTo(0, 0);
    var traco = app.querySelector('[data-ir="' + i + '"]');
    if (traco) traco.focus({ preventScroll: true });
  }
  function responder(i) {
    var s = estado.sessao, it = s.itens[s.atual];
    if (s.tipo === 'treino') {
      if (it.resp !== null) return;
      it.resp = i;
      registrarErradas([it]);
    } else {
      it.resp = it.resp === i ? null : i;
      salvarProva();
    }
    desenhar();
    var alvo = app.querySelector('[data-alt="' + i + '"]');
    if (alvo && !alvo.disabled) alvo.focus({ preventScroll: true });
  }

  /* Eventos */
  app.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var d = b.dataset;
    if (d.alt !== undefined) return responder(+d.alt);
    if (d.ir !== undefined) return trocarQuestao(+d.ir);
    if (d.letras) {
      gravar(CHAVE.letras, Math.min(2, Math.max(0, ler(CHAVE.letras, 0) + (+d.letras))));
      aplicarAcessibilidade();
      return desenhar();
    }
    if (d.filtro) { estado.filtro = d.filtro; return desenhar(); }
    if (d.aba) { estado.aba = d.aba; estado.busca = ''; return desenhar(); }
    if (d.treino) {
      var lista;
      if (d.treino === 'placas') lista = BANCO.filter(temFigura);
      else if (d.treino === 'erradas') lista = ler(CHAVE.erradas, []).map(function (id) { return porId[id]; }).filter(Boolean);
      else if (d.treino === 'niveis') lista = idsNiveis().map(function (id) { return porId[id]; });
      // Uma questão de cada tema, para o treino não repetir o mesmo assunto.
      else if (d.treino === 'classicas') lista = CLASSICAS.map(function (c) { return porId[embaralhar(c.ids)[0]]; });
      else lista = BANCO.filter(function (q) { return q.m === +d.treino; });
      var titulo = d.treino === 'placas' ? 'Só placas e sinalização' : d.treino === 'erradas' ? 'Questões que você errou' : d.treino === 'niveis' ? 'Níveis de infração e pontos' : d.treino === 'classicas' ? 'Clássicas que mais se repetem' : MODULOS[d.treino];
      return comecarTreino(titulo, lista);
    }
    var s = estado.sessao;
    switch (d.acao) {
      case 'contraste':
        gravar(CHAVE.contraste, !ler(CHAVE.contraste, false));
        aplicarAcessibilidade();
        desenhar();
        break;
      case 'treino':
      case 'provas':
        irPara('inicio');
        document.getElementById(d.acao).scrollIntoView();
        break;
      case 'instalar':
        if (pedidoInstalar) pedidoInstalar.prompt();
        break;
      case 'comecar': comecarProva(); break;
      case 'continuar':
        estado.sessao = ler(CHAVE.prova, null);
        avisados = {};
        if (estado.sessao) irPara('prova');
        break;
      case 'guia': estado.busca = ''; irPara('guia'); break;
      case 'inicio': irPara('inicio'); break;
      case 'anterior': trocarQuestao(s.atual - 1); break;
      case 'proxima': trocarQuestao(s.atual + 1); break;
      case 'marcar':
        s.itens[s.atual].marcada = !s.itens[s.atual].marcada;
        salvarProva();
        desenhar();
        break;
      case 'pedir-entrega': estado.confirmar = true; desenhar(); break;
      case 'voltar-prova': estado.confirmar = false; desenhar(); break;
      case 'entregar': entregar(false); break;
      case 'sair-treino': estado.sessao = null; irPara('inicio'); break;
      case 'limpar':
        if (window.confirm('Apagar seu histórico de provas e a lista de questões erradas?')) {
          apagar(CHAVE.hist); apagar(CHAVE.erradas); apagar(CHAVE.vistas);
          desenhar();
          avisar('Histórico e questões erradas apagados.');
        }
        break;
    }
  });

  app.addEventListener('input', function (e) {
    if (e.target.id === 'busca') {
      estado.busca = e.target.value;
      document.getElementById('conteudo-guia').innerHTML = conteudoGuia();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (estado.tela !== 'prova' || !estado.sessao || e.ctrlKey || e.metaKey || e.altKey) return;
    if (estado.confirmar) {
      if (e.key === 'Escape') { estado.confirmar = false; desenhar(); }
      return;
    }
    var k = e.key.toUpperCase();
    var pos = LETRAS.indexOf(k);
    if (pos >= 0) { e.preventDefault(); responder(pos); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); trocarQuestao(estado.sessao.atual + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); trocarQuestao(estado.sessao.atual - 1); }
  });

  window.addEventListener('beforeunload', salvarProva);

  /* Aplicativo instalável */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    pedidoInstalar = e;
    desenhar();
  });
  window.addEventListener('appinstalled', function () {
    pedidoInstalar = null;
    desenhar();
  });
  // Aberto com dois cliques (file://) não há service worker, e o simulado segue normal.
  if ('serviceWorker' in navigator && /^http/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* segue sem modo offline */ });
  }

  aplicarAcessibilidade();

  // Prova que venceu enquanto a página estava fechada é entregue ao abrir.
  var pendente = ler(CHAVE.prova, null);
  if (pendente && pendente.fim <= Date.now()) {
    estado.sessao = pendente;
    entregar(true);
  } else {
    desenhar();
  }
})();
