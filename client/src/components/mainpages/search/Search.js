import React, { useState, useEffect } from 'react';

const Search = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    // Replace 'YOUR_API_KEY' with your actual RAWG API key
    const apiKey = '95a44970ed754fbdae5a7694225155cc';

    fetch(`https://api.rawg.io/api/games?key=${apiKey}&dates=2022-01-01,2022-12-31&ordering=-added`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        // Assuming the data has a 'results' property
        setGames(data.results);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  return (
    <div>
      <h1>Popular Games</h1>
      <ul>
        {games.map((game) => (
          <li key={game.id}>{game.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Search;
