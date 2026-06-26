import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: ({ children }) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
}));

const medicines = [
  { name: 'Paracetamol', category: 'Analgesic', quantity: 0, threshold: 10, price: 12, expiryDate: '2026-01-01', unit: 'Tablets' },
  { name: 'Amoxicillin', category: 'Antibiotic', quantity: 25, threshold: 30, price: 20, expiryDate: '2026-12-01', unit: 'Capsules' },
];

const stockOuts = [];

describe('Dashboard navigation cards', () => {
  it('routes to filtered lists when cards are clicked', () => {
    const navigate = vi.fn();
    render(<Dashboard medicines={medicines} stockOuts={stockOuts} navigate={navigate} />);

    fireEvent.click(screen.getByRole('button', { name: /open expiry tracker/i }));
    fireEvent.click(screen.getByRole('button', { name: /open medicines list/i }));
    fireEvent.click(screen.getByRole('button', { name: /open stock out/i }));

    expect(navigate).toHaveBeenCalledWith('/expiry-tracker?filter=critical');
    expect(navigate).toHaveBeenCalledWith('/medicines');
    expect(navigate).toHaveBeenCalledWith('/stock-out');
  });
});
