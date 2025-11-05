import { getDriver } from '../config/database.js';
import neo4j from 'neo4j-driver';
import cacheService from './cacheService.js';

export async function findEmployeesByName(q, { limit = 25, offset = 0 } = {}) {
  const cacheKey = `search:${q}:${limit}:${offset}`;
  
  // Try cache first
  let cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  const session = getDriver().session();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);
  try {
    const res = await session.run(
      `CALL db.index.fulltext.queryNodes('employee_search', $q) YIELD node, score
       RETURN node AS e, score
       ORDER BY score DESC
       SKIP $skip LIMIT $limit`,
      { q, skip: neo4j.int(safeOffset), limit: neo4j.int(safeLimit) }
    );
    const result = res.records.map((r) => r.get('e').properties);
    
    // Cache the result for 2 minutes (searches may change frequently)
    await cacheService.set(cacheKey, result, 120);
    
    return result;
  } finally {
    await session.close();
  }
}

export async function getEmployeeByEmail(email) {
  const cacheKey = `employee:${email}`;
  
  // Try cache first
  let cachedEmployee = await cacheService.get(cacheKey);
  if (cachedEmployee) {
    return cachedEmployee;
  }
  
  const session = getDriver().session();
  try {
    const res = await session.run('MATCH (e:Employee {email: $email}) RETURN e LIMIT 1', { email });
    if (res.records.length === 0) return null;
    const employee = res.records[0].get('e').properties;
    
    // Cache the result for 5 minutes
    await cacheService.set(cacheKey, employee, 300);
    
    return employee;
  } finally {
    await session.close();
  }
}

export async function getOrgChart(email, depth = 2) {
  const cacheKey = `orgchart:${email}:${depth}`;
  
  // Try cache first
  let cachedChart = await cacheService.get(cacheKey);
  if (cachedChart) {
    return cachedChart;
  }
  
  const session = getDriver().session();
  const safeDepth = Math.max(1, Math.min(Number(depth) || 2, 3));
  const cypher = `
    MATCH (focus:Employee {email: $email})
    OPTIONAL MATCH pUp = (m:Employee)-[:MANAGES*1..${safeDepth}]->(focus)
    OPTIONAL MATCH pDown = (focus)-[:MANAGES*1..${safeDepth}]->(r:Employee)
    WITH focus,
         collect(nodes(pUp)) AS upNodes, collect(relationships(pUp)) AS upRels,
         collect(nodes(pDown)) AS downNodes, collect(relationships(pDown)) AS downRels
    WITH focus,
         upNodes + downNodes AS nodeLists,
         upRels + downRels AS relLists
    UNWIND nodeLists AS nl
    UNWIND nl AS n
    WITH collect(DISTINCT n) + [focus] AS nodes, relLists
    UNWIND relLists AS rl
    UNWIND rl AS r
    WITH nodes, collect(DISTINCT r) AS rels
    RETURN [n IN nodes | n { .email, .first_name, .last_name, .department, .role }] AS nodes,
           [r IN rels | { source: startNode(r).email, target: endNode(r).email }] AS edges
  `;
  try {
    const res = await session.run(cypher, { email });
    if (res.records.length === 0) return { nodes: [], edges: [] };
    const record = res.records[0];
    const chart = { nodes: record.get('nodes'), edges: record.get('edges') };
    
    // Cache the result for 2 minutes (org charts may change more frequently)
    await cacheService.set(cacheKey, chart, 120);
    
    return chart;
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
  
  // Invalidate cache after import
  await cacheService.flush();

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