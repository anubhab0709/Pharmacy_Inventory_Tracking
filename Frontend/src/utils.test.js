import { describe, expect, it } from 'vitest';
import { buildCsvContent, buildPrintableReportHtml, escapeCsvValue } from './utils';

describe('CSV export helpers', () => {
  it('escapes quotes, commas, and newlines in CSV values', () => {
    expect(escapeCsvValue('Alpha, "Beta"\nLine 2')).toBe('"Alpha, ""Beta"" Line 2"');
  });

  it('builds sanitized CSV output with a BOM and explicit columns', () => {
    const csv = buildCsvContent(
      [{ name: 'Paracetamol, 500mg', notes: 'Line 1\nLine 2', status: '"Urgent"' }],
      [
        { label: 'Medicine', key: 'name' },
        { label: 'Notes', key: 'notes' },
        { label: 'Status', key: 'status' },
      ]
    );

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Medicine","Notes","Status"');
    expect(csv).toContain('"Paracetamol, 500mg"');
    expect(csv).toContain('"Line 1 Line 2"');
    expect(csv).toContain('"""Urgent"""');
  });
});

describe('PDF export helper', () => {
  it('escapes HTML before rendering a printable report', () => {
    const html = buildPrintableReportHtml({
      title: 'Inventory <Report>',
      subtitle: 'Use & review',
      filename: 'inventory',
      rows: [{ name: '<script>alert(1)</script>', status: 'OK' }],
      columns: [
        { label: 'Name', key: 'name' },
        { label: 'Status', key: 'status' },
      ],
    });

    expect(html).toContain('Inventory &lt;Report&gt;');
    expect(html).toContain('Use &amp; review');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('<th>Name</th>');
  });
});
