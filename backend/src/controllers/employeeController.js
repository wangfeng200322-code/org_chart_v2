import { findEmployeesByName, getEmployeeByEmail, getOrgChart } from '../services/databaseService.js';

export async function search(req, res, next) {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit, 10) || 25;
    const offset = parseInt(req.query.offset, 10) || 0;
    const results = await findEmployeesByName(q, { limit, offset });
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function details(req, res, next) {
  try {
    const email = req.params.email;
    const employee = await getEmployeeByEmail(email);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

export async function orgChart(req, res, next) {
  try {
    const email = req.query.email;
    const depth = parseInt(req.query.depth, 10) || 2;
    const chart = await getOrgChart(email, depth);
    res.json({ success: true, data: chart });
  } catch (err) {
    next(err);
  }
}
