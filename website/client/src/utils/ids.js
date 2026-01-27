let counter = 2000;

export function makeId(prefix = 'id') {
  counter += 1;
  return `${prefix}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}
