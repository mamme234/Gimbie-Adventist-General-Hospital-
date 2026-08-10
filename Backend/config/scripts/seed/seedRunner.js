// Backend/config/scripts/seed/seedRunner.js

const User = require('../../../models/User');
const Doctor = require('../../../models/Doctor');
const Staff = require('../../../models/Staff');
const { getAllStaff } = require('./staffSeed');
const bcrypt = require('bcryptjs');

const seedStaff = async () => {
    try {
        console.log('🌱 Starting staff seed...');
        
        const allStaff = getAllStaff();
        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const staff of allStaff) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ email: staff.email });
                
                if (existingUser) {
                    console.log(`⏭️ Skipping ${staff.fullName} - already exists`);
                    skipped++;
                    continue;
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(staff.password, salt);

                // Create User - FIX: Map department to valid enum
                let department = staff.department;
                
                // Map department names to valid enum values
                const departmentMap = {
                    'Obstetrics & Gynecology': 'Obstetrics & Gynecology',
                    'IT': 'IT',
                    'Maintenance': 'Maintenance',
                    'Cleaning & Support': 'Cleaning & Support',
                    'Security': 'Security',
                    'General Practice': 'General Practice',
                    'Internal Medicine': 'Medical',
                };
                
                if (departmentMap[department]) {
                    department = departmentMap[department];
                }

                const user = await User.create({
                    fullName: staff.fullName,
                    email: staff.email,
                    password: hashedPassword,
                    phone: staff.phone,
                    role: staff.role,
                    department: department,
                    staffId: staff.staffId,
                    isActive: true,
                });

                console.log(`✅ Created user: ${staff.fullName} (${staff.role})`);

                // Create Staff record - FIX: Remove employeeNumber
                await Staff.create({
                    staffId: staff.staffId,
                    user: user._id,
                    position: staff.position,
                    department: department,
                    employmentType: 'Full-time',
                    startDate: new Date(),
                    status: 'Active',
                });

                // If doctor, create Doctor record
                if (staff.role === 'doctor' && staff.specialty) {
                    await Doctor.create({
                        userId: user._id,
                        specialty: staff.specialty || department,
                        licenseNumber: `LIC-${staff.staffId}`,
                        department: department,
                        isAvailable: true,
                        experience: 5,
                    });
                    console.log(`✅ Created doctor profile: ${staff.fullName} (${staff.specialty || department})`);
                }

                created++;

            } catch (error) {
                console.error(`❌ Error creating ${staff.fullName}:`, error.message);
                errors++;
            }
        }

        console.log('========================================');
        console.log('📊 STAFF SEED SUMMARY');
        console.log('========================================');
        console.log(`✅ Created: ${created} staff members`);
        console.log(`⏭️ Skipped: ${skipped} (already exists)`);
        console.log(`❌ Errors: ${errors}`);
        console.log('========================================');
        
        console.log('👨‍⚕️ SAMPLE CREDENTIALS:');
        console.log('📧 Admin: daniel.bekele@gimbiehospital.com');
        console.log('🔑 Password: Admin@2026#Secure$Gimbie');
        console.log('📧 Doctor: michael.abebe@gimbiehospital.com');
        console.log('🔑 Password: DrMike@GP2026#Gimbie!');
        console.log('========================================');

        return { created, skipped, errors };
        
    } catch (error) {
        console.error('❌ Staff seed failed:', error);
        throw error;
    }
};

module.exports = { seedStaff };
