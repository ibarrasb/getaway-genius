const router = require('express').Router()
const tripCtrl = require('../controllers/tripCtrl')
const auth = require('../middleware/auth')

//gets and posts trips made from users
router.route('/getaway-trip')
    .get(tripCtrl.getTrips)
    .post(auth, tripCtrl.createTrips)

//get favorite trips
router.route('/favorites')
    .get(tripCtrl.getFavoriteTrips)

//deletes and updates specific posts
router.route('/getaway/:id')
    .get(tripCtrl.getSpecificTrip)
    .delete(auth, tripCtrl.deleteTrip)
    .put(tripCtrl.updateTrip)

module.exports = router