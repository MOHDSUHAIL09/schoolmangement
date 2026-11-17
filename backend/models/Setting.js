import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: 'The Royal Kensington Collegiate'
    },
    schoolMotto: {
      type: String,
      default: 'Virtus, Scientia et Excellentia • Est. 1892'
    },
    logoUrl: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: '14 Kensington Palace Gardens, London W8 4QX / Grandview Campus, CA'
    },
    phone: {
      type: String,
      default: '+1 (800) 845-ROYAL'
    },
    email: {
      type: String,
      default: 'chancellery@kensington-collegiate.edu'
    },
    website: {
      type: String,
      default: 'https://kensington-collegiate.edu'
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    currency: {
      type: String,
      default: '$'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Setting', settingSchema);
