/**
 * Utilidades para el manejo de moneda (PYG - Guaraníes)
 */

export const formatPYG = (value: number | string): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('es-PY').format(num);
};

export const parsePYG = (value: string): number => {
  if (!value) return 0;
  // Elimina todo lo que no sea dígito
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue ? parseInt(cleanValue) : 0;
};
