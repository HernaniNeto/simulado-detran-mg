// Perguntas sobre níveis de infração escritas a partir do CTB (Lei 9.503/1997)
// e lista das clássicas. Novas perguntas entram sempre no fim, para os números
// não mudarem nas provas já salvas no navegador.
(function () {
  'use strict';

  var NIVEIS = ['Gravíssima', 'Grave', 'Média', 'Leve'];
  var proximo = 1501;

  function criar(t, c, x, artigo, k) {
    var q = {
      i: proximo++, m: 2, n: 'F', t: t, c: c, x: x, k: k,
      o: 'Pergunta extra deste simulado, escrita a partir do CTB (' + artigo + '). Não faz parte do banco oficial da Senatran.'
    };
    window.BANCO.push(q);
    return q.i;
  }
  function nivel(conduta, certo, artigo, k) {
    return criar(conduta + ' é uma infração de qual natureza?', certo,
      NIVEIS.filter(function (n) { return n !== certo; }), artigo, k);
  }

  var gravissimas = [
    nivel('Avançar o sinal vermelho do semáforo ou a parada obrigatória', 'Gravíssima', 'art. 208', 'Art. 208: gravíssima, 7 pontos e multa.'),
    nivel('Dirigir segurando ou manuseando o telefone celular', 'Gravíssima', 'art. 252, parágrafo único', 'Segurar ou manusear o celular é gravíssima. Usar fone de ouvido conectado ao celular é média.'),
    nivel('Transitar na contramão em via de sentido único', 'Gravíssima', 'art. 186, II', 'Em via de sentido único é gravíssima. Em via de dois sentidos, é grave.'),
    nivel('Deixar de dar preferência ao pedestre que está sobre a faixa', 'Gravíssima', 'art. 214, I', 'Art. 214, I: gravíssima.'),
    nivel('Disputar corrida em via pública', 'Gravíssima', 'art. 173', 'Art. 173: gravíssima, multa dez vezes, suspensão do direito de dirigir e apreensão do veículo.'),
    nivel('Transitar com o veículo sobre a calçada', 'Gravíssima', 'art. 193', 'Art. 193: gravíssima, multa três vezes.'),
    criar('Qual é o fator da multa para quem deixa de prestar socorro à vítima de sinistro, podendo fazê-lo?', 'Gravíssima, multa cinco vezes e suspensão do direito de dirigir.',
      ['Grave, multa sem multiplicador.', 'Gravíssima, multa dez vezes e apreensão do veículo.', 'Média, multa duas vezes.'], 'art. 176', 'Art. 176: gravíssima, multa cinco vezes, suspensão do direito de dirigir e recolhimento do documento.'),
    criar('Ultrapassar pela contramão em curva, sem visibilidade suficiente, é infração:', 'Gravíssima, com multa cinco vezes.',
      ['Grave, com multa duas vezes.', 'Média, sem multiplicador.', 'Gravíssima, com multa dez vezes.'], 'art. 203, I', 'Art. 203: gravíssima, multa cinco vezes.'),
    criar('Dirigir sem possuir CNH ou Permissão para Dirigir gera multa multiplicada por quanto?', 'Três vezes.',
      ['Duas vezes.', 'Cinco vezes.', 'Dez vezes.'], 'art. 162, I', 'Art. 162, I: gravíssima, multa três vezes e retenção do veículo até apresentar condutor habilitado.'),
    criar('Dirigir em velocidade mais de 50% acima da máxima permitida é:', 'Gravíssima, multa três vezes e suspensão do direito de dirigir.',
      ['Grave, sem multiplicador.', 'Média, sem multiplicador.', 'Gravíssima, multa dez vezes e apreensão do veículo.'], 'art. 218, III', 'Art. 218: até 20% acima é média, de 20% a 50% é grave e acima de 50% é gravíssima.')
  ];

  var graves = [
    nivel('Transitar na contramão em via de dois sentidos', 'Grave', 'art. 186, I', 'Em via de dois sentidos é grave. Em via de sentido único, é gravíssima.'),
    nivel('Dirigir em velocidade de 20% a 50% acima da máxima permitida', 'Grave', 'art. 218, II', 'Art. 218: até 20% acima é média, de 20% a 50% é grave e acima de 50% é gravíssima.'),
    nivel('Estacionar sobre a calçada', 'Grave', 'art. 181, VIII', 'Art. 181, VIII: estacionar na calçada é grave, com remoção. Apenas parar na calçada é leve (art. 182, VI).'),
    nivel('Parar o veículo sobre a ciclofaixa', 'Grave', 'art. 182, XI', 'Art. 182, XI: parar na ciclovia ou ciclofaixa é grave.'),
    nivel('Conduzir pessoas ou animais na parte externa do veículo', 'Grave', 'art. 235', 'Art. 235: grave, com retenção do veículo para o transbordo.'),
    nivel('Dirigir sem equipamento obrigatório ou com ele sem funcionar', 'Grave', 'art. 230, IX', 'Art. 230, IX: grave, com retenção do veículo até regularizar.'),
    nivel('Deixar de socorrer vítima de sinistro quando solicitado pela autoridade', 'Grave', 'art. 177', 'Art. 177: grave. Quem se envolveu no sinistro e não presta socorro responde pelo art. 176, gravíssima.')
  ];

  var medias = [
    nivel('Dirigir em velocidade até 20% acima da máxima permitida', 'Média', 'art. 218, I', 'Art. 218: até 20% acima é média, de 20% a 50% é grave e acima de 50% é gravíssima.'),
    nivel('Ultrapassar outro veículo pela direita, fora das exceções previstas', 'Média', 'art. 199', 'Art. 199: média. Pela direita só quando o veículo da frente indicar que vai virar à esquerda.'),
    nivel('Parar sobre a faixa de pedestres na mudança do sinal luminoso', 'Média', 'art. 183', 'Art. 183: média.'),
    nivel('Dirigir usando fone de ouvido conectado ao celular', 'Média', 'art. 252, VI', 'Art. 252, VI: fone de ouvido é média. Segurar ou manusear o celular é gravíssima.'),
    nivel('Dirigir com o braço do lado de fora do veículo', 'Média', 'art. 252, I', 'Art. 252, I: média.'),
    nivel('Transitar abaixo da metade da velocidade máxima da via, atrapalhando o trânsito', 'Média', 'art. 219', 'Art. 219: média.'),
    nivel('Rebocar outro veículo com corda, fora de situação de emergência', 'Média', 'art. 236', 'Art. 236: média.'),
    nivel('Parar o veículo em cima de ponte ou viaduto', 'Média', 'art. 182, VIII', 'Art. 182, VIII: média.')
  ];

  var leves = [
    nivel('Dirigir sem atenção ou sem os cuidados indispensáveis à segurança', 'Leve', 'art. 169', 'Art. 169: leve.'),
    nivel('Usar a buzina de forma prolongada ou em local proibido', 'Leve', 'art. 227', 'Art. 227: leve.'),
    nivel('Conduzir veículo sem os documentos de porte obrigatório', 'Leve', 'art. 232', 'Art. 232: leve, com retenção do veículo até apresentar o documento.'),
    nivel('Parar o veículo sobre a calçada', 'Leve', 'art. 182, VI', 'Art. 182, VI: parar é leve. Estacionar na calçada é grave (art. 181, VIII).'),
    nivel('Parar o veículo afastado da guia de 50 cm a 1 metro', 'Leve', 'art. 182, II', 'Art. 182: de 50 cm a 1 m é leve. Mais de 1 m é média.')
  ];

  var pontos = [
    criar('Quantos pontos uma infração gravíssima soma à CNH?', '7 pontos.', ['5 pontos.', '4 pontos.', '3 pontos.'], 'art. 259', 'Art. 259: gravíssima 7, grave 5, média 4, leve 3.'),
    criar('Quantos pontos uma infração grave soma à CNH?', '5 pontos.', ['7 pontos.', '4 pontos.', '3 pontos.'], 'art. 259', 'Art. 259: gravíssima 7, grave 5, média 4, leve 3.'),
    criar('Quantos pontos uma infração média soma à CNH?', '4 pontos.', ['7 pontos.', '5 pontos.', '3 pontos.'], 'art. 259', 'Art. 259: gravíssima 7, grave 5, média 4, leve 3.'),
    criar('Qual é a ordem correta das infrações, da mais pesada para a mais leve?', 'Gravíssima, grave, média e leve.',
      ['Grave, gravíssima, média e leve.', 'Gravíssima, média, grave e leve.', 'Grave, média, gravíssima e leve.'], 'art. 258', 'Art. 258: as infrações são classificadas em gravíssima, grave, média e leve.'),
    criar('Qual é o valor da multa de uma infração gravíssima, sem multiplicador?', 'R$ 293,47.', ['R$ 195,23.', 'R$ 130,16.', 'R$ 88,38.'], 'art. 258', 'Art. 258: gravíssima R$ 293,47, grave R$ 195,23, média R$ 130,16, leve R$ 88,38.'),
    criar('Qual é o valor da multa de uma infração leve?', 'R$ 88,38.', ['R$ 293,47.', 'R$ 195,23.', 'R$ 130,16.'], 'art. 258', 'Art. 258: gravíssima R$ 293,47, grave R$ 195,23, média R$ 130,16, leve R$ 88,38.'),
    criar('Uma infração gravíssima com multa multiplicada por dez soma quantos pontos à CNH?', '7 pontos, pois o fator multiplica só o valor da multa.',
      ['70 pontos, pois o fator também multiplica os pontos.', '10 pontos, um para cada multiplicador.', '20 pontos, o limite de suspensão.'], 'arts. 258 e 259', 'O fator multiplica a multa. Os pontos da gravíssima continuam sendo 7.'),
    criar('Em 12 meses, qual é o limite de pontos para quem tem duas ou mais infrações gravíssimas?', '20 pontos.', ['30 pontos.', '40 pontos.', '10 pontos.'], 'art. 261, I', 'Art. 261, I: 20 pontos com duas ou mais gravíssimas, 30 com uma e 40 com nenhuma.'),
    criar('Em 12 meses, qual é o limite de pontos para quem tem uma infração gravíssima?', '30 pontos.', ['20 pontos.', '40 pontos.', '10 pontos.'], 'art. 261, I', 'Art. 261, I: 20 pontos com duas ou mais gravíssimas, 30 com uma e 40 com nenhuma.')
  ];

  // Temas recorrentes em listas de estudo. A Senatran não publica a frequência
  // de cada questão, então esta curadoria não é uma estatística oficial.
  window.CLASSICAS = [
    { tema: 'Infrações gravíssimas', nivel: true, ids: gravissimas.concat([373, 393, 395, 396, 1384, 1385, 1386, 1391, 1405, 1407, 1408, 1414]) },
    { tema: 'Infrações graves', nivel: true, ids: graves.concat([1387, 1393, 1396, 1406, 1409]) },
    { tema: 'Infrações médias', nivel: true, ids: medias.concat([400, 1388, 1392, 1415]) },
    { tema: 'Infrações leves', nivel: true, ids: leves },
    { tema: 'Pontos, multas e limites', nivel: true, ids: pontos.concat([1397, 1410, 1413]) },

    { tema: 'Álcool', ids: [432, 434, 431, 455] },
    { tema: 'Regras da PPD', ids: [263, 402, 377, 1390, 1123, 996] },
    { tema: 'Validade da PPD', ids: [629, 994, 1031] },
    { tema: 'Medida administrativa', ids: [447, 1411, 391] },
    { tema: 'Celular', ids: [403, 412, 1106, 1454] },

    { tema: 'Placa de parada obrigatória', ids: [51, 61, 55] },
    { tema: 'Placa de dê a preferência', ids: [59, 64] },
    { tema: 'Placa de velocidade máxima', ids: [63, 155] },
    { tema: 'Placa de proibido ultrapassar', ids: [57, 69, 173] },
    { tema: 'Placas de proibido parar e estacionar', ids: [80, 177, 79, 178] },
    { tema: 'Placa de sentido proibido', ids: [52] },
    { tema: 'Placas de proibido virar', ids: [54, 65] },
    { tema: 'Placa de proibido retornar', ids: [78, 133] },
    { tema: 'Cruzamento sem sinalização', ids: [7, 8, 548, 563] },
    { tema: 'Rotatória', ids: [594, 570, 20, 73] },
    { tema: 'Agente de trânsito e semáforo', ids: [5, 231, 1377, 1379] },
    { tema: 'Faixa de pedestres', ids: [232, 1342, 1457, 642] },
    { tema: 'Linha de retenção', ids: [1359, 290] },

    { tema: 'Ultrapassagem', ids: [848, 558, 551, 704] },
    { tema: 'Distância do ciclista', ids: [258, 855, 895, 544] },
    { tema: 'Cinto de segurança', ids: [758, 801, 1463] },
    { tema: 'Transporte de crianças', ids: [1073, 1076, 1078] },
    { tema: 'Chuva e aquaplanagem', ids: [556, 811, 668, 918] },
    { tema: 'Distâncias de reação, frenagem e segurança', ids: [1061, 762, 806] },
    { tema: 'Velocidade por tipo de via', ids: [1000, 1032, 1035, 1458, 997] },
    { tema: 'Categorias da CNH', ids: [995, 1057, 1002, 1030, 1464, 1055] },
    { tema: 'Renovação da CNH', ids: [562, 1130, 1131] },
    { tema: 'Pontos cegos', ids: [767, 825, 777] },

    { tema: 'Remoção da vítima', ids: [1242, 1469] },
    { tema: 'Telefones de emergência', ids: [1226, 1468] },
    { tema: 'Segurança no local do sinistro', ids: [1240, 1498, 1328] },
    { tema: 'Pneus', ids: [1251, 1482, 1163, 1480] },
    { tema: 'Óleo do motor', ids: [1266, 1267] },
    { tema: 'Arrefecimento e freios', ids: [1149, 1151] },
    { tema: 'Poluição', ids: [1171, 1173, 1310, 1489] },
    { tema: 'Sono ao volante', ids: [1221, 1475] }
  ];

  // Enunciados do banco oficial que contrariam o art. 169 do CTB.
  var NOTA_169 = 'Atenção: este enunciado é do banco oficial, mas pelo art. 169 do CTB dirigir sem atenção é infração leve, não média.';
  window.BANCO.forEach(function (q) {
    if (q.i === 1022 || q.i === 1058) q.o = NOTA_169;
  });
})();
