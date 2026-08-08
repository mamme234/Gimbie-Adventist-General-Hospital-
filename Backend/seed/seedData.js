const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

// Load models
const User = require('../models/User');
const Department = require('../models/Department');
const Testimonial = require('../models/Testimonial');
const Bed = require('../models/Bed');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Department.deleteMany();
        await Testimonial.deleteMany();
        await Bed.deleteMany();

        console.log('🧹 Existing data cleared');

        // Create departments
        const departments = [
            { name: 'Administration', code: 'ADM', description: 'Hospital administration and management' },
            { name: 'Medical', code: 'MED', description: 'General medical services' },
            { name: 'Surgery', code: 'SUR', description: 'Surgical department' },
            { name: 'Pediatrics', code: 'PED', description: 'Children\'s healthcare' },
            { name: 'Obstetrics & Gynecology', code: 'OBG', description: 'Maternal and reproductive health' },
            { name: 'Emergency', code: 'EMR', description: 'Emergency and trauma care' },
            { name: 'Nursing', code: 'NUR', description: 'Nursing services' },
            { name: 'Pharmacy', code: 'PHA', description: 'Pharmaceutical services' },
            { name: 'Laboratory', code: 'LAB', description: 'Clinical laboratory services' },
            { name: 'Radiology', code: 'RAD', description: 'Diagnostic imaging' },
            { name: 'Finance', code: 'FIN', description: 'Financial management' },
            { name: 'HR', code: 'HR', description: 'Human resources' },
            { name: 'Inventory', code: 'INV', description: 'Inventory management' },
            { name: 'OPD', code: 'OPD', description: 'Outpatient department' },
            { name: 'Inpatient', code: 'INP', description: 'Inpatient services' },
            { name: 'Health Information', code: 'HIS', description: 'Health information services' },
            { name: 'Community Outreach', code: 'COM', description: 'Community health services' },
        ];

        for (const dept of departments) {
            await Department.create(dept);
        }
        console.log(`✅ Created ${departments.length} departments`);

        // Create admin user
        const adminPassword = await bcrypt.hash('Gimbie@2026Admin', 10);
        const admin = await User.create({
            fullName: 'System Administrator',
            email: 'admin@gimbiehospital.com',
            password: adminPassword,
            phone: '+251 77 710 0051',
            role: 'super_admin',
            staffId: 'GAH-SUP-001',
            isActive: true,
        });
        console.log(`✅ Created admin: ${admin.email}`);

        // Create testimonials
        const testimonials = [
            {
                patientName: 'Patient',
                location: 'Gimbi',
                rating: 5,
                comment: 'The staff were welcoming and professional, and my experience at the hospital was very good.',
            },
            {
                patientName: 'Patient',
                location: 'West Wollega',
                rating: 5,
                comment: 'The medical team explained the treatment clearly and treated me with respect.',
            },
            {
                patientName: 'Patient',
                location: 'Gimbi',
                rating: 5,
                comment: 'The hospital environment was comfortable, and the staff were helpful throughout my visit.',
            },
            {
                patientName: 'Patient',
                location: 'West Wollega',
                rating: 5,
                comment: 'I appreciated the friendly service and the attention given to patients.',
            },
            {
                patientName: 'Patient',
                location: 'Gimbi',
                rating: 5,
                comment: 'The appointment and consultation process was organized and easy to understand.',
            },
            {
                patientName: 'Patient',
                location: 'West Wollega',
                rating: 5,
                comment: 'The healthcare team showed kindness and professionalism throughout my visit.',
            },
        ];

        for (const testimonial of testimonials) {
            await Testimonial.create(testimonial);
        }
        console.log(`✅ Created ${testimonials.length} testimonials`);

        // Create beds
        const wards = ['Ward A', 'Ward B', 'Ward C', 'Maternity', 'Emergency'];
        const rooms = ['101', '102', '103', '201', '202', '203', '301', '302'];

        for (let i = 1; i <= 87; i++) {
            const ward = wards[i % wards.length];
            const room = rooms[i % rooms.length];
            await Bed.create({
                bedNumber: `BED-${String(i).padStart(3, '0')}`,
                ward: ward,
                room: room,
                floor: Math.floor(i / 20) + 1,
                building: 'Main Building',
                department: ward === 'Maternity' ? 'Obstetrics & Gynecology' : 'Inpatient',
                status: 'Available',
                isActive: true,
            });
        }
        console.log('✅ Created 87 beds');

        console.log('🎉 Database seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedData();
