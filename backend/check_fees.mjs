import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
    const Fee = mongoose.model('Fee', new mongoose.Schema({}, { strict: false }));
    const student = await Student.findOne({ $or: [{ email: 'student@school.com' }, { name: 'Aarav Sharma' }] });
    console.log('Student found:', student ? { _id: student._id.toString(), name: student.name, classGrade: student.classGrade, userId: student.userId?.toString() } : 'Not found');
    if (student) {
      const fees = await Fee.find({ studentId: student._id });
      console.log('Fees count for student:', fees.length);
      fees.forEach(f => console.log('Fee:', { id: f._id.toString(), month: f.month, total: f.totalAmount, paid: f.paidAmount, remaining: f.remainingAmount, status: f.status, paymentReference: f.paymentReference }));
    }
    const allFees = await Fee.countDocuments();
    console.log('Total fees in DB:', allFees);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
check();
