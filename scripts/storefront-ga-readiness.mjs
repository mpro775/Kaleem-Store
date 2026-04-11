import { access } from 'node:fs/promises';

const requiredDocs = [
  'docs/storefront-phase0-foundation-governance.md',
  'docs/storefront-phase2-token-system.md',
  'docs/storefront-phase3-section-block-engine.md',
  'docs/storefront-phase4-visual-builder.md',
  'docs/storefront-phase5-conversion-ux.md',
  'docs/storefront-phase6-seo-performance-accessibility.md',
  'docs/storefront-phase7-analytics-experimentation.md',
];

const requiredEnvKeys = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_STOREFRONT_STORE_SLUG',
];

async function run() {
  const missingDocs = [];
  for (const docPath of requiredDocs) {
    try {
      await access(docPath);
    } catch {
      missingDocs.push(docPath);
    }
  }

  const missingEnv = requiredEnvKeys.filter((key) => !process.env[key]);

  console.log('Storefront GA readiness check');
  console.log('============================');

  if (missingDocs.length === 0) {
    console.log('Docs: OK');
  } else {
    console.log('Docs: MISSING');
    for (const doc of missingDocs) {
      console.log(` - ${doc}`);
    }
  }

  if (missingEnv.length === 0) {
    console.log('Environment: OK');
  } else {
    console.log('Environment: MISSING');
    for (const envKey of missingEnv) {
      console.log(` - ${envKey}`);
    }
  }

  if (missingDocs.length > 0 || missingEnv.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log('Result: READY FOR GA GATE REVIEW');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
