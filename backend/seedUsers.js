import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unisync';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Seeding...');

    const demoUsers = [
      { name: 'Aryan(Student)', email: 'student1@unisync.ai', password: 'demo123', role: 'student' },
      { name: 'Rohan(Student)', email: 'student2@unisync.ai', password: 'demo123', role: 'student' },
      { name: 'Ujwal(Student)', email: 'student3@unisync.ai', password: 'demo123', role: 'student' },
      { name: 'Professor Smith(Admin)', email: 'admin1@unisync.ai', password: 'admin123', role: 'admin' },
      { name: 'Organizer Admin(Admin)', email: 'admin2@unisync.ai', password: 'admin123', role: 'admin' }
    ];

    let seededCount = 0;
    for (const u of demoUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        // Hash password before seeding
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await User.create({ ...u, password: hashedPassword });
        console.log(`Seeded: ${u.email}`);
        seededCount++;
      } else {
        // Update existing user with hashed password if it's still plain (migration)
        const hashedPassword = await bcrypt.hash(u.password, 10);
        existing.password = hashedPassword;
        await existing.save();
        console.log(`Updated to Hashed: ${u.email}`);
      }
    }

    console.log(`\nSuccessfully seeded ${seededCount} new demo accounts.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
};

seedUsers();
