const Paginator = ({ totalItems, itemsPerPage, currentPage, setCurrentPage }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDirectPageChange = (event) => {
    const page = parseInt(event.target.value, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-4">
      <button className="btn btn-login" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
        Anterior
      </button>
      <span className="mx-2">
        Página {currentPage} de {totalPages}
      </span>
      <input
        type="number"
        value={currentPage}
        min={1}
        max={totalPages}
        onChange={handleDirectPageChange}
        style={{ width: '60px', textAlign: 'center' }}
      />
      <button className="btn btn-login" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Próxima
      </button>
    </div>
  );
};


export default Paginator;
