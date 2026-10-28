// Every API response uses the same shape:
//   success: { ok: true,  data: ... }
//   failure: { ok: false, error: { message, fields? } }
function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}
function fail(res, status, message, fields) {
  const error = { message };
  if (fields) error.fields = fields;
  return res.status(status).json({ ok: false, error });
}
module.exports = { ok, fail };
