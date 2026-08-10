// config/staff.js
// ============================================
// GIMBIE ADVENTIST GENERAL HOSPITAL
// HARDCODED STAFF CREDENTIALS
// ============================================

const STAFF_CREDENTIALS = {
    // ============================================
    // ADMINISTRATION
    // ============================================
    administrators: [
        {
            id: 'GAH-ADM-001',
            fullName: 'Dr. Daniel Bekele',
            email: 'daniel.bekele@gimbiehospital.com',
            password: 'Admin@2026#Secure$Gimbie',
            role: 'admin',
            department: 'Administration',
            employeeNumber: 'GAH-ADM-001',
            title: 'Hospital Administrator',
            phone: '+251911111101',
            isActive: true
        },
        {
            id: 'GAH-ADM-002',
            fullName: 'Hana Tadesse',
            email: 'hana.tadesse@gimbiehospital.com',
            password: 'Hana@Admin2026#Gimbie',
            role: 'admin',
            department: 'Administration',
            employeeNumber: 'GAH-ADM-002',
            title: 'Deputy Administrator',
            phone: '+251911111102',
            isActive: true
        },
        {
            id: 'GAH-ADM-003',
            fullName: 'Samuel Worku',
            email: 'samuel.worku@gimbiehospital.com',
            password: 'Samuel@Fin2026#Gimbie',
            role: 'admin',
            department: 'Finance',
            employeeNumber: 'GAH-FIN-001',
            title: 'Finance Manager',
            phone: '+251911111103',
            isActive: true
        },
        {
            id: 'GAH-ADM-004',
            fullName: 'Meron Alemu',
            email: 'meron.alemu@gimbiehospital.com',
            password: 'Meron@HR2026#Gimbie',
            role: 'admin',
            department: 'Human Resources',
            employeeNumber: 'GAH-HR-001',
            title: 'Human Resources Manager',
            phone: '+251911111104',
            isActive: true
        }
    ],

    // ============================================
    // MEDICAL DEPARTMENT (DOCTORS)
    // ============================================
    doctors: [
        {
            id: 'GAH-DR-001',
            fullName: 'Dr. Michael Abebe',
            email: 'michael.abebe@gimbiehospital.com',
            password: 'DrMike@GP2026#Gimbie!',
            role: 'doctor',
            department: 'General Medicine',
            employeeNumber: 'GAH-DR-001',
            title: 'General Practitioner',
            phone: '+251911111105',
            specialty: 'General Medicine',
            isActive: true
        },
        {
            id: 'GAH-DR-002',
            fullName: 'Dr. Daniel Kebede',
            email: 'daniel.kebede@gimbiehospital.com',
            password: 'Daniel@IM2026#Gimbie',
            role: 'doctor',
            department: 'Internal Medicine',
            employeeNumber: 'GAH-DR-002',
            title: 'Internal Medicine Specialist',
            phone: '+251911111106',
            specialty: 'Internal Medicine',
            isActive: true
        },
        {
            id: 'GAH-DR-003',
            fullName: 'Dr. Sarah Gemechu',
            email: 'sarah.gemechu@gimbiehospital.com',
            password: 'Sarah@Peds2026#Gimbie',
            role: 'doctor',
            department: 'Pediatrics',
            employeeNumber: 'GAH-DR-003',
            title: 'Pediatrician',
            phone: '+251911111107',
            specialty: 'Pediatrics',
            isActive: true
        },
        {
            id: 'GAH-DR-004',
            fullName: 'Dr. Elias Tadesse',
            email: 'elias.tadesse@gimbiehospital.com',
            password: 'Elias@Surg2026#Gimbie',
            role: 'doctor',
            department: 'Surgery',
            employeeNumber: 'GAH-DR-004',
            title: 'Surgeon',
            phone: '+251911111108',
            specialty: 'General Surgery',
            isActive: true
        },
        {
            id: 'GAH-DR-005',
            fullName: 'Dr. Ruth Bekele',
            email: 'ruth.bekele@gimbiehospital.com',
            password: 'Ruth@OBGYN2026#Gimbie',
            role: 'doctor',
            department: 'Obstetrics & Gynecology',
            employeeNumber: 'GAH-DR-005',
            title: 'Obstetrician & Gynecologist',
            phone: '+251911111109',
            specialty: 'Obstetrics & Gynecology',
            isActive: true
        },
        {
            id: 'GAH-DR-006',
            fullName: 'Dr. Samuel Girma',
            email: 'samuel.girma@gimbiehospital.com',
            password: 'Samuel@ER2026#Gimbie',
            role: 'doctor',
            department: 'Emergency',
            employeeNumber: 'GAH-DR-006',
            title: 'Emergency Physician',
            phone: '+251911111110',
            specialty: 'Emergency Medicine',
            isActive: true
        }
    ],

    // ============================================
    // NURSING DEPARTMENT
    // ============================================
    nurses: [
        {
            id: 'GAH-NUR-001',
            fullName: 'Almaz Tesfaye',
            email: 'almaz.tesfaye@gimbiehospital.com',
            password: 'Almaz@NurseMgr2026#Gimbie',
            role: 'nurse',
            department: 'Nursing',
            employeeNumber: 'GAH-NUR-001',
            title: 'Nurse Manager',
            phone: '+251911111111',
            isActive: true
        },
        {
            id: 'GAH-NUR-002',
            fullName: 'Hana Worku',
            email: 'hana.worku@gimbiehospital.com',
            password: 'Hana@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Emergency',
            employeeNumber: 'GAH-NUR-002',
            title: 'Emergency Nurse',
            phone: '+251911111112',
            isActive: true
        },
        {
            id: 'GAH-NUR-003',
            fullName: 'Meron Abate',
            email: 'meron.abate@gimbiehospital.com',
            password: 'Meron@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Emergency',
            employeeNumber: 'GAH-NUR-003',
            title: 'Emergency Nurse',
            phone: '+251911111113',
            isActive: true
        },
        {
            id: 'GAH-NUR-004',
            fullName: 'Daniel Fikadu',
            email: 'daniel.fikadu@gimbiehospital.com',
            password: 'Daniel@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Emergency',
            employeeNumber: 'GAH-NUR-004',
            title: 'Emergency Nurse',
            phone: '+251911111114',
            isActive: true
        },
        {
            id: 'GAH-NUR-005',
            fullName: 'Bethlehem Worku',
            email: 'bethlehem.worku@gimbiehospital.com',
            password: 'Beth@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Nursing',
            employeeNumber: 'GAH-NUR-005',
            title: 'Senior Nurse',
            phone: '+251911111115',
            isActive: true
        },
        {
            id: 'GAH-NUR-006',
            fullName: 'Selamawit Kebede',
            email: 'selamawit.kebede@gimbiehospital.com',
            password: 'Selam@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Nursing',
            employeeNumber: 'GAH-NUR-006',
            title: 'Nurse',
            phone: '+251911111116',
            isActive: true
        },
        {
            id: 'GAH-NUR-007',
            fullName: 'Rahel Gemechu',
            email: 'rahel.gemechu@gimbiehospital.com',
            password: 'Rahel@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Nursing',
            employeeNumber: 'GAH-NUR-007',
            title: 'Nurse',
            phone: '+251911111117',
            isActive: true
        },
        {
            id: 'GAH-NUR-008',
            fullName: 'Tigist Abebe',
            email: 'tigist.abebe@gimbiehospital.com',
            password: 'Tigist@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Nursing',
            employeeNumber: 'GAH-NUR-008',
            title: 'Nurse',
            phone: '+251911111118',
            isActive: true
        },
        {
            id: 'GAH-NUR-009',
            fullName: 'Eden Tadesse',
            email: 'eden.tadesse@gimbiehospital.com',
            password: 'Eden@Nurse2026#Gimbie',
            role: 'nurse',
            department: 'Nursing',
            employeeNumber: 'GAH-NUR-009',
            title: 'Nurse',
            phone: '+251911111119',
            isActive: true
        },
        {
            id: 'GAH-NUR-010',
            fullName: 'Meron Kebede',
            email: 'meron.kebede@gimbiehospital.com',
            password: 'Meron@Peds2026#Gimbie',
            role: 'nurse',
            department: 'Pediatrics',
            employeeNumber: 'GAH-NUR-010',
            title: 'Pediatric Nurse',
            phone: '+251911111120',
            isActive: true
        },
        {
            id: 'GAH-NUR-011',
            fullName: 'Hana Alemu',
            email: 'hana.alemu@gimbiehospital.com',
            password: 'Hana@Peds2026#Gimbie',
            role: 'nurse',
            department: 'Pediatrics',
            employeeNumber: 'GAH-NUR-011',
            title: 'Pediatric Nurse',
            phone: '+251911111121',
            isActive: true
        },
        {
            id: 'GAH-NUR-012',
            fullName: 'Samuel Abebe',
            email: 'samuel.abebe@gimbiehospital.com',
            password: 'Samuel@Surg2026#Gimbie',
            role: 'nurse',
            department: 'Surgery',
            employeeNumber: 'GAH-NUR-012',
            title: 'Surgical Nurse',
            phone: '+251911111122',
            isActive: true
        },
        {
            id: 'GAH-NUR-013',
            fullName: 'Bethlehem Girma',
            email: 'bethlehem.girma@gimbiehospital.com',
            password: 'Beth@Surg2026#Gimbie',
            role: 'nurse',
            department: 'Surgery',
            employeeNumber: 'GAH-NUR-013',
            title: 'Surgical Nurse',
            phone: '+251911111123',
            isActive: true
        },
        {
            id: 'GAH-NUR-014',
            fullName: 'Daniel Worku',
            email: 'daniel.worku@gimbiehospital.com',
            password: 'Daniel@Surg2026#Gimbie',
            role: 'nurse',
            department: 'Surgery',
            employeeNumber: 'GAH-NUR-014',
            title: 'Anesthesia Professional',
            phone: '+251911111124',
            isActive: true
        },
        {
            id: 'GAH-NUR-015',
            fullName: 'Almaz Kebede',
            email: 'almaz.kebede@gimbiehospital.com',
            password: 'Almaz@Ward2026#Gimbie',
            role: 'nurse',
            department: 'Inpatient',
            employeeNumber: 'GAH-NUR-015',
            title: 'Ward Manager',
            phone: '+251911111125',
            isActive: true
        },
        {
            id: 'GAH-NUR-016',
            fullName: 'Hanna Abebe',
            email: 'hanna.abebe@gimbiehospital.com',
            password: 'Hanna@Ward2026#Gimbie',
            role: 'nurse',
            department: 'Inpatient',
            employeeNumber: 'GAH-NUR-016',
            title: 'Senior Nurse',
            phone: '+251911111126',
            isActive: true
        },
        {
            id: 'GAH-NUR-017',
            fullName: 'Selam Girma',
            email: 'selam.girma@gimbiehospital.com',
            password: 'Selam@Ward2026#Gimbie',
            role: 'nurse',
            department: 'Inpatient',
            employeeNumber: 'GAH-NUR-017',
            title: 'Nurse',
            phone: '+251911111127',
            isActive: true
        },
        {
            id: 'GAH-NUR-018',
            fullName: 'Bethlehem Tadesse',
            email: 'bethlehem.tadesse@gimbiehospital.com',
            password: 'Beth@Ward2026#Gimbie',
            role: 'nurse',
            department: 'Inpatient',
            employeeNumber: 'GAH-NUR-018',
            title: 'Nurse',
            phone: '+251911111128',
            isActive: true
        },
        {
            id: 'GAH-NUR-019',
            fullName: 'Rahel Worku',
            email: 'rahel.worku@gimbiehospital.com',
            password: 'Rahel@Ward2026#Gimbie',
            role: 'nurse',
            department: 'Inpatient',
            employeeNumber: 'GAH-NUR-019',
            title: 'Nurse',
            phone: '+251911111129',
            isActive: true
        },
        {
            id: 'GAH-NUR-020',
            fullName: 'Tigist Tadesse',
            email: 'tigist.tadesse@gimbiehospital.com',
            password: 'Tigist@OPD2026#Gimbie',
            role: 'nurse',
            department: 'OPD',
            employeeNumber: 'GAH-NUR-020',
            title: 'OPD Nurse',
            phone: '+251911111130',
            isActive: true
        }
    ],

    // ============================================
    // MIDWIVES
    // ============================================
    midwives: [
        {
            id: 'GAH-MID-001',
            fullName: 'Hanna Girma',
            email: 'hanna.girma@gimbiehospital.com',
            password: 'Hanna@Mid2026#Gimbie',
            role: 'nurse',
            department: 'Maternity',
            employeeNumber: 'GAH-MID-001',
            title: 'Midwife',
            phone: '+251911111131',
            isActive: true
        },
        {
            id: 'GAH-MID-002',
            fullName: 'Rahel Tadesse',
            email: 'rahel.tadesse@gimbiehospital.com',
            password: 'Rahel@Mid2026#Gimbie',
            role: 'nurse',
            department: 'Maternity',
            employeeNumber: 'GAH-MID-002',
            title: 'Midwife',
            phone: '+251911111132',
            isActive: true
        },
        {
            id: 'GAH-MID-003',
            fullName: 'Selam Abebe',
            email: 'selam.abebe@gimbiehospital.com',
            password: 'Selam@Mid2026#Gimbie',
            role: 'nurse',
            department: 'Maternity',
            employeeNumber: 'GAH-MID-003',
            title: 'Midwife',
            phone: '+251911111133',
            isActive: true
        }
    ],

    // ============================================
    // LABORATORY
    // ============================================
    laboratory: [
        {
            id: 'GAH-LAB-001',
            fullName: 'Fitsum Bekele',
            email: 'fitsum.bekele@gimbiehospital.com',
            password: 'Fitsum@Lab2026#Gimbie',
            role: 'lab_technician',
            department: 'Laboratory',
            employeeNumber: 'GAH-LAB-001',
            title: 'Lab Manager',
            phone: '+251911111134',
            isActive: true
        },
        {
            id: 'GAH-LAB-002',
            fullName: 'Abel Tadesse',
            email: 'abel.tadesse@gimbiehospital.com',
            password: 'Abel@Lab2026#Gimbie',
            role: 'lab_technician',
            department: 'Laboratory',
            employeeNumber: 'GAH-LAB-002',
            title: 'Laboratory Technologist',
            phone: '+251911111135',
            isActive: true
        },
        {
            id: 'GAH-LAB-003',
            fullName: 'Meron Girma',
            email: 'meron.girma@gimbiehospital.com',
            password: 'Meron@Lab2026#Gimbie',
            role: 'lab_technician',
            department: 'Laboratory',
            employeeNumber: 'GAH-LAB-003',
            title: 'Laboratory Technologist',
            phone: '+251911111136',
            isActive: true
        },
        {
            id: 'GAH-LAB-004',
            fullName: 'Hana Worku',
            email: 'hana.worku.lab@gimbiehospital.com',
            password: 'Hana@Lab2026#Gimbie',
            role: 'lab_technician',
            department: 'Laboratory',
            employeeNumber: 'GAH-LAB-004',
            title: 'Laboratory Technician',
            phone: '+251911111137',
            isActive: true
        }
    ],

    // ============================================
    // RADIOLOGY
    // ============================================
    radiology: [
        {
            id: 'GAH-RAD-001',
            fullName: 'Dawit Kebede',
            email: 'dawit.kebede@gimbiehospital.com',
            password: 'Dawit@Rad2026#Gimbie',
            role: 'radiologist',
            department: 'Radiology',
            employeeNumber: 'GAH-RAD-001',
            title: 'Radiology Manager',
            phone: '+251911111138',
            isActive: true
        },
        {
            id: 'GAH-RAD-002',
            fullName: 'Samuel Tadesse',
            email: 'samuel.tadesse@gimbiehospital.com',
            password: 'Samuel@Rad2026#Gimbie',
            role: 'radiologist',
            department: 'Radiology',
            employeeNumber: 'GAH-RAD-002',
            title: 'Radiographer',
            phone: '+251911111139',
            isActive: true
        },
        {
            id: 'GAH-RAD-003',
            fullName: 'Ruth Alemu',
            email: 'ruth.alemu@gimbiehospital.com',
            password: 'Ruth@Rad2026#Gimbie',
            role: 'radiologist',
            department: 'Radiology',
            employeeNumber: 'GAH-RAD-003',
            title: 'Radiographer',
            phone: '+251911111140',
            isActive: true
        }
    ],

    // ============================================
    // PHARMACY
    // ============================================
    pharmacy: [
        {
            id: 'GAH-PHA-001',
            fullName: 'Elias Bekele',
            email: 'elias.bekele@gimbiehospital.com',
            password: 'Elias@Pharm2026#Gimbie',
            role: 'pharmacist',
            department: 'Pharmacy',
            employeeNumber: 'GAH-PHA-001',
            title: 'Chief Pharmacist',
            phone: '+251911111141',
            isActive: true
        },
        {
            id: 'GAH-PHA-002',
            fullName: 'Hana Gemechu',
            email: 'hana.gemechu@gimbiehospital.com',
            password: 'Hana@Pharm2026#Gimbie',
            role: 'pharmacist',
            department: 'Pharmacy',
            employeeNumber: 'GAH-PHA-002',
            title: 'Pharmacist',
            phone: '+251911111142',
            isActive: true
        },
        {
            id: 'GAH-PHA-003',
            fullName: 'Meron Tadesse',
            email: 'meron.tadesse@gimbiehospital.com',
            password: 'Meron@Pharm2026#Gimbie',
            role: 'pharmacist',
            department: 'Pharmacy',
            employeeNumber: 'GAH-PHA-003',
            title: 'Pharmacy Technician',
            phone: '+251911111143',
            isActive: true
        },
        {
            id: 'GAH-PHA-004',
            fullName: 'Selam Worku',
            email: 'selam.worku@gimbiehospital.com',
            password: 'Selam@Pharm2026#Gimbie',
            role: 'pharmacist',
            department: 'Pharmacy',
            employeeNumber: 'GAH-PHA-004',
            title: 'Pharmacy Technician',
            phone: '+251911111144',
            isActive: true
        }
    ],

    // ============================================
    // RECEPTION & OPD
    // ============================================
    reception: [
        {
            id: 'GAH-REC-001',
            fullName: 'Daniel Girma',
            email: 'daniel.girma@gimbiehospital.com',
            password: 'Daniel@Rec2026#Gimbie',
            role: 'receptionist',
            department: 'OPD',
            employeeNumber: 'GAH-REC-001',
            title: 'OPD Coordinator',
            phone: '+251911111145',
            isActive: true
        },
        {
            id: 'GAH-REC-002',
            fullName: 'Rahel Bekele',
            email: 'rahel.bekele@gimbiehospital.com',
            password: 'Rahel@Rec2026#Gimbie',
            role: 'receptionist',
            department: 'OPD',
            employeeNumber: 'GAH-REC-002',
            title: 'Receptionist',
            phone: '+251911111146',
            isActive: true
        },
        {
            id: 'GAH-REC-003',
            fullName: 'Eden Worku',
            email: 'eden.worku@gimbiehospital.com',
            password: 'Eden@Rec2026#Gimbie',
            role: 'receptionist',
            department: 'OPD',
            employeeNumber: 'GAH-REC-003',
            title: 'Receptionist',
            phone: '+251911111147',
            isActive: true
        }
    ],

    // ============================================
    // FINANCE
    // ============================================
    finance: [
        {
            id: 'GAH-FIN-001',
            fullName: 'Samuel Worku',
            email: 'samuel.worku.fin@gimbiehospital.com',
            password: 'Samuel@Fin2026#Gimbie',
            role: 'admin',
            department: 'Finance',
            employeeNumber: 'GAH-FIN-001',
            title: 'Finance Manager',
            phone: '+251911111148',
            isActive: true
        },
        {
            id: 'GAH-FIN-002',
            fullName: 'Meron Abebe',
            email: 'meron.abebe.fin@gimbiehospital.com',
            password: 'Meron@Fin2026#Gimbie',
            role: 'admin',
            department: 'Finance',
            employeeNumber: 'GAH-FIN-002',
            title: 'Accountant',
            phone: '+251911111149',
            isActive: true
        },
        {
            id: 'GAH-FIN-003',
            fullName: 'Hana Tadesse',
            email: 'hana.tadesse.fin@gimbiehospital.com',
            password: 'Hana@Fin2026#Gimbie',
            role: 'admin',
            department: 'Finance',
            employeeNumber: 'GAH-FIN-003',
            title: 'Cashier',
            phone: '+251911111150',
            isActive: true
        },
        {
            id: 'GAH-FIN-004',
            fullName: 'Daniel Kebede',
            email: 'daniel.kebede.fin@gimbiehospital.com',
            password: 'Daniel@Fin2026#Gimbie',
            role: 'admin',
            department: 'Finance',
            employeeNumber: 'GAH-FIN-004',
            title: 'Billing Officer',
            phone: '+251911111151',
            isActive: true
        }
    ],

    // ============================================
    // HUMAN RESOURCES
    // ============================================
    humanResources: [
        {
            id: 'GAH-HR-001',
            fullName: 'Meron Alemu',
            email: 'meron.alemu.hr@gimbiehospital.com',
            password: 'Meron@HR2026#Gimbie',
            role: 'admin',
            department: 'Human Resources',
            employeeNumber: 'GAH-HR-001',
            title: 'HR Manager',
            phone: '+251911111152',
            isActive: true
        },
        {
            id: 'GAH-HR-002',
            fullName: 'Selam Bekele',
            email: 'selam.bekele@gimbiehospital.com',
            password: 'Selam@HR2026#Gimbie',
            role: 'admin',
            department: 'Human Resources',
            employeeNumber: 'GAH-HR-002',
            title: 'HR Officer',
            phone: '+251911111153',
            isActive: true
        },
        {
            id: 'GAH-HR-003',
            fullName: 'Eden Gemechu',
            email: 'eden.gemechu@gimbiehospital.com',
            password: 'Eden@HR2026#Gimbie',
            role: 'admin',
            department: 'Human Resources',
            employeeNumber: 'GAH-HR-003',
            title: 'HR Assistant',
            phone: '+251911111154',
            isActive: true
        }
    ],

    // ============================================
    // HEALTH INFORMATION
    // ============================================
    healthInformation: [
        {
            id: 'GAH-HIM-001',
            fullName: 'Dawit Abebe',
            email: 'dawit.abebe@gimbiehospital.com',
            password: 'Dawit@HIM2026#Gimbie',
            role: 'admin',
            department: 'Health Information',
            employeeNumber: 'GAH-HIM-001',
            title: 'Health Information Manager',
            phone: '+251911111155',
            isActive: true
        },
        {
            id: 'GAH-HIM-002',
            fullName: 'Rahel Tadesse',
            email: 'rahel.tadesse.him@gimbiehospital.com',
            password: 'Rahel@HIM2026#Gimbie',
            role: 'admin',
            department: 'Health Information',
            employeeNumber: 'GAH-HIM-002',
            title: 'Medical Records Officer',
            phone: '+251911111156',
            isActive: true
        },
        {
            id: 'GAH-HIM-003',
            fullName: 'Samuel Girma',
            email: 'samuel.girma.him@gimbiehospital.com',
            password: 'Samuel@HIM2026#Gimbie',
            role: 'admin',
            department: 'Health Information',
            employeeNumber: 'GAH-HIM-003',
            title: 'Data Clerk',
            phone: '+251911111157',
            isActive: true
        }
    ],

    // ============================================
    // INVENTORY & PROCUREMENT
    // ============================================
    inventory: [
        {
            id: 'GAH-INV-001',
            fullName: 'Elias Worku',
            email: 'elias.worku@gimbiehospital.com',
            password: 'Elias@Proc2026#Gimbie',
            role: 'admin',
            department: 'Procurement',
            employeeNumber: 'GAH-INV-001',
            title: 'Procurement Manager',
            phone: '+251911111158',
            isActive: true
        },
        {
            id: 'GAH-INV-002',
            fullName: 'Fitsum Tadesse',
            email: 'fitsum.tadesse@gimbiehospital.com',
            password: 'Fitsum@Inv2026#Gimbie',
            role: 'admin',
            department: 'Inventory',
            employeeNumber: 'GAH-INV-002',
            title: 'Inventory Manager',
            phone: '+251911111159',
            isActive: true
        },
        {
            id: 'GAH-INV-003',
            fullName: 'Daniel Alemu',
            email: 'daniel.alemu@gimbiehospital.com',
            password: 'Daniel@Inv2026#Gimbie',
            role: 'admin',
            department: 'Inventory',
            employeeNumber: 'GAH-INV-003',
            title: 'Storekeeper',
            phone: '+251911111160',
            isActive: true
        },
        {
            id: 'GAH-INV-004',
            fullName: 'Hana Kebede',
            email: 'hana.kebede@gimbiehospital.com',
            password: 'Hana@Proc2026#Gimbie',
            role: 'admin',
            department: 'Procurement',
            employeeNumber: 'GAH-INV-004',
            title: 'Procurement Officer',
            phone: '+251911111161',
            isActive: true
        }
    ],

    // ============================================
    // IT DEPARTMENT
    // ============================================
    it: [
        {
            id: 'GAH-IT-001',
            fullName: 'Abel Gemechu',
            email: 'abel.gemechu@gimbiehospital.com',
            password: 'Abel@IT2026#Gimbie',
            role: 'admin',
            department: 'IT',
            employeeNumber: 'GAH-IT-001',
            title: 'IT Manager',
            phone: '+251911111162',
            isActive: true
        },
        {
            id: 'GAH-IT-002',
            fullName: 'Michael Tadesse',
            email: 'michael.tadesse@gimbiehospital.com',
            password: 'Michael@IT2026#Gimbie',
            role: 'admin',
            department: 'IT',
            employeeNumber: 'GAH-IT-002',
            title: 'System Administrator',
            phone: '+251911111163',
            isActive: true
        },
        {
            id: 'GAH-IT-003',
            fullName: 'Ruth Worku',
            email: 'ruth.worku@gimbiehospital.com',
            password: 'Ruth@IT2026#Gimbie',
            role: 'admin',
            department: 'IT',
            employeeNumber: 'GAH-IT-003',
            title: 'IT Support Officer',
            phone: '+251911111164',
            isActive: true
        }
    ],

    // ============================================
    // MAINTENANCE
    // ============================================
    maintenance: [
        {
            id: 'GAH-MNT-001',
            fullName: 'Tesfaye Bekele',
            email: 'tesfaye.bekele@gimbiehospital.com',
            password: 'Tesfaye@Mnt2026#Gimbie',
            role: 'staff',
            department: 'Maintenance',
            employeeNumber: 'GAH-MNT-001',
            title: 'Maintenance Manager',
            phone: '+251911111165',
            isActive: true
        },
        {
            id: 'GAH-MNT-002',
            fullName: 'Daniel Abate',
            email: 'daniel.abate@gimbiehospital.com',
            password: 'Daniel@Mnt2026#Gimbie',
            role: 'staff',
            department: 'Maintenance',
            employeeNumber: 'GAH-MNT-002',
            title: 'Maintenance Technician',
            phone: '+251911111166',
            isActive: true
        },
        {
            id: 'GAH-MNT-003',
            fullName: 'Samuel Alemu',
            email: 'samuel.alemu@gimbiehospital.com',
            password: 'Samuel@Mnt2026#Gimbie',
            role: 'staff',
            department: 'Maintenance',
            employeeNumber: 'GAH-MNT-003',
            title: 'Electrician',
            phone: '+251911111167',
            isActive: true
        },
        {
            id: 'GAH-MNT-004',
            fullName: 'Elias Girma',
            email: 'elias.girma@gimbiehospital.com',
            password: 'Elias@Mnt2026#Gimbie',
            role: 'staff',
            department: 'Maintenance',
            employeeNumber: 'GAH-MNT-004',
            title: 'General Technician',
            phone: '+251911111168',
            isActive: true
        }
    ],

    // ============================================
    // CLEANING & SUPPORT
    // ============================================
    cleaning: [
        {
            id: 'GAH-CLN-001',
            fullName: 'Hana Abebe',
            email: 'hana.abebe.clean@gimbiehospital.com',
            password: 'Hana@Cln2026#Gimbie',
            role: 'staff',
            department: 'Cleaning',
            employeeNumber: 'GAH-CLN-001',
            title: 'Cleaning Supervisor',
            phone: '+251911111169',
            isActive: true
        },
        {
            id: 'GAH-CLN-002',
            fullName: 'Selam Tadesse',
            email: 'selam.tadesse.clean@gimbiehospital.com',
            password: 'Selam@Cln2026#Gimbie',
            role: 'staff',
            department: 'Cleaning',
            employeeNumber: 'GAH-CLN-002',
            title: 'Cleaner',
            phone: '+251911111170',
            isActive: true
        },
        {
            id: 'GAH-CLN-003',
            fullName: 'Rahel Alemu',
            email: 'rahel.alemu.clean@gimbiehospital.com',
            password: 'Rahel@Cln2026#Gimbie',
            role: 'staff',
            department: 'Cleaning',
            employeeNumber: 'GAH-CLN-003',
            title: 'Cleaner',
            phone: '+251911111171',
            isActive: true
        },
        {
            id: 'GAH-CLN-004',
            fullName: 'Bethlehem Worku',
            email: 'bethlehem.worku.clean@gimbiehospital.com',
            password: 'Beth@Cln2026#Gimbie',
            role: 'staff',
            department: 'Cleaning',
            employeeNumber: 'GAH-CLN-004',
            title: 'Support Staff',
            phone: '+251911111172',
            isActive: true
        }
    ],

    // ============================================
    // SECURITY
    // ============================================
    security: [
        {
            id: 'GAH-SEC-001',
            fullName: 'Gemechu Bekele',
            email: 'gemechu.bekele@gimbiehospital.com',
            password: 'Gemechu@Sec2026#Gimbie',
            role: 'staff',
            department: 'Security',
            employeeNumber: 'GAH-SEC-001',
            title: 'Security Supervisor',
            phone: '+251911111173',
            isActive: true
        },
        {
            id: 'GAH-SEC-002',
            fullName: 'Daniel Tadesse',
            email: 'daniel.tadesse.sec@gimbiehospital.com',
            password: 'Daniel@Sec2026#Gimbie',
            role: 'staff',
            department: 'Security',
            employeeNumber: 'GAH-SEC-002',
            title: 'Security Officer',
            phone: '+251911111174',
            isActive: true
        },
        {
            id: 'GAH-SEC-003',
            fullName: 'Samuel Abebe',
            email: 'samuel.abebe.sec@gimbiehospital.com',
            password: 'Samuel@Sec2026#Gimbie',
            role: 'staff',
            department: 'Security',
            employeeNumber: 'GAH-SEC-003',
            title: 'Security Officer',
            phone: '+251911111175',
            isActive: true
        },
        {
            id: 'GAH-SEC-004',
            fullName: 'Elias Worku',
            email: 'elias.worku.sec@gimbiehospital.com',
            password: 'Elias@Sec2026#Gimbie',
            role: 'staff',
            department: 'Security',
            employeeNumber: 'GAH-SEC-004',
            title: 'Security Officer',
            phone: '+251911111176',
            isActive: true
        }
    ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all staff members
function getAllStaff() {
    const allStaff = [];
    Object.values(STAFF_CREDENTIALS).forEach(staffArray => {
        allStaff.push(...staffArray);
    });
    return allStaff;
}

// Get all staff by role
function getStaffByRole(role) {
    const allStaff = getAllStaff();
    return allStaff.filter(staff => staff.role === role);
}

// Get all staff by department
function getStaffByDepartment(department) {
    const allStaff = getAllStaff();
    return allStaff.filter(staff => staff.department === department);
}

// Find staff by email
function findStaffByEmail(email) {
    const allStaff = getAllStaff();
    return allStaff.find(staff => staff.email.toLowerCase() === email.toLowerCase()) || null;
}

// Validate login credentials
function validateCredentials(email, password) {
    const staff = findStaffByEmail(email);
    if (!staff) return null;
    if (staff.password !== password) return null;
    if (!staff.isActive) return null;
    return staff;
}

// Get staff payload for JWT
function getStaffPayload(staff) {
    return {
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email,
        role: staff.role,
        department: staff.department,
        employeeNumber: staff.employeeNumber,
        title: staff.title,
        phone: staff.phone,
        specialty: staff.specialty || null
    };
}

// Get login credentials for frontend display
function getLoginCredentials() {
    return {
        admin: [
            {
                email: 'daniel.bekele@gimbiehospital.com',
                password: 'Admin@2026#Secure$Gimbie',
                role: 'admin',
                fullName: 'Dr. Daniel Bekele'
            }
        ],
        doctor: [
            {
                email: 'michael.abebe@gimbiehospital.com',
                password: 'DrMike@GP2026#Gimbie!',
                role: 'doctor',
                fullName: 'Dr. Michael Abebe'
            }
        ],
        nurse: [
            {
                email: 'almaz.tesfaye@gimbiehospital.com',
                password: 'Almaz@NurseMgr2026#Gimbie',
                role: 'nurse',
                fullName: 'Almaz Tesfaye'
            }
        ]
    };
}

// ============================================
// EXPORT
// ============================================
module.exports = {
    STAFF_CREDENTIALS,
    getAllStaff,
    getStaffByRole,
    getStaffByDepartment,
    findStaffByEmail,
    validateCredentials,
    getStaffPayload,
    getLoginCredentials
};
