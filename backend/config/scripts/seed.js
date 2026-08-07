// scripts/seed.js - FIXED
/**
 * ============================================
 * SEED.JS - Seed Database with Sample Data
 * ============================================
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');

// Sample data
const sampleData = {
  departments: [
    {
      departmentId: 'DEPT-2026-001',
      name: 'Cardiology',
      code: 'CAR',
      description: 'Comprehensive heart care including diagnosis, treatment, and prevention of cardiovascular diseases.',
      location: { wing: 'A', floor: '2', roomNumbers: ['201', '202', '203', '204'] },
      totalBeds: 40,
      availableBeds: 12,
      services: ['Heart Surgery', 'Angioplasty', 'Echocardiography', 'Cardiac Catheterization']
    },
    {
      departmentId: 'DEPT-2026-002',
      name: 'Neurology',
      code: 'NEU',
      description: 'Specialized care for disorders of the nervous system.',
      location: { wing: 'B', floor: '3', roomNumbers: ['301', '302', '303'] },
      totalBeds: 30,
      availableBeds: 8,
      services: ['Brain Surgery', 'Stroke Treatment', 'Spinal Surgery', 'Epilepsy Management']
    },
    {
      departmentId: 'DEPT-2026-003',
      name: 'Orthopedics',
      code: 'ORT',
      description: 'Treatment of musculoskeletal conditions.',
      location: { wing: 'C', floor: '1', roomNumbers: ['101', '102', '103'] },
      totalBeds: 35,
      availableBeds: 10,
      services: ['Joint Replacement', 'Fracture Treatment', 'Sports Medicine', 'Spine Surgery']
    },
    {
      departmentId: 'DEPT-2026-004',
      name: 'Pediatrics',
      code: 'PED',
      description: 'Comprehensive healthcare for children.',
      location: { wing: 'D', floor: '2', roomNumbers: ['401', '402', '403'] },
      totalBeds: 45,
      availableBeds: 15,
      services: ['Child Vaccination', 'Pediatric Surgery', 'Newborn Care', 'Adolescent Medicine']
    }
  ],
  users: [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gimbiehospital.com',
      password: 'Admin@2026',
      phone: '+251-911-000-000',
      role: 'admin',
      isVerified: true
    },
    {
      firstName: 'Samuel',
      lastName: 'Tekle',
      email: 'samuel.tekle@gimbiehospital.com',
      password: 'Doctor@2026',
      phone: '+251-911-234-567',
      role: 'doctor',
      isVerified: true
    },
    {
      firstName: 'Meron',
      lastName: 'Tesfaye',
      email: 'meron.t@gmail.com',
      password: 'Patient@2026',
      phone: '+251-911-234-568',
      role: 'patient',
      isVerified: true
    }
  ]
};

/**
 * Seed the database
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbie_hospital';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Department.deleteMany({}),
      Appointment.deleteMany({})
    ]);
    console.log('🗑️ Cleared existing data');

    // Create departments
    const departments = await Department.insertMany(sampleData.departments);
    console.log(`✅ Created ${departments.length} departments`);

    // Create users
    const users = [];
    for (const userData of sampleData.users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // Create doctor profile
    const doctorUser = users.find(u => u.role === 'doctor');
    if (doctorUser) {
      const doctor = new Doctor({
        userId: doctorUser._id,
        doctorId: 'DOC-2026-001',
        specialty: 'Interventional Cardiology',
        department: departments[0]._id,
        licenseNumber: 'LIC-2026-001',
        yearsOfExperience: 22,
        education: [
          { degree: 'MD', institution: 'Addis Ababa University', year: '2002' },
          { degree: 'FACC', institution: 'American College of Cardiology', year: '2010' }
        ],
        certifications: [
          { name: 'Board Certified in Cardiology', issuingAuthority: 'ABIM', date: new Date(2010, 0, 1) }
        ],
        consultationFee: 1500,
        isAvailable: true,
        bio: 'Expert in interventional cardiology with over 22 years of experience.'
      });
      await doctor.save();
      console.log('✅ Created doctor profile');
    }

    // Create patient profile
    const patientUser = users.find(u => u.role === 'patient');
    if (patientUser) {
      const patient = new Patient({
        userId: patientUser._id,
        patientId: 'PAT-2026-001',
        dateOfBirth: new Date(1985, 2, 15),
        gender: 'Female',
        bloodType: 'A+',
        maritalStatus: 'Married',
        address: {
          street: 'Bole Sub-city',
          city: 'Addis Ababa',
          country: 'Ethiopia'
        },
        emergencyContact: {
          name: 'Abel Tesfaye',
          relationship: 'Spouse',
          phone: '+251-911-234-569'
        },
        insurance: {
          provider: 'Ethiopian Insurance Corporation',
          policyNumber: 'EIC-2026-001234',
          planType: 'Comprehensive Health',
          expiryDate: new Date(2026, 11, 31)
        },
        status: 'Active'
      });
      await patient.save();
      console.log('✅ Created patient profile');
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
