import React, { useState } from 'react';

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
    <div>
      <h1>Popular Games</h1>
      <input
        type="text"
        placeholder="Search for games"
        value={searchQ}
        onChange={handleSearchChange}
      />
      <button onClick={handleSearch}>Submit</button>
      <ul>
        {games.map((game) => (
          <li key={game.id}>
            <strong>{game.name}</strong>
            {game.background_image && (
              <img
                src={game.background_image}
                alt={game.name}
                style={{ width: "150px", height: "100px" }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
