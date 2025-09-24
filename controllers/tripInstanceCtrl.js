import TripInstance from '../models/tripInstanceModels.js';
import Trip from '../models/tripModels.js';

const createTripInstance = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { name, startDate, endDate, travelerCount, costs } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ msg: 'Trip not found' });
    }

    const newInstance = new TripInstance({
      tripId,
      name: name || '',
      startDate,
      endDate,
      travelerCount: travelerCount || 1,
      costs: costs || {
        lodging: 0,
        travel: 0,
        carRental: 0,
        activities: [],
        other: []
      }
    });

    await newInstance.save();
    res.status(201).json(newInstance);
  } catch (error) {
    console.error('Error creating trip instance:', error);
    res.status(500).json({ msg: 'Server error creating trip instance' });
  }
};

const getTripInstances = async (req, res) => {
  try {
    const { tripId } = req.params;

    const instances = await TripInstance.find({ tripId }).sort({ createdAt: -1 });
    res.json(instances);
  } catch (error) {
    console.error('Error fetching trip instances:', error);
    res.status(500).json({ msg: 'Server error fetching trip instances' });
  }
};

const getTripInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;

    const instance = await TripInstance.findById(instanceId).populate('tripId');
    if (!instance) {
      return res.status(404).json({ msg: 'Trip instance not found' });
    }

    res.json(instance);
  } catch (error) {
    console.error('Error fetching trip instance:', error);
    res.status(500).json({ msg: 'Server error fetching trip instance' });
  }
};

const updateTripInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { name, startDate, endDate, travelerCount, costs } = req.body;

    const instance = await TripInstance.findById(instanceId);
    if (!instance) {
      return res.status(404).json({ msg: 'Trip instance not found' });
    }

    if (name !== undefined) instance.name = name;
    if (startDate !== undefined) instance.startDate = startDate;
    if (endDate !== undefined) instance.endDate = endDate;
    if (travelerCount !== undefined) instance.travelerCount = travelerCount;
    if (costs !== undefined) instance.costs = costs;

    await instance.save(); // This will trigger the pre-save hook to recalculate total
    res.json(instance);
  } catch (error) {
    console.error('Error updating trip instance:', error);
    res.status(500).json({ msg: 'Server error updating trip instance' });
  }
};

const deleteTripInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;

    const instance = await TripInstance.findById(instanceId);
    if (!instance) {
      return res.status(404).json({ msg: 'Trip instance not found' });
    }

    if (instance.isCommitted) {
      await Trip.findByIdAndUpdate(instance.tripId, { committedInstanceId: null });
    }

    await TripInstance.findByIdAndDelete(instanceId);
    res.json({ msg: 'Trip instance deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip instance:', error);
    res.status(500).json({ msg: 'Server error deleting trip instance' });
  }
};

const commitTripInstance = async (req, res) => {
  try {
    const { tripId, instanceId } = req.params;

    const instance = await TripInstance.findById(instanceId);
    if (!instance) {
      return res.status(404).json({ msg: 'Trip instance not found' });
    }

    if (instance.tripId.toString() !== tripId) {
      return res.status(400).json({ msg: 'Instance does not belong to this trip' });
    }

    await TripInstance.updateMany(
      { tripId, _id: { $ne: instanceId } },
      { isCommitted: false }
    );

    instance.isCommitted = true;
    await instance.save();

    await Trip.findByIdAndUpdate(tripId, { committedInstanceId: instanceId });

    res.json({ msg: 'Trip instance committed successfully', instance });
  } catch (error) {
    console.error('Error committing trip instance:', error);
    res.status(500).json({ msg: 'Server error committing trip instance' });
  }
};

const uncommitTripInstance = async (req, res) => {
  try {
    const { tripId, instanceId } = req.params;

    const instance = await TripInstance.findById(instanceId);
    if (!instance) {
      return res.status(404).json({ msg: 'Trip instance not found' });
    }

    if (instance.tripId.toString() !== tripId) {
      return res.status(400).json({ msg: 'Instance does not belong to this trip' });
    }

    instance.isCommitted = false;
    await instance.save();

    await Trip.findByIdAndUpdate(tripId, { committedInstanceId: null });

    res.json({ msg: 'Trip instance uncommitted successfully', instance });
  } catch (error) {
    console.error('Error uncommitting trip instance:', error);
    res.status(500).json({ msg: 'Server error uncommitting trip instance' });
  }
};

export {
  createTripInstance,
  getTripInstances,
  getTripInstance,
  updateTripInstance,
  deleteTripInstance,
  commitTripInstance,
  uncommitTripInstance
};
