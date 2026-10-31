-- Banco da sincronização (Neon). Só a rota api/sincronizar.js acessa estas tabelas.
-- O código de sincronização nunca é guardado: fica só o hash SHA-256 dele.

create table if not exists sincronizacoes (
  codigo_hash text primary key,
  criado_em timestamptz not null default now(),
  -- Registros até este instante (ms) foram apagados pelo usuário e não voltam.
  apagado_ate bigint not null default 0
);

create table if not exists registros (
  codigo_hash text not null references sincronizacoes (codigo_hash) on delete cascade,
  tipo text not null check (tipo in ('prova', 'treino')),
  quando bigint not null,
  titulo text,
  total smallint not null check (total between 1 and 100),
  acertos smallint not null check (acertos >= 0 and acertos <= total),
  gasto bigint not null check (gasto >= 0),
  primary key (codigo_hash, tipo, quando)
);
