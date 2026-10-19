import { validateSite } from './site.mjs';
try {
  const { files, references } = validateSite();
  console.log(`PASS: ${files.length} runtime files, ${references} exact-case local references and first-party script syntax.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
