import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>呈递荣誉</Button>);
    expect(screen.getByRole('button', { name: '呈递荣誉' })).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('renders title', async () => {
    const { PageHeader } = await import('./Card');
    render(<PageHeader title="主管工作台" subtitle="test" />);
    expect(screen.getByRole('heading', { name: '主管工作台' })).toBeInTheDocument();
  });
});
