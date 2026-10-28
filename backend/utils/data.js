// Loads everything a student owns in one go. All queries run through req.db, so RLS applies.
async function loadAll(db, uid) {
  const [pr, pj, ac, rs, ck] = await Promise.all([
    db.from('profiles').select('*').eq('id', uid).maybeSingle(),
    db.from('projects').select('*').eq('user_id', uid)
      .order('is_featured', { ascending: false })
      .order('completed_on', { ascending: false, nullsFirst: false }),
    db.from('achievements').select('*').eq('user_id', uid).order('earned_on', { ascending: false }),
    db.from('resume_details').select('*').eq('user_id', uid).maybeSingle(),
    db.from('checklist_items').select('task_key,is_done').eq('user_id', uid),
  ]);
  for (const r of [pr, pj, ac, rs, ck]) if (r.error) throw r.error;

  let profile = pr.data;
  if (!profile) {
    // Safety net in case the signup trigger did not create the profile row.
    const created = await db.from('profiles').insert({ id: uid }).select().single();
    if (created.error) throw created.error;
    profile = created.data;
  }
  return {
    profile,
    projects: pj.data || [],
    achievements: ac.data || [],
    resume: rs.data || {},
    checklistRows: ck.data || [],
  };
}

module.exports = { loadAll };
