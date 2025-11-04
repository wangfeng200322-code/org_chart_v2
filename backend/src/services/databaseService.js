import { getDriver } from '../config/database.js';

export async function findEmployeesByName(q) {
  const session = getDriver().session();
  try {
    const res = await session.run(
      'MATCH (e:Employee) WHERE toLower(e.first_name) CONTAINS toLower($q) OR toLower(e.last_name) CONTAINS toLower($q) RETURN e LIMIT 25',
      { q }
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

export async function batchCreateEmployees(rows) {
  const session = getDriver().session();
  try {
    const txc = session.beginTransaction();
    for (const row of rows) {
      await txc.run(
        `MERGE (e:Employee {email: $email})
         SET e.first_name = $first_name, e.last_name = $last_name, e.phone = $phone, e.department = $department, e.role = $role, e.salary = $salary`,
        row
      );
    }
    await txc.commit();
  } finally {
    await session.close();
  }
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
