import envFile from '../config/env.js';
import fs from 'fs';

async function main() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY not set in environment.');
    process.exitCode = 2;
    return;
  }

  const targetDomain = process.argv[2];

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend API error', res.status, body);
      process.exitCode = 3;
      return;
    }

    const data = await res.json();
    const domains = data.data || data.domains || data;
    if (!Array.isArray(domains)) {
      console.log('Domains response:', JSON.stringify(domains, null, 2));
      return;
    }

    console.log(`Found ${domains.length} domain(s) on Resend:`);
    domains.forEach((d) => {
      const name = d.domain || d.name || d;
      const status = d.status || d.verification_status || 'unknown';
      console.log(`- ${name} : ${status}`);
      if (d.verification && Array.isArray(d.verification.records)) {
        d.verification.records.forEach((r) => {
          console.log(`    • ${r.name} ${r.type} => ${r.value} (${r.status || 'pending'})`);
        });
      } else if (d.records) {
        d.records.forEach((r) => {
          console.log(`    • ${r.name} ${r.type} => ${r.value} (${r.status || 'pending'})`);
        });
      }
    });

    if (targetDomain) {
      const found = domains.find((d) => (d.domain || d.name || '').toLowerCase() === targetDomain.toLowerCase());
      if (!found) {
        console.log(`\nDomain ${targetDomain} not found in your Resend account.`);
      } else {
        console.log(`\nDetails for ${targetDomain}:`);
        console.log(JSON.stringify(found, null, 2));
      }
    }
  } catch (err) {
    console.error('Failed to query Resend API:', err.message || err);
    process.exitCode = 4;
  }
}

main();
