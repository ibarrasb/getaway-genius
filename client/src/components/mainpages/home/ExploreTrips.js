import React from 'react';
import WishlistTrips from './WishlistTrips'
import ListedExploreTrips from './ListedExploreTrips';

function ExploreTrips() {
    return (
        <div>
            <ListedExploreTrips/>
            <WishlistTrips/> 
        </div>
    );
}

export default ExploreTrips;