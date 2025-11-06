import { getDriver } from '../config/database.js';
import neo4j from 'neo4j-driver';
import cacheService from './cacheService.js';
import logger from '../utils/logger.js';

export async function findEmployeesByName(q, { limit = 25, offset = 0 } = {}) {
  const cacheKey = `search:${q}:${limit}:${offset}`;
  
  // Try cache first
  let cachedResult = await cacheService.get(cacheKey);
  if (cachedResult) {
    logger.debug('findEmployeesByName: cache hit', { cacheKey });
    return cachedResult;
  }
  
  logger.info('findEmployeesByName: querying database', { query: q, limit, offset });
  
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
    
    logger.debug('findEmployeesByName: query successful', { resultCount: result.length });
    
    // Cache the result for 2 minutes (searches may change frequently)
    await cacheService.set(cacheKey, result, 120);
    
    return result;
  } catch (error) {
    logger.error('findEmployeesByName: database query failed', { error: error.message, query: q });
    throw error;
  } finally {
    await session.close();
  }
}

export async function getEmployeeByEmail(email) {
  const cacheKey = `employee:${email}`;
  
  // Try cache first
  let cachedEmployee = await cacheService.get(cacheKey);
  if (cachedEmployee) {
    logger.debug('getEmployeeByEmail: cache hit', { cacheKey });
    return cachedEmployee;
  }
  
  logger.info('getEmployeeByEmail: querying database', { email });
  
  const session = getDriver().session();
  try {
    const res = await session.run('MATCH (e:Employee {email: $email}) RETURN e LIMIT 1', { email });
    if (res.records.length === 0) {
      logger.info('getEmployeeByEmail: employee not found', { email });
      return null;
    }
    const employee = res.records[0].get('e').properties;
    
    logger.debug('getEmployeeByEmail: query successful', { email });
    
    // Cache the result for 5 minutes
    await cacheService.set(cacheKey, employee, 300);
    
    return employee;
  } catch (error) {
    logger.error('getEmployeeByEmail: database query failed', { error: error.message, email });
    throw error;
  } finally {
    await session.close();
  }
}

export async function getOrgChart(email, depth = 2) {
  const cacheKey = `orgchart:${email}:${depth}`;
  
  // Try cache first
  let cachedChart = await cacheService.get(cacheKey);
  if (cachedChart) {
    logger.debug('getOrgChart: cache hit', { cacheKey });
    return cachedChart;
  }
  
  logger.info('getOrgChart: querying database', { email, depth });
  
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
    if (res.records.length === 0) {
      logger.info('getOrgChart: no records found', { email });
      return { nodes: [], edges: [] };
    }
    const record = res.records[0];
    const chart = { nodes: record.get('nodes'), edges: record.get('edges') };
    
    logger.debug('getOrgChart: query successful', { 
      email, 
      nodeCount: chart.nodes.length, 
      edgeCount: chart.edges.length 
    });
    
    // Cache the result for 2 minutes (org charts may change more frequently)
    await cacheService.set(cacheKey, chart, 120);
    
    return chart;
  } catch (error) {
    logger.error('getOrgChart: database query failed', { error: error.message, email });
    throw error;
  } finally {
    await session.close();
  }
}

// removed unused batchCreateEmployees in favor of importEmployees

export async function importEmployees(rows) {
  logger.info('importEmployees: starting import', { rowCount: rows.length });
  
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

    logger.debug('importEmployees: processing chunk', { 
      chunkIndex: i, 
      chunkSize: chunk.length 
    });

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
      
      logger.debug('importEmployees: chunk processed successfully', { 
        chunkIndex: i, 
        importedCount: chunk.length 
      });
    } catch (error) {
      logger.error('importEmployees: chunk processing failed', { 
        error: error.message, 
        chunkIndex: i 
      });
      throw error;
    } finally {
      await session.close();
    }
  }
  
  logger.info('importEmployees: invalidating cache after import');
  
  // Invalidate cache after import
  await cacheService.flush();

  logger.info('importEmployees: import completed successfully', { importedCount: imported });
  
  return imported;
}

export async function getCEO() {
  logger.debug('getCEO: querying database');
  
  const session = getDriver().session();
  try {
    const res = await session.run('MATCH (e:Employee) WHERE NOT ( ()-[:MANAGES]->(e) ) RETURN e LIMIT 1');
    if (res.records.length === 0) {
      logger.info('getCEO: CEO not found');
      return null;
    }
    
    const ceo = res.records[0].get('e').properties;
    logger.debug('getCEO: query successful');
    
    return ceo;
  } catch (error) {
    logger.error('getCEO: database query failed', { error: error.message });
    throw error;
  } finally {
    await session.close();
  }
}

export async function healthCheck() {
  logger.debug('healthCheck: checking database connectivity');
  
  try {
    const driver = getDriver();
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    
    logger.debug('healthCheck: database connectivity OK');
    return true;
  } catch (error) {
    logger.error('healthCheck: database connectivity failed', { error: error.message });
    return false;
  }
}