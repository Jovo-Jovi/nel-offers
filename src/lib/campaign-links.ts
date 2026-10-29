export function chatLink(digits: string) {
  return `https://wa.me/${digits}`;
}

export function orderLink(digits: string, message: string) {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function dialLink(hotlineDial: string) {
  return `tel:${hotlineDial}`;
}
