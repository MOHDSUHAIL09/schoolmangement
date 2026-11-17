import mongoose from 'mongoose';

const pickupPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  fee: {
    type: Number,
    default: 0
  }
});

const transportSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      trim: true
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    vehicleType: {
      type: String,
      enum: ['Bus', 'Van', 'Mini-Bus'],
      default: 'Bus'
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    driverPhone: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      default: 40
    },
    pickupPoints: [pickupPointSchema],
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

transportSchema.index({ routeName: 1 });

export default mongoose.model('Transport', transportSchema);
