import type { Locator } from '@playwright/test';

// Rótulos e formatos que o front usa, para comparar a tela com a API.
export const GAME_LABEL: Record<string, string> = {
  pokemon: 'Pokémon',
  yugioh: 'Yu-Gi-Oh!',
  magic: 'Magic',
  one_piece: 'One Piece',
  riftbound: 'Riftbound',
  lorcana: 'Lorcana',
  digimon: 'Digimon',
};

/** "R$ 20,00" a partir de centavos. O Intl põe espaço não separável depois do R$. */
export function brl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(cents / 100)
    .replace(/\s/g, ' ');
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** ids dos torneios a partir do href /campeonatos/{id} de cada card. */
export const cardIds = (links: Locator) =>
  links.evaluateAll(as => as.map(a => Number(a.getAttribute('href')?.match(/\/campeonatos\/(\d+)$/)?.[1])));
