// ============================================================================
// SMART THEME PARK OPERATIONS - VECTOR EMBEDDING & SEMANTIC SEARCH ENGINE
// Vector Paradigm: Dense 384-dimensional Normalized Embeddings & Cosine Search
// ============================================================================

import { query } from './postgres';

// Vector dimension: 384 (matches standard all-MiniLM-L6-v2)
export const VECTOR_DIMENSION = 384;

// Semantic theme anchor tokens with directional weights
const THEME_ANCHORS: Record<string, string[]> = {
  extreme_thrill: ['coaster', 'thrill', 'hyper', 'inversion', 'adrenaline', 'speed', 'drop', 'launch', 'gforce', 'apex', 'extreme', 'fast', 'height'],
  scifi_digital: ['cyber', 'quantum', 'future', 'laser', '4d', 'hologram', 'digital', 'neon', 'dark ride', 'space', 'motion', 'virtual'],
  water_splash: ['water', 'splash', 'plunge', 'river', 'rapids', 'flume', 'soaked', 'lagoon', 'boat', 'glacier', 'subzero', 'drenched'],
  family_gentle: ['family', 'gentle', 'kids', 'carousel', 'scenic', 'gondola', 'view', 'relaxing', 'calm', 'children', 'slow', 'peaceful'],
  jurassic_adventure: ['dinosaur', 'jurassic', 'raptor', 'safari', 'jungle', 'canyon', 'prehistoric', 'wild', 'expedition'],
  magic_fantasy: ['magic', 'enchanted', 'fairy', 'manor', 'ghost', 'mystery', 'spooky', 'illusion', 'woods', 'castle', 'gothic', 'mythic'],
};

/**
 * Generate a deterministic normalized 384-dimensional embedding from text.
 * Uses semantic anchor weighting + trigonometric dispersion so that conceptually similar
 * text phrases produce high cosine similarity.
 */
export function generateEmbedding(text: string): number[] {
  const lower = text.toLowerCase();
  const vector = new Array(VECTOR_DIMENSION).fill(0);

  // 1. Calculate anchor category activations
  const categoryScores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(THEME_ANCHORS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += 2.5;
      }
    }
    categoryScores[category] = score;
  }

  // 2. Hash individual words into dimensional coordinates
  const tokens = lower.split(/[\s,.-]+/).filter(Boolean);
  tokens.forEach((token, tokenIdx) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash |= 0;
    }

    for (let d = 0; d < VECTOR_DIMENSION; d++) {
      const freq = Math.sin(hash + d * 1.6180339887);
      vector[d] += freq / (tokenIdx + 1);
    }
  });

  // 3. Modulate vector by category activations
  let catIndex = 0;
  for (const [_, score] of Object.entries(categoryScores)) {
    if (score > 0) {
      const sliceSize = Math.floor(VECTOR_DIMENSION / Object.keys(THEME_ANCHORS).length);
      const start = catIndex * sliceSize;
      const end = start + sliceSize;
      for (let i = start; i < end; i++) {
        vector[i] += score * 1.2;
      }
    }
    catIndex++;
  }

  // 4. L2 Normalize to unit vector
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(v => Number((v / norm).toFixed(5)));
}

/**
 * Calculate Cosine Similarity between two normalized vectors: dot product
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Number(Math.max(0, Math.min(1, dotProduct)).toFixed(4));
}

/**
 * Format vector array for PostgreSQL pgvector syntax: '[0.012, -0.045, ...]'
 */
