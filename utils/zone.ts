export const normalizeZone = (zone?: string | null) =>
  (zone || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

export const isSameZone = (
  firstZone?: string | null,
  secondZone?: string | null
) => {
  const normalizedFirstZone = normalizeZone(firstZone);
  const normalizedSecondZone = normalizeZone(secondZone);

  return (
    normalizedFirstZone.length > 0 &&
    normalizedSecondZone.length > 0 &&
    normalizedFirstZone === normalizedSecondZone
  );
};

export const sortSameZoneFirst = <T extends { zona?: string | null }>(
  items: T[],
  zone?: string | null
) => {
  return [...items].sort((a, b) => {
    const aMatches = isSameZone(a.zona, zone);
    const bMatches = isSameZone(b.zona, zone);

    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });
};
