// Shared list/create/update/delete routes for tables owned by a student (projects, achievements).
// Ownership is enforced twice: by RLS in PostgreSQL and by .eq('user_id', ...) here.
const express = require('express');
const { asyncHandler } = require('../middleware/errors');
const { ok, fail } = require('../utils/respond');
const { isUuid } = require('../utils/validate');

function crudRouter({ table, noun, validate, orderBy }) {
  const router = express.Router();

  router.get('/', asyncHandler(async (req, res) => {
    let query = req.db.from(table).select('*').eq('user_id', req.user.id);
    for (const [column, ascending] of orderBy) query = query.order(column, { ascending });
    const { data, error } = await query;
    if (error) throw error;
    return ok(res, data);
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const values = validate(req.body);
    const { data, error } = await req.db.from(table)
      .insert({ ...values, user_id: req.user.id }).select().single();
    if (error) throw error;
    return ok(res, data, 201);
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    if (!isUuid(req.params.id)) return fail(res, 400, `Invalid ${noun} id.`);
    const values = validate(req.body);
    const { data, error } = await req.db.from(table)
      .update(values).eq('id', req.params.id).eq('user_id', req.user.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 404, `That ${noun} was not found.`);
    return ok(res, data);
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    if (!isUuid(req.params.id)) return fail(res, 400, `Invalid ${noun} id.`);
    const { data, error } = await req.db.from(table)
      .delete().eq('id', req.params.id).eq('user_id', req.user.id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) return fail(res, 404, `That ${noun} was not found.`);
    return ok(res, { id: req.params.id });
  }));

  return router;
}

module.exports = crudRouter;