export function formatForPgVector(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

export interface SemanticSearchResult {
  attraction_id: number;
  name: string;
  thrill_level: string;
  current_wait_time: number;
  rating: number;
  description: string;
  zone_name: string;
  similarity_score: number;
  match_reasons: string[];
}

/**
 * Search attractions using vector similarity
 */
export async function searchPersonalizedAttractions(
  visitorQuery: string,
  preferredThrill?: string,
  limit: number = 4
): Promise<SemanticSearchResult[]> {
  const queryVector = generateEmbedding(visitorQuery);
  const pgVectorStr = formatForPgVector(queryVector);

  try {
    // Attempt pgvector query in PostgreSQL
    const sql = `
      SELECT 
        a.attraction_id,
        a.name,
        a.thrill_level,
        a.current_wait_time,
        a.rating,
        a.description,
        pz.zone_name,
        ROUND((1 - (a.embedding <=> $1))::NUMERIC, 4) AS similarity_score
      FROM attractions a
      JOIN park_zones pz ON a.zone_id = pz.zone_id
      WHERE a.status = 'OPERATIONAL'
        ${preferredThrill && preferredThrill !== 'ALL' ? `AND a.thrill_level = '${preferredThrill}'` : ''}
      ORDER BY a.embedding <=> $1 ASC
      LIMIT $2;
    `;
    const res = await query(sql, [pgVectorStr, limit]);
    if (!res.isMock && res.rows.length > 0) {
      return res.rows.map((row: any) => ({
        ...row,
        similarity_score: Number(row.similarity_score),
        match_reasons: generateMatchReasons(visitorQuery, row.description, row.thrill_level)
      }));
    }
  } catch (err) {
    console.warn('pgvector query failed or extension missing; applying TypeScript Vector Cosine fallback:', (err as any).message);
  }

  // Fallback in-memory vector matching
  const attractionsData = [
    { id: 1, name: 'Apex Predator: Hyper Coaster', zone: 'Cyberpunk Metropolis', thrill: 'EXTREME', wait: 45, rating: 4.9, desc: 'A colossal 75-meter electromagnetic launch rollercoaster with 4 inversions, reaching speeds over 120 km/h. Pure adrenaline rush for daring thrill seekers.', kw: 'extreme rollercoaster thrill high speed adrenaline loops' },
    { id: 2, name: 'Quantum Leap 4D Dark Ride', zone: 'Cyberpunk Metropolis', thrill: 'HIGH', wait: 35, rating: 4.7, desc: 'Interactive dark coaster journey through cyberspace and neon-lit digital dimensions with synchronized motion seats and laser blasting.', kw: 'scifi futuristic 4d indoor dark ride cyberspace laser' },
    { id: 3, name: 'Raptor Encounter River Safari', zone: 'Jurassic Lagoon', thrill: 'MODERATE', wait: 25, rating: 4.6, desc: 'Expedition raft journey navigating through dense prehistoric river canyons flanked by animatronic velociraptors and towering brachiosaurs.', kw: 'jurassic dinosaurs water raft safari family friendly jungle' },
    { id: 4, name: 'Sub-Zero Glacier Plunge', zone: 'Jurassic Lagoon', thrill: 'HIGH', wait: 50, rating: 4.8, desc: 'Heart-stopping 45-meter dual-flume water drop coaster splashing into glacial subterranean caverns. Prepare to get soaked!', kw: 'water coaster huge splash plunge drop soaked thrilling' },
    { id: 5, name: 'Starlight Celestial Carousel', zone: 'Main Adventure Boulevard', thrill: 'LOW', wait: 10, rating: 4.3, desc: 'An ornate double-decker hand-carved celestial carousel illuminated by 5,000 warm LED stars. Perfect gentle family wonder.', kw: 'gentle kids family carousel relax music stars magical' },
    { id: 6, name: 'Skyline Panorama Gondola', zone: 'Main Adventure Boulevard', thrill: 'LOW', wait: 15, rating: 4.5, desc: 'Continuous cable gondola system offering breathtaking 360-degree aerial views of the entire theme park landscape and lake.', kw: 'aerial view gondola cable scenic relaxing transport photo vista' },
    { id: 7, name: 'Mystic Manor Illusion Escape', zone: 'Enchanted Mythic Woods', thrill: 'HIGH', wait: 40, rating: 4.8, desc: 'Haunted gothic castle experience packed with holographic illusions, shifting staircases, and supernatural ghostly mysteries.', kw: 'spooky haunted illusion magic dark mystery ghost castle' },
    { id: 8, name: 'Enchanted Whispering River', zone: 'Enchanted Mythic Woods', thrill: 'LOW', wait: 20, rating: 4.4, desc: 'Tranquil botanical boat cruise floating through glowing bioluminescent flora, talking willow trees, and gentle sparkling waterfalls.', kw: 'fairy tale gentle boat nature magical water relaxing bioluminescent' }
  ];

  let filtered = attractionsData;
  if (preferredThrill && preferredThrill !== 'ALL') {
    filtered = filtered.filter(a => a.thrill === preferredThrill);
  }

  const scored = filtered.map(item => {
    const itemVector = generateEmbedding(item.kw + ' ' + item.desc);
    const score = cosineSimilarity(queryVector, itemVector);
    return {
      attraction_id: item.id,
      name: item.name,
      thrill_level: item.thrill,
      current_wait_time: item.wait,
      rating: item.rating,
      description: item.desc,
      zone_name: item.zone,
      similarity_score: score,
      match_reasons: generateMatchReasons(visitorQuery, item.desc, item.thrill)
    };
  });

  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  return scored.slice(0, limit);
}

function generateMatchReasons(query: string, desc: string, thrill: string): string[] {
  const reasons: string[] = [];
  const q = query.toLowerCase();
  if (q.includes('fast') || q.includes('adrenaline') || q.includes('intense') || q.includes('thrill')) {
    if (thrill === 'EXTREME' || thrill === 'HIGH') reasons.push('High thrill rating matches your high intensity craving');
  }
  if (q.includes('water') || q.includes('splash') || q.includes('boat')) {
    if (desc.toLowerCase().includes('water') || desc.toLowerCase().includes('river') || desc.toLowerCase().includes('plunge')) {
      reasons.push('Features prominent aquatic / splash track elements');
    }
  }
  if (q.includes('relax') || q.includes('calm') || q.includes('family') || q.includes('gentle')) {
    if (thrill === 'LOW' || thrill === 'MODERATE') reasons.push('Gentle comfort rating ideal for leisurely experience');
  }
  if (q.includes('future') || q.includes('cyber') || q.includes('laser') || q.includes('4d')) {
    if (desc.toLowerCase().includes('cyberspace') || desc.toLowerCase().includes('4d')) reasons.push('Futuristic immersive visual audio technology');
  }
  if (reasons.length === 0) {
    reasons.push(`Top semantic vector alignment based on thematic features`);
  }
  return reasons;
}
