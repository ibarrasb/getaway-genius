const router = require('express').Router();
const withinTripCtrl = require('../controllers/withinCtrl');
const auth = require('../middleware/auth');

// Create a within trip & Get all within trips for a specific trip
router.route('/within-trip')
    .post(auth, withinTripCtrl.createWithinTrip); // Requires auth to create

// Get all within trips tied to a specific getaway trip
router.route('/within-trip/:tripId')
    .get(withinTripCtrl.getWithinTripsByTripId);

// Get, Update, Delete a specific within trip by its ID
router.route('/within/:id')
    .get(withinTripCtrl.getSpecificWithinTrip)
    .put(auth, withinTripCtrl.updateWithinTrip)
    .delete(auth, withinTripCtrl.deleteWithinTrip);

module.exports = router;
