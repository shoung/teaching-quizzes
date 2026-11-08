import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SalonCardHand } from './SalonCardHand';
import { seasonActions } from '../data/paris-salon-season';
import type { ActionId } from './season-types';

afterEach(cleanup);

describe('SalonCardHand', () => {
  it('shows the full unfiltered hand, exposes details on focus, and returns picked cards to the hand', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<SalonCardHand actions={seasonActions} selected={[]} staffAvailable={2} onToggle={onToggle} getIssue={() => null} reducedMotion={false} />);
    expect(screen.getAllByRole('button', { name: /選擇/ })).toHaveLength(12);
    expect(screen.queryByRole('group', { name: /篩選/ })).not.toBeInTheDocument();
    const card = screen.getByRole('button', { name: /選擇.*詢問來客需求/ });
    fireEvent.focus(card);
    expect(card).toHaveTextContent('顧客研究與需求探索');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith('research');
    rerender(<SalonCardHand actions={seasonActions} selected={['research']} staffAvailable={2} onToggle={onToggle} getIssue={() => null} reducedMotion={false} />);
    const selectedCard = screen.getByRole('button', { name: /移回手牌.*詢問來客需求/ });
    expect(selectedCard).toHaveFocus();
    fireEvent.click(selectedCard);
    expect(onToggle).toHaveBeenCalledWith('research');
  });

  it('keeps rejected cards focusable, announces the reason, and supports arrow navigation', () => {
    const reason = '助手不足，請收回一張牌。';
    const onToggle = vi.fn();
    const onInspect = vi.fn();
    const { container } = render(<SalonCardHand actions={seasonActions} selected={[]} staffAvailable={2} onToggle={onToggle} getIssue={(id: ActionId) => id === 'research' ? reason : null} reducedMotion={false} onInspect={onInspect} />);
    const first = screen.getByRole('button', { name: /選擇.*詢問來客需求/ });
    expect(first).toHaveAttribute('aria-disabled', 'true');
    expect(first).not.toBeDisabled();
    fireEvent.focus(first);
    expect(screen.getByRole('status')).toHaveTextContent(reason);
    fireEvent.mouseEnter(first);
    expect(onInspect).toHaveBeenCalled();
    fireEvent.click(first);
    expect(onToggle).not.toHaveBeenCalled();
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(onToggle).not.toHaveBeenCalled();
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(container.querySelectorAll('.salon-card-hand-card')[1]).toHaveFocus();
  });
});
