const OPERATORS = ['+', '−', '×', '÷'];

function currentNumberStart(expression: string) {
  let index = expression.length - 1;
  while (index >= 0 && /[\d,]/.test(expression[index])) index--;
  if (
    index >= 0 &&
    expression[index] === '−' &&
    (index === 0 || /[+−×÷(]/.test(expression[index - 1]))
  )
    index--;
  return index + 1;
}

export function appendDigit(expression: string, digit: string) {
  if (/[)%]$/.test(expression)) return `${expression}×${digit}`;
  const start = currentNumberStart(expression);
  const current = expression.slice(start);
  if (current === '0') return expression.slice(0, start) + digit;
  if (current === '−0') return expression.slice(0, start) + '−' + digit;
  return expression + digit;
}

export function appendDecimal(expression: string) {
  const current = expression.slice(currentNumberStart(expression));
  if (current.includes(',')) return expression;
  if (/[)%]$/.test(expression)) return expression + '×0,';
  if (!expression || /[+−×÷(]$/.test(expression)) return expression + '0,';
  return expression + ',';
}

export function appendOperator(expression: string, operator: string) {
  if (!OPERATORS.includes(operator)) return expression;
  if (!expression) return operator === '−' ? '−' : '';
  if (expression.endsWith('(')) return operator === '−' ? expression + operator : expression;
  if (OPERATORS.some((item) => expression.endsWith(item))) {
    if (operator === '−' && !expression.endsWith('−')) return expression + operator;
    return expression.slice(0, -1) + operator;
  }
  if (expression.endsWith(',')) return expression + '0' + operator;
  return expression + operator;
}

export function toggleParenthesis(expression: string) {
  const openings = (expression.match(/\(/g) || []).length;
  const closings = (expression.match(/\)/g) || []).length;
  if (!expression || /[+−×÷(]$/.test(expression)) return expression + '(';
  if (openings > closings && /[\d)%]$/.test(expression)) return expression + ')';
  return /[\d)%]$/.test(expression) ? expression + '×(' : expression + '(';
}

export function toggleSign(expression: string) {
  if (!expression) return '−';
  const start = currentNumberStart(expression);
  const number = expression.slice(start);
  if (!number || number === '−') return expression + '−';
  if (number.startsWith('−')) return expression.slice(0, start) + number.slice(1);
  return expression.slice(0, start) + '−' + number;
}

export function backspace(expression: string) {
  return expression.slice(0, -1);
}

export function evaluateExpression(expression: string): number | null {
  const input = expression.replace(/,/g, '.');
  let index = 0;

  function parseNumber(): number {
    const start = index;
    while (/[\d.]/.test(input[index] || '')) index++;
    if (start === index) throw new Error('Número esperado');
    const value = Number(input.slice(start, index));
    if (!Number.isFinite(value)) throw new Error('Número inválido');
    return value;
  }
  function parseFactor(): number {
    let sign = 1;
    while (input[index] === '+' || input[index] === '−') {
      if (input[index] === '−') sign *= -1;
      index++;
    }
    let value: number;
    if (input[index] === '(') {
      index++;
      value = parseSum();
      if (input[index] !== ')') throw new Error('Parêntese aberto');
      index++;
    } else value = parseNumber();
    while (input[index] === '%') {
      value /= 100;
      index++;
    }
    return sign * value;
  }
  function parseProduct(): number {
    let value = parseFactor();
    while (input[index] === '×' || input[index] === '÷') {
      const operator = input[index++];
      const right = parseFactor();
      value = operator === '×' ? value * right : value / right;
    }
    return value;
  }
  function parseSum(): number {
    let value = parseProduct();
    while (input[index] === '+' || input[index] === '−') {
      const operator = input[index++];
      const right = parseProduct();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  try {
    if (!input) return null;
    const result = parseSum();
    return index === input.length && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function formatResult(value: number) {
  if (!Number.isFinite(value)) return 'Erro';
  return String(Number(value.toPrecision(12))).replace('.', ',');
}
