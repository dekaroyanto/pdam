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
    const val = parseFloat(manualVolume);
    return isNaN(val) ? 0 : roundToFourDecimals(val);
  }

  try {
    const parsedParams = typeof params === 'string' ? JSON.parse(params) : (params || {});

    let expression = formula;
    const keys = Object.keys(parsedParams).sort((a, b) => b.length - a.length);

    for (const key of keys) {
      const rawVal = parsedParams[key];
      const numVal = parseFloat(rawVal) || 0;
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      expression = expression.replace(regex, `(${numVal})`);
    }

    if (/[^0-9\.\+\-\*\/\(\)\s%]/.test(expression)) {
      console.warn('Expression contains invalid characters after parameter substitution:', expression);
      return 0;
    }

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

/**
 * Extract clean YYYY-MM-DD from any date string or Date object
 */
export function cleanDateStr(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0];
  }
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(dateVal).split('T')[0];
}

/**
 * Format date to clean Indonesian format (e.g. "23 Nov 2026")
 */
export function formatDateIndo(dateVal) {
  if (!dateVal) return '-';
  const clean = cleanDateStr(dateVal);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }
  return clean;
}
