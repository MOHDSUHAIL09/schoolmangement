import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
    const Fee = mongoose.model('Fee', new mongoose.Schema({}, { strict: false }));
    const student = await Student.findOne({ email: 'student@school.com' });
    if (!student) {
      console.log('Student not found');
      return;
    }
    console.log('Found student:', student.name, student._id);

    // Check if December 2026 fee exists
    let feeDec = await Fee.findOne({ studentId: student._id, month: 'December 2026' });
    if (!feeDec) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      feeDec = new Fee({
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber || '101',
        admissionNumber: student.admissionNumber || 'ADM-8801',
        classGrade: student.classGrade || 'Class 8',
        month: 'December 2026',
        academicYear: '2026-2027',
        tuition: 1250,
        game: 0,
        transport: 0,
        exam: 0,
        events: 0,
        other: 0,
        totalAmount: 1250,
        paidAmount: 0,
        remainingAmount: 1250,
        status: 'Pending',
        dueDate: new Date('2026-12-15T00:00:00.000Z'),
        paymentReference: `INV-2026-${randomSuffix}`,
        transactionId: `INV-2026-${randomSuffix}`,
        paymentMethod: 'None',
        remarks: 'December 2026 Tuition Assessment'
      });
      await feeDec.save();
      console.log('Created December 2026 fee:', feeDec._id, 'Total:', feeDec.totalAmount, 'Remaining:', feeDec.remainingAmount);
    } else {
      console.log('December 2026 fee already exists:', feeDec._id, 'Status:', feeDec.status, 'Remaining:', feeDec.remainingAmount);
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}
seed();
