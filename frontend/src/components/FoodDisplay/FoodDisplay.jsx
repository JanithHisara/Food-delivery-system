import React, { useContext, useEffect, useState } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = ({ category = "All" }) => {
  const { food_list } = useContext(StoreContext);

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Filter states
  const [sortOrder, setSortOrder] = useState('LowToHigh');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal and temp states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSortOrder, setTempSortOrder] = useState(sortOrder);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);
  const [tempStockFilter, setTempStockFilter] = useState(stockFilter);
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width <= 790) setItemsPerPage(1);
      else if (width <= 1150) setItemsPerPage(2);
      else if (width <= 1450) setItemsPerPage(3);
      else setItemsPerPage(4);
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const openModal = () => {
    setTempSortOrder(sortOrder);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempStockFilter(stockFilter);
    setTempSearchTerm(searchTerm);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    const parsedMin = tempMinPrice !== '' ? parseFloat(tempMinPrice) : 0;
    const parsedMax = tempMaxPrice !== '' ? parseFloat(tempMaxPrice) : Infinity;

    if (parsedMin < 0 || parsedMax < 0) {
      alert('Price cannot be negative.');
      return;
    }

    if (parsedMin > parsedMax) {
      alert('Minimum price cannot be greater than maximum price.');
      return;
    }

    setSortOrder(tempSortOrder);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setStockFilter(tempStockFilter);
    setSearchTerm(tempSearchTerm);
    setCurrentPage(0);
    closeModal();
  };

  const suggestions = food_list
    .filter(item => item.name.toLowerCase().includes(tempSearchTerm.toLowerCase()))
    .slice(0, 5);

  const filteredFood = food_list
    .filter(item => category === 'All' || item.category === category)
    .filter(item => {
      const min = minPrice !== '' ? parseFloat(minPrice) : 0;
      const max = maxPrice !== '' ? parseFloat(maxPrice) : Infinity;
      return item.price >= min && item.price <= max;
    })
    .filter(item => {
      if (stockFilter === 'in') return item.available > 0;
      if (stockFilter === 'out') return item.available === 0;
      return true;
    })
    .filter(item => !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortedFood = [...filteredFood].sort((a, b) =>
    sortOrder === 'LowToHigh' ? a.price - b.price : b.price - a.price
  );

  const totalPages = Math.ceil(sortedFood.length / itemsPerPage);
  const displayedFood = sortedFood.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className='food-display' id='food-display'>
      <h2>Top Dishes Near You</h2>

      <div className="filters-btn-container">
        <button className="filters-btn" onClick={openModal}>
          Apply Filters
        </button>
      </div>

      <div className="food-display-list">
        {displayedFood.length > 0 ? (
          displayedFood.map((item, index) => (
            <FoodItem
              key={index}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))
        ) : (
          <p>No food items match your filters.</p>
        )}
      </div>

      <div className="pagination">
        <button
          className={`arrow left ${currentPage === 0 ? 'disabled' : ''}`}
          onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
          disabled={currentPage === 0}
        >
          &lt;
        </button>
        <div className="page-buttons">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`page-button ${currentPage === index ? 'active' : ''}`}
              onClick={() => setCurrentPage(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button
          className={`arrow right ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
          disabled={currentPage === totalPages - 1}
        >
          &gt;
        </button>
      </div>

      {/* Filter Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleApplyFilters}>
            <h3>Filter Dishes</h3>

            <div className="filter-item">
              <label>Max Price:
                <input type="number" min="0" value={tempMaxPrice} onChange={(e) => setTempMaxPrice(e.target.value)} />
              </label>
            </div>

            <div className="filter-item">
              <label>Min Price:
                <input type="number" min="0" value={tempMinPrice} onChange={(e) => setTempMinPrice(e.target.value)} />
              </label>
            </div>

            <div className="filter-item">
              <label>Sort By:
                <select value={tempSortOrder} onChange={(e) => setTempSortOrder(e.target.value)}>
                  <option value="LowToHigh">Price: Low to High</option>
                  <option value="HighToLow">Price: High to Low</option>
                </select>
              </label>
            </div>

            <div className="filter-item">
              <label>Availability:
                <select value={tempStockFilter} onChange={(e) => setTempStockFilter(e.target.value)}>
                  <option value="all">Available.</option>
                </select>
              </label>
            </div>

            <div className="filter-item" style={{ position: 'relative' }}>
              <label>Search by Name:
                <input
                  type="text"
                  value={tempSearchTerm}
                  onChange={(e) => {
                    setTempSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Start typing a dish name..."
                />
              </label>

              {tempSearchTerm && showSuggestions && suggestions.length > 0 && (
                <ul className="suggestion-box">
                  {suggestions.map((item) => (
                    <li
                      key={item._id}
                      onClick={() => {
                        setTempSearchTerm(item.name);
                        setShowSuggestions(false);
                      }}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="filter-actions">
              <button type="submit" className="apply-button">Apply Filters</button>
              <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
