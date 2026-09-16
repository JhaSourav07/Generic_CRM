import { leadScoringService } from '../modules/leads/lead-scoring.service.js';
import { prisma } from '../config/prisma.js';

async function main() {
  console.log('--- Starting Vynexa CRM Automatic Lead Scoring Backfill ---');
  const startTime = Date.now();

  try {
    const result = await leadScoringService.backfillAllLeads(undefined, 50);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Backfill Complete] Processed: ${result.processed}, Errors: ${result.errors}, Duration: ${duration}s`);
  } catch (err) {
    console.error('[Backfill Failed]:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
