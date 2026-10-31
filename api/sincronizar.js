// Guarda provas e treinos de cada código de sincronização, para os aparelhos trocarem registros.
const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TAMANHO_CODIGO = 16;
const MAX_CODIGOS = 1000;
const MAX_POR_CODIGO = 5000;
const MAX_POR_ENVIO = 2000;
const UM_DIA = 24 * 60 * 60 * 1000;

function hash(codigo) {
  return crypto.createHash('sha256').update(codigo).digest('hex');
}
function gerarCodigo() {
  let codigo = '';
  for (let i = 0; i < TAMANHO_CODIGO; i++) codigo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return codigo;
}
function normalizar(codigo) {
  const limpo = String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return limpo.length === TAMANHO_CODIGO ? limpo : null;
}
function inteiro(v, min, max) {
  return Number.isSafeInteger(v) && v >= min && v <= max;
}
function registroValido(r) {
  if (!r || (r.tipo !== 'prova' && r.tipo !== 'treino')) return false;
  if (!inteiro(r.quando, Date.UTC(2020, 0, 1), Date.now() + UM_DIA)) return false;
  if (!inteiro(r.total, 1, 100) || !inteiro(r.acertos, 0, r.total) || !inteiro(r.gasto, 0, UM_DIA)) return false;
  return r.tipo === 'prova' ? r.titulo == null : typeof r.titulo === 'string' && r.titulo.length <= 120;
}

async function criar(sql) {
  const [{ total }] = await sql`select count(*)::int as total from sincronizacoes`;
  if (total >= MAX_CODIGOS) return [503, { erro: 'limite' }];
  const codigo = gerarCodigo();
  await sql`insert into sincronizacoes (codigo_hash) values (${hash(codigo)})`;
  return [200, { codigo }];
}

async function sincronizar(sql, codigoHash, enviados) {
  const contas = await sql`select apagado_ate from sincronizacoes where codigo_hash = ${codigoHash}`;
  if (!contas.length) return [404, { erro: 'codigo' }];
  const apagadoAte = Number(contas[0].apagado_ate);

  const validos = (Array.isArray(enviados) ? enviados.slice(0, MAX_POR_ENVIO) : []).filter(registroValido);
  const [{ total }] = await sql`select count(*)::int as total from registros where codigo_hash = ${codigoHash}`;
  if (validos.length && total < MAX_POR_CODIGO) {
    await sql`
      insert into registros (codigo_hash, tipo, quando, titulo, total, acertos, gasto)
      select ${codigoHash}, r.tipo, r.quando, r.titulo, r.total, r.acertos, r.gasto
      from jsonb_to_recordset(${JSON.stringify(validos)}::jsonb)
        as r (tipo text, quando bigint, titulo text, total smallint, acertos smallint, gasto bigint)
      where r.quando > ${apagadoAte}
      on conflict (codigo_hash, tipo, quando) do update set
        acertos = case when excluded.total >= registros.total then excluded.acertos else registros.acertos end,
        total = greatest(excluded.total, registros.total),
        gasto = greatest(excluded.gasto, registros.gasto)`;
  }

  const linhas = await sql`
    select tipo, quando, titulo, total, acertos, gasto from registros
    where codigo_hash = ${codigoHash} order by quando desc`;
  return [200, {
    apagadoAte,
    registros: linhas.map((l) => ({ ...l, quando: Number(l.quando), gasto: Number(l.gasto) }))
  }];
}

async function apagar(sql, codigoHash) {
  const agora = Date.now();
  const contas = await sql`
    update sincronizacoes set apagado_ate = ${agora} where codigo_hash = ${codigoHash} returning codigo_hash`;
  if (!contas.length) return [404, { erro: 'codigo' }];
  await sql`delete from registros where codigo_hash = ${codigoHash} and quando <= ${agora}`;
  return [200, { apagadoAte: agora }];
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'metodo' });
  }
  const corpo = req.body && typeof req.body === 'object' ? req.body : {};
  try {
    const sql = neon(process.env.DATABASE_URL);
    let resposta;
    if (corpo.acao === 'criar') {
      resposta = await criar(sql);
    } else {
      const codigo = normalizar(corpo.codigo);
      if (!codigo) resposta = [404, { erro: 'codigo' }];
      else if (corpo.acao === 'sincronizar') resposta = await sincronizar(sql, hash(codigo), corpo.registros);
      else if (corpo.acao === 'apagar') resposta = await apagar(sql, hash(codigo));
      else resposta = [400, { erro: 'acao' }];
    }
    return res.status(resposta[0]).json(resposta[1]);
  } catch (e) {
    console.error('sincronizar', e.message);
    return res.status(500).json({ erro: 'servidor' });
  }
};
