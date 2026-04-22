export function formatCurrency(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function buildPageNumbers(currentPage, totalPages) {
  const pages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    pages.push(page);
  }
  return pages;
}

