import mongoose from 'mongoose';

const tripInstanceSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    travelerCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    costs: {
      lodging: {
        type: Number,
        default: 0,
        min: 0,
      },
      travel: {
        type: Number,
        default: 0,
        min: 0,
      },
      carRental: {
        type: Number,
        default: 0,
        min: 0,
      },
      activities: [{
        label: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        }
      }],
      other: [{
        label: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        }
      }]
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCommitted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

tripInstanceSchema.pre('save', function(next) {
  const costs = this.costs;
  this.total = (costs.lodging || 0) + 
               (costs.travel || 0) + 
               (costs.carRental || 0) +
               (costs.activities || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
               (costs.other || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  next();
});

tripInstanceSchema.index(
  { tripId: 1, isCommitted: 1 },
  { 
    unique: true,
    partialFilterExpression: { isCommitted: true }
  }
);

const TripInstance = mongoose.model('TripInstance', tripInstanceSchema);

export default TripInstance;
