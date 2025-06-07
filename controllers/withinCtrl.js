const WithinTrip = require('../models/withinTripModel');

const withinTripCtrl = {

    // Create a WithinTrip
    createWithinTrip: async (req, res) => {
        try {
            const {
                tripId,
                trip_start,
                trip_end,
                stay_expense,
                travel_expense,
                car_expense,
                other_expense,
                isFavorite,
                activities,
                isTripCommited
            } = req.body;

            const newWithinTrip = new WithinTrip({
                tripId,
                trip_start,
                trip_end,
                stay_expense,
                travel_expense,
                car_expense,
                other_expense,
                isFavorite,
                activities,
                isTripCommited
            });

            await newWithinTrip.save();
            res.json({ msg: "Created a within trip", withinTripId: newWithinTrip._id });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Get all WithinTrips associated with a Trip
    getWithinTripsByTripId: async (req, res) => {
        try {
            const { tripId } = req.params;
            const trips = await WithinTrip.find({ tripId });
            res.json(trips);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Get a specific WithinTrip
    getSpecificWithinTrip: async (req, res) => {
        try {
            const trip = await WithinTrip.findById(req.params.id);
            res.json(trip);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Update a WithinTrip
    updateWithinTrip: async (req, res) => {
        try {
            const {
                trip_start,
                trip_end,
                stay_expense,
                travel_expense,
                car_expense,
                other_expense,
                isFavorite,
                activities,
                isTripCommited
            } = req.body;

            await WithinTrip.findOneAndUpdate(
                { _id: req.params.id },
                {
                    trip_start,
                    trip_end,
                    stay_expense,
                    travel_expense,
                    car_expense,
                    other_expense,
                    isFavorite,
                    activities,
                    isTripCommited
                }
            );

            res.json({ msg: "Updated a within trip" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Delete a WithinTrip
    deleteWithinTrip: async (req, res) => {
        try {
            await WithinTrip.findByIdAndDelete(req.params.id);
            res.json({ msg: "Deleted a within trip" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
};

module.exports = withinTripCtrl;
