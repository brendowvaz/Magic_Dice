import type { DiceImageName } from './diceImages';

// Somente entradas com dois dados (1 a 6) selecionam uma das 21 fotos.
export function diceImageNameFor(input: string): DiceImageName | null {
  if (!/^[1-6]{2}$/.test(input)) return null;

  const first = Number(input[0]);
  const second = Number(input[1]);
  return (Math.min(first, second) * 10 + Math.max(first, second)) as DiceImageName;
}
