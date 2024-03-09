import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import './styles.css';

// Import the updated JSON data
// import testData from './testData.json'; // Replace with the actual path to your JSON file

function Home() {
  const state = useContext(GlobalState);
  // const [isLogged] = state.UserAPI.isLogged;
  const [name] = state.UserAPI.name;


  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Load the updated JSON data into the state
    // setTransactions(testData.transactions);
  }, []);

  // const loggedRouter = () => {
  //   return (
  //     <div className="container-welcome">
  //       <div className="welcome">Welcome</div>
  //       <div className="welcome-name">{name}</div>
  //     </div>
  //   );
  // };

  // Function to render a single transaction box
  const renderTransaction = (transaction, index) => (
    <div className="transaction-box" key={index}>
      <div>
        <div>Game: {transaction.user1.game_name}</div>
        <div>User: {transaction.user1.username}</div>
      </div>
    </div>
  );

  const handleMoreClick = () => {

  }

  // Limit the displayed transactions to the first three
  const displayedTransactions = transactions.slice(0, 3);

  return (
    <div>

    <div className="container-welcome">
    <div className="welcome">Welcome</div>
    <div className="welcome-name">{name}</div>
  </div>
      
    <div className="library-container">
        <button className="add-button">Add</button>
      </div>

      <div className="open-transactions-container">
        <h1>Your open vacations:</h1>
        {/* Render the first three transactions in colored boxes in-line */}
        {displayedTransactions.map((transaction, index) => renderTransaction(transaction, index))}
      </div>

      {/* Add a "More" button to redirect to another page */}
      {transactions.length > 3 && (
        <button className="more-button" onClick={() => handleMoreClick()}>
          More
        </button>
      )}

    
    </div>
  );
}

export default Home;
