import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SalonGame from './SalonGame';
import { SEASON_PLAY, SEASON_STORAGE_KEY, initialSeason, startSeason } from './season-engine';
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,'','#/quiz/paris-salon/1');vi.stubGlobal('matchMedia',()=>({matches:true}));});
describe('RPG 故事與角色場景',()=>{
  it('標題進入分句開場後才開始經營，不沿用舊版紀錄',async()=>{
    const user=userEvent.setup();localStorage.setItem('learning-lab:quiz:paris-salon:v3','舊季');render(<SalonGame/>);
    await user.click(screen.getByRole('button',{name:'翻開故事'}));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal','true');
    expect(document.querySelector('.rpg-dialogue-visible')?.textContent?.length).toBeGreaterThan(0);
    expect(screen.getByRole('dialog')).not.toHaveTextContent('2026');
    expect(screen.queryByRole('button',{name:'沙龍計劃'})).not.toBeInTheDocument();
    let clicks=0;while(screen.queryByRole('button',{name:'繼續對話'})&&clicks++<40)await user.click(screen.getByRole('button',{name:'繼續對話'}));
    expect(window.location.hash).toBe(SEASON_PLAY);
    expect(screen.getByRole('button',{name:'沙龍計劃'})).toBeDisabled();
    await waitFor(()=>expect(JSON.parse(localStorage.getItem(SEASON_STORAGE_KEY)!).version).toBe(4));
    expect(localStorage.getItem('learning-lab:quiz:paris-salon:v3')).toBe('舊季');
  });
  it('每場只出現三位 NPC，角色深度與面向不同，沒有側邊名單或場內分享',()=>{
    localStorage.setItem(SEASON_STORAGE_KEY,JSON.stringify(startSeason(initialSeason())));window.history.replaceState(null,'',SEASON_PLAY);render(<SalonGame/>);
    const actors=[...document.querySelectorAll<HTMLButtonElement>('.rpg-world-actor.npc-button')];
    expect(actors).toHaveLength(3);expect(new Set(actors.map(n=>n.style.top)).size).toBe(3);
    expect(document.querySelector('.faces-left')).toBeInTheDocument();
    expect(document.querySelector('.season-department-npcs')).toBeNull();
    expect(screen.queryByRole('button',{name:'分享沙龍'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'經營帳冊'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/知名度 50/})).toHaveTextContent('50');
  });
});
