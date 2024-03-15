const router = require('express').Router()
const tripCtrl = require('../controllers/tripCtrl')
const auth = require('../middleware/auth')

//gets and posts trips made from users
router.route('/getaway-trip')
    .get(tripCtrl.getTrips)
    .post(auth, tripCtrl.createTrips)

//deletes and updates specific posts
router.route('/getaway/:id')
    .delete(auth, tripCtrl.deleteTrip)
    .put(auth, tripCtrl.updateTrip)

module.exports = router