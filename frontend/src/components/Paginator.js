import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Paginator = ({ totalItems, itemsPerPage, currentPage, setCurrentPage }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [inputPage, setInputPage] = useState(currentPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setInputPage(newPage); // Atualiza o campo com a nova página
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    if (value === "" || (!isNaN(value) && parseInt(value, 10) >= 1 && parseInt(value, 10) <= totalPages)) {
      setInputPage(value);
    }
  };

  const handleInputSubmit = (event) => {
    if (event.key === "Enter") {
      const page = parseInt(inputPage, 10);
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    }
  };

  // Gerar os botões da página
  const pageButtons = () => {
    const buttons = [];
    if (currentPage > 1) {
      buttons.push(
        <button
          key="first"
          className="btn btn-outline-primary mx-1"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
    }
    if (currentPage > 2) {
      buttons.push(<span key="dots-before" className="mx-1">...</span>);
    }
    buttons.push(
      <button
        key="current"
        className="btn btn-primary mx-1"
        disabled
      >
        {currentPage}
      </button>
    );
    if (currentPage < totalPages - 1) {
      buttons.push(<span key="dots-after" className="mx-1">...</span>);
    }
    if (currentPage < totalPages) {
      buttons.push(
        <button
          key="last"
          className="btn btn-outline-primary mx-1"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="d-flex justify-content-center align-items-center mt-4">
      <button
        className="btn btn-outline-secondary mx-1"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Anterior
      </button>

      {pageButtons()}

      <button
        className="btn btn-outline-secondary mx-1"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próxima
      </button>

      <div className="mx-3">
        <input
          type="number"
          className="form-control text-center"
          style={{ width: "80px", display: "inline" }}
          value={inputPage}
          min={1}
          max={totalPages}
          onChange={handleInputChange}
          onKeyDown={handleInputSubmit}
          placeholder="Ir para"
        />
      </div>
    </div>
  );
};

export default Paginator;
