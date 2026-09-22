// Imagens preservadas para o uso futuro do app. React Native exige caminhos
// literais no require() para incluir cada arquivo no pacote.
export const diceImages = {
  11: require('../assets/dice/11.jpg'),
  12: require('../assets/dice/12.jpg'),
  13: require('../assets/dice/13.jpg'),
  14: require('../assets/dice/14.jpg'),
  15: require('../assets/dice/15.jpg'),
  16: require('../assets/dice/16.jpg'),
  22: require('../assets/dice/22.jpg'),
  23: require('../assets/dice/23.jpg'),
  24: require('../assets/dice/24.jpg'),
  25: require('../assets/dice/25.jpg'),
  26: require('../assets/dice/26.jpg'),
  33: require('../assets/dice/33.jpg'),
  34: require('../assets/dice/34.jpg'),
  35: require('../assets/dice/35.jpg'),
  36: require('../assets/dice/36.jpg'),
  44: require('../assets/dice/44.jpg'),
  45: require('../assets/dice/45.jpg'),
  46: require('../assets/dice/46.jpg'),
  55: require('../assets/dice/55.jpg'),
  56: require('../assets/dice/56.jpg'),
  66: require('../assets/dice/66.jpg'),
} as const;

export type DiceImageName = keyof typeof diceImages;

export const diceImageNames = Object.keys(diceImages).map(Number) as DiceImageName[];
