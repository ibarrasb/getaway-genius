const Trips = require('../models/tripModels');

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

//user controller for authentication
const tripCtrl = {

getTrips: async(req,res) => {
    try {
        // Use await to wait for the result of the find() query
        const trips = await Trips.find();
        res.json(trips);
      } catch (err) {
        return res.status(500).json({ msg: err.message });
      }

}, 
createTrips: async (req, res) => {
    try {
        const {user_email, location_address, trip_start, trip_end, stay_expense, travel_expense, car_expense, image_url} = req.body;
        if(!image_url) return res.status(400).json({msg: "No image upload"})

        const tripstart = await Trips.findOne({trip_start})
        if(tripstart)
            return res.status(400).json({msg: "You have an existing vacation on this day"})

        const newVacation = new Trips({
            user_email, location_address, trip_start, trip_end, stay_expense, travel_expense, car_expense, image_url
        })

        await newVacation.save()
        res.json({msg: "Created a planned trip"})

    } catch (err) {
        return res.status(500).json({msg: err.message})
    }

},
deleteTrip: async (req, res) => {
    try {
        await Trips.findByIdAndDelete(req.params.id)
        res.json({msg: "Deleted a Trip"})
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
},
updateTrip: async (req, res) => {
    try {
        const {user_email, location_address, trip_start, trip_end, stay_expense, travel_expense, car_expense, image_url} = req.body;
        // if(!image_url) return res.status(400).json({msg: "No image upload"})

        await Trips.findOneAndUpdate({_id: req.params.id}, {
            user_email, location_address, trip_start, trip_end, stay_expense, travel_expense, car_expense, image_url
        })

        res.json({msg: "Updated a Product"})
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }

},
getSpecificTrip: async (req, res) => {
    try {
        const detailedTrip = await Trips.findById(req.params.id)
        res.json(detailedTrip)
        
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
}
}
module.exports = tripCtrl