import { buildPageNumbers } from "../../utils/format";

export default function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination">
      <button disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)} type="button">
        Previous
      </button>
      {buildPageNumbers(currentPage, totalPages).map((pageNumber) => (
        <button
          className={pageNumber === currentPage ? "is-active" : ""}
          key={pageNumber}
          onClick={() => onChange(pageNumber)}
          type="button"
        >
          {pageNumber}
        </button>
      ))}
      <button disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)} type="button">
        Next
      </button>
    </nav>
  );
}

