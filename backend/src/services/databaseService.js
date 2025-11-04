import { getDriver } from '../config/database.js';

export async function findEmployeesByName(q, { limit = 25, offset = 0 } = {}) {
  const session = getDriver().session();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);
  try {
    const res = await session.run(
      `CALL db.index.fulltext.queryNodes('employee_search', $q) YIELD node, score
       RETURN node AS e, score
       ORDER BY score DESC
       SKIP $skip LIMIT $limit`,
      { q, skip: safeOffset, limit: safeLimit }
    );
    return res.records.map((r) => r.get('e').properties);
  } finally {
    await session.close();
  }
}

export async function getEmployeeByEmail(email) {
  const session = getDriver().session();
  try {
    const res = await session.run('MATCH (e:Employee {email: $email}) RETURN e LIMIT 1', { email });
    if (res.records.length === 0) return null;
    return res.records[0].get('e').properties;
  } finally {
    await session.close();
  }
}

export async function getOrgChart(email) {
  const session = getDriver().session();
  try {
    const res = await session.run(
      'MATCH path = (manager:Employee)-[:MANAGES*0..5]->(e:Employee {email: $email}) RETURN nodes(path) as nodes',
      { email }
    );
    // Simplified conversion
    let nodes = [];
    res.records.forEach((r) => {
      r.get('nodes').forEach((n) => nodes.push(n.properties));
    });
    return { nodes };
  } finally {
    await session.close();
  }
}

// removed unused batchCreateEmployees in favor of importEmployees

export async function importEmployees(rows) {
  const driver = getDriver();
  const chunkSize = 1000;
  let imported = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize).map((r) => ({
      first_name: r.first_name || null,
      last_name: r.last_name || null,
      email: r.email,
      phone: r.phone || null,
      home_address: r.home_address || null,
      department: r.department || null,
      role: r.role || null,
      salary: r.salary != null && r.salary !== '' ? Number(r.salary) : null,
      manager_name: r.manager_name || null,
      manager_email: r.manager_email || null
    }));

    const session = driver.session();
    try {
      await session.writeTransaction(async (tx) => {
        await tx.run(
          `UNWIND $rows AS row
           MERGE (e:Employee {email: row.email})
           SET e.first_name = row.first_name,
               e.last_name = row.last_name,
               e.phone = row.phone,
               e.home_address = row.home_address,
               e.department = row.department,
               e.role = row.role,
               e.salary = row.salary
           WITH row, e
           WHERE row.manager_email IS NOT NULL AND row.manager_email <> ''
           MERGE (m:Employee {email: row.manager_email})
           SET m.first_name = coalesce(m.first_name, row.manager_name)
           MERGE (m)-[:MANAGES]->(e)`,
          { rows: chunk }
        );
      });
      imported += chunk.length;
    } finally {
      await session.close();
    }
  }

  return imported;
}

export async function getCEO() {
  const session = getDriver().session();
  try {
    const res = await session.run('MATCH (e:Employee) WHERE NOT ( ()-[:MANAGES]->(e) ) RETURN e LIMIT 1');
    if (res.records.length === 0) return null;
    return res.records[0].get('e').properties;
  } finally {
    await session.close();
  }
}

export async function healthCheck() {
  try {
    const driver = getDriver();
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    return true;
  } catch (_) {
    return false;
  }
}
