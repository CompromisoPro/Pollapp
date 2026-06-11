-- =====================================================================
--  POLLAPP — Agregar RUT a los perfiles (para "¿Olvidaste tu correo?").
--  Correr en SQL Editor > Run. Seguro de correr varias veces.
-- =====================================================================
alter table profiles add column if not exists rut text;
