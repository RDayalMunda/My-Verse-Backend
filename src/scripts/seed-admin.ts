import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: String,
    role: { type: String, required: true, enum: ['ADMIN', 'STAFF', 'PUBLIC'] },
    isActive: { type: Boolean, default: true },
    nsfwEnabled: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'users' },
);

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/my-verse';
  const email = process.env.ADMIN_EMAIL ?? 'admin@myverse.local';
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'change-me-before-deploy';

  await mongoose.connect(uri);

  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) {
    console.log('Admin user already exists — skipping seed.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await User.create({
    email: email.toLowerCase(),
    username,
    passwordHash,
    displayName: 'Admin',
    role: 'ADMIN',
    isActive: true,
    nsfwEnabled: true,
  });

  console.log(`Admin user created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
