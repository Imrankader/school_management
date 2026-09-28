/**
 * Centralized Academic Class Order Utility
 * 
 * Provides consistent class ranking and sorting across:
 * - Student Directory (Summary & Class View)
 * - Class Filter Dropdowns
 * - Excel Bulk Uploads & Template Generation
 * - Billing & Fee Management
 */

export const ACADEMIC_CLASSES = [
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

export const getClassAcademicRank = (className) => {
  if (!className) return 999;
  const s = String(className).trim().toUpperCase();

  // Normalize prefix: CLASS, GRADE, STANDARD, STD
  const clean = s.replace(/^(CLASS|GRADE|STANDARD|STD)\s+/i, '').trim();

  // Pre-primary
  if (clean === 'PRE-KG' || clean === 'PREKG' || clean === 'NURSERY') return 0;
  if (clean === 'LKG' || clean === 'L.K.G' || clean === 'L.K.G.') return 1;
  if (clean === 'UKG' || clean === 'U.K.G' || clean === 'U.K.G.') return 2;

  // Roman numerals: I to XII
  if (clean === 'I') return 3;
  if (clean === 'II') return 4;
  if (clean === 'III') return 5;
  if (clean === 'IV') return 6;
  if (clean === 'V') return 7;
  if (clean === 'VI') return 8;
  if (clean === 'VII') return 9;
  if (clean === 'VIII') return 10;
  if (clean === 'IX') return 11;
  if (clean === 'X') return 12;
  if (clean === 'XI') return 13;
  if (clean === 'XII') return 14;

  // Numeric standards: 1 to 12
  const numMatch = clean.match(/^\d+/);
  if (numMatch) {
    return 2 + parseInt(numMatch[0], 10);
  }

  return 100;
};

export const EXCEL_CLASSES = [
  'LKG',
  'UKG',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
];

export const toExcelClassName = (className) => {
  if (!className) return '';
  const s = String(className).trim().toUpperCase();

  if (s === 'LKG' || s === 'L.K.G' || s === 'L.K.G.') return 'LKG';
  if (s === 'UKG' || s === 'U.K.G' || s === 'U.K.G.') return 'UKG';
  if (s === 'PRE-KG' || s === 'PREKG' || s === 'NURSERY') return 'LKG';

  if (s === 'I') return 'I';
  if (s === 'II') return 'II';
  if (s === 'III') return 'III';
  if (s === 'IV') return 'IV';
  if (s === 'V') return 'V';
  if (s === 'VI') return 'VI';
  if (s === 'VII') return 'VII';
  if (s === 'VIII') return 'VIII';
  if (s === 'IX') return 'IX';
  if (s === 'X') return 'X';
  if (s === 'XI') return 'XI';
  if (s === 'XII') return 'XII';

  const m = s.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(\d+)/i);
  if (m) {
    const num = parseInt(m[1], 10);
    const roman = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
      7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
    };
    if (roman[num]) return roman[num];
  }

  return className;
};

export const toApplicationClassName = (excelClass) => {
  if (!excelClass) return '';
  const s = String(excelClass).trim().toUpperCase();

  if (s === 'LKG' || s === 'L.K.G' || s === 'L.K.G.') return 'LKG';
  if (s === 'UKG' || s === 'U.K.G' || s === 'U.K.G.') return 'UKG';
  if (s === 'PRE-KG' || s === 'PREKG' || s === 'NURSERY') return 'LKG';

  const romanMap = {
    'I': 'Class 1', 'II': 'Class 2', 'III': 'Class 3', 'IV': 'Class 4',
    'V': 'Class 5', 'VI': 'Class 6', 'VII': 'Class 7', 'VIII': 'Class 8',
    'IX': 'Class 9', 'X': 'Class 10', 'XI': 'Class 11', 'XII': 'Class 12'
  };
  if (romanMap[s]) return romanMap[s];

  const m = s.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(\d+)/i);
  if (m) {
    return `Class ${parseInt(m[1], 10)}`;
  }

  return excelClass;
};

export const isClassMatch = (classA, classB) => {
  if (!classA || !classB) return false;
  return toApplicationClassName(classA).toLowerCase() === toApplicationClassName(classB).toLowerCase();
};

export const compareAcademicClasses = (a, b) => {
  const nameA = typeof a === 'string' ? a : (a?.className || '');
  const nameB = typeof b === 'string' ? b : (b?.className || '');
  const rankA = getClassAcademicRank(nameA);
  const rankB = getClassAcademicRank(nameB);

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
};

