import React, { useState } from 'react';
import './styles.css';

const Search = () => {
  const [games, setGames] = useState([]);
  const [searchQ, setSearchQ] = useState('');

  const handleSearch = () => {
    if (searchQ === '') {
      return; // No need to make an empty search
    }

    // Fetch Data from external API
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/external-data?searchQ=${searchQ}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setGames(data.results);
        console.log(data.results);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  };

  const handleSearchChange = (event) => {
    setSearchQ(event.target.value);
  };

  return (
    <div className="container-search">
    <h1>Popular Games</h1>
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Search for destinations"
        value={searchQ}
        onChange={handleSearchChange}
        className="search-bar"
      />
      <button onClick={handleSearch}>Submit</button>
    </div>
      <ul className="game-list">
      {games.map((game) => (
        <li key={game.id} className="game-item">
          <strong className="game-title">{game.name}</strong>
          {game.background_image && (
            <img
              src={game.background_image}
              alt={game.name}
              className="game-image"
            />
          )}
        </li>
      ))}
    </ul>
    
    </div>
  );
};

export default Search;
