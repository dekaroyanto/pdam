/**
 * Safe formula evaluator for dynamic PDAM job items
 * Examples:
 *  formula: "a * b * c"
 *  params: { a: 10, b: 0.5, c: 1.2 }
 *  result: 6.0
 */

export function calculateVolume({ formula, params, type = 'RUMUS_DINAMIS', manualVolume = 0 }) {
  if (type === 'MANUAL') {
    const val = parseFloat(manualVolume);
    return isNaN(val) ? 0 : roundToFourDecimals(val);
  }

  if (!formula || typeof formula !== 'string' || formula.trim() === '') {
    // If no formula provided, check if manualVolume is present
    const val = parseFloat(manualVolume);
    return isNaN(val) ? 0 : roundToFourDecimals(val);
  }

  try {
    const parsedParams = typeof params === 'string' ? JSON.parse(params) : (params || {});

    // Tokenize / replace variable names with numbers
    // Replace valid parameter identifiers
    let expression = formula;

    // Sort keys by length descending to prevent substring collisions (e.g. "tinggi_air" vs "tinggi")
    const keys = Object.keys(parsedParams).sort((a, b) => b.length - a.length);

    for (const key of keys) {
      const rawVal = parsedParams[key];
      const numVal = parseFloat(rawVal) || 0;
      // Use word boundary regex or replace identifier
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      expression = expression.replace(regex, `(${numVal})`);
    }

    // Check if expression contains any unauthorized characters (only allow digits, parens, decimal point, and + - * / %)
    if (/[^0-9\.\+\-\*\/\(\)\s%]/.test(expression)) {
      console.warn('Expression contains invalid characters after parameter substitution:', expression);
      return 0;
    }

    // Evaluate safely using Function constructor with no scope access
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression})`)();
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return 0;
    }

    return roundToFourDecimals(result);
  } catch (err) {
    console.error('Error evaluating formula:', formula, params, err.message);
    return 0;
  }
}

export function roundToFourDecimals(num) {
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
}

/**
 * Format numbers according to Indonesian locale (e.g. 1.234,50)
 */
export function formatNumberIndo(num, maxDecimals = 4) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const val = Number(num);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(val);
}

