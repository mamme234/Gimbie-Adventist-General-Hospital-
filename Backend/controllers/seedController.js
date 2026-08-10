// controllers/seedController.js
const User = require('../models/User');
const Staff = require('../models/Staff');
const Doctor = require('../models/Doctor');
const { getAllStaff, getStaffByDepartment, getStaffById } = require('../config/scripts/seed/staffSeed');
const bcrypt = require('bcryptjs');

// ============================================
// SEED ALL STAFF
// ============================================
exports.seedAllStaff = async (req, res) => {
    try {
        const allStaff = getAllStaff();
        let created = 0;
        let skipped = 0;
        let errors = 0;
        const results = [];
        const errorDetails = [];

        console.log(`🌱 Starting staff seed for ${allStaff.length} staff members...`);

        for (const staff of allStaff) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ email: staff.email });
                
                if (existingUser) {
                    results.push({ 
                        name: staff.fullName, 
                        email: staff.email,
                        status: 'skipped', 
                        message: 'Already exists' 
                    });
                    skipped++;
                    continue;
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(staff.password, salt);

                // Create User
                const user = await User.create({
                    fullName: staff.fullName,
                    email: staff.email,
                    password: hashedPassword,
                    phone: staff.phone,
                    role: staff.role,
                    department: staff.department,
                    staffId: staff.staffId,
                    isActive: true,
                });

                results.push({ 
                    name: staff.fullName, 
                    email: staff.email,
                    status: 'created', 
                    message: 'User created successfully' 
                });

                // Create Staff record
                await Staff.create({
                    staffId: staff.staffId,
                    user: user._id,
                    position: staff.position,
                    department: staff.department,
                    employmentType: 'Full-time',
                    startDate: new Date(),
                    status: 'Active',
                });

                // If doctor, create Doctor record
                if (staff.role === 'doctor' && staff.specialty) {
                    await Doctor.create({
                        userId: user._id,
                        specialty: staff.specialty,
                        licenseNumber: `LIC-${staff.staffId}`,
                        department: staff.department,
                        isAvailable: true,
                        experience: 5,
                    });
                }

                created++;

            } catch (error) {
                results.push({ 
                    name: staff.fullName, 
                    email: staff.email,
                    status: 'error', 
                    message: error.message 
                });
                errorDetails.push({
                    name: staff.fullName,
                    email: staff.email,
                    error: error.message
                });
                errors++;
            }
        }

        console.log(`✅ Staff seed completed: ${created} created, ${skipped} skipped, ${errors} errors`);

        res.status(200).json({
            success: true,
            message: 'Staff seeding completed',
            summary: {
                created,
                skipped,
                errors,
                total: allStaff.length
            },
            results,
            errorDetails: errorDetails.length > 0 ? errorDetails : undefined
        });

    } catch (error) {
        console.error('❌ Seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// SEED BY DEPARTMENT
// ============================================
exports.seedByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const staffList = getStaffByDepartment(department);

        if (!staffList || staffList.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No staff found for department: ${department}`
            });
        }

        let created = 0;
        let skipped = 0;
        let errors = 0;
        const results = [];

        for (const staff of staffList) {
            try {
                const existingUser = await User.findOne({ email: staff.email });
                
                if (existingUser) {
                    results.push({ 
                        name: staff.fullName, 
                        status: 'skipped', 
                        message: 'Already exists' 
                    });
                    skipped++;
                    continue;
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(staff.password, salt);

                const user = await User.create({
                    fullName: staff.fullName,
                    email: staff.email,
                    password: hashedPassword,
                    phone: staff.phone,
                    role: staff.role,
                    department: staff.department,
                    staffId: staff.staffId,
                    isActive: true,
                });

                results.push({ 
                    name: staff.fullName, 
                    status: 'created', 
                    message: 'User created' 
                });

                await Staff.create({
                    staffId: staff.staffId,
                    user: user._id,
                    position: staff.position,
                    department: staff.department,
                    employmentType: 'Full-time',
                    startDate: new Date(),
                    status: 'Active',
                });

                if (staff.role === 'doctor' && staff.specialty) {
                    await Doctor.create({
                        userId: user._id,
                        specialty: staff.specialty,
                        licenseNumber: `LIC-${staff.staffId}`,
                        department: staff.department,
                        isAvailable: true,
                        experience: 5,
                    });
                }

                created++;

            } catch (error) {
                results.push({ 
                    name: staff.fullName, 
                    status: 'error', 
                    message: error.message 
                });
                errors++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Staff seeding completed for department: ${department}`,
            summary: {
                created,
                skipped,
                errors,
                total: staffList.length
            },
            results
        });

    } catch (error) {
        console.error('❌ Seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// SEED SINGLE STAFF
// ============================================
exports.seedSingleStaff = async (req, res) => {
    try {
        const { email, fullName, password, phone, role, department, staffId, position, specialty } = req.body;

        // Validate required fields
        if (!email || !fullName || !password || !phone || !role || !department) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, fullName, password, phone, role, department'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: `User with email ${email} already exists`
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            phone,
            role,
            department,
            staffId: staffId || `GAH-${role.toUpperCase()}-${Date.now().toString().slice(-4)}`,
            isActive: true,
        });

        // Create Staff record
        await Staff.create({
            staffId: user.staffId,
            user: user._id,
            position: position || fullName,
            department,
            employmentType: 'Full-time',
            startDate: new Date(),
            status: 'Active',
        });

        // If doctor, create Doctor record
        if (role === 'doctor' && specialty) {
            await Doctor.create({
                userId: user._id,
                specialty,
                licenseNumber: `LIC-${user.staffId}`,
                department,
                isAvailable: true,
                experience: 5,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                staffId: user.staffId
            }
        });

    } catch (error) {
        console.error('❌ Seed single staff error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
