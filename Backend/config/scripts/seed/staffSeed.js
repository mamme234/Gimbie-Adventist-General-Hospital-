/**
 * GIMBIE ADVENTIST GENERAL HOSPITAL
 * Complete Staff Directory Seed Data
 * 
 * All staff members with:
 * - Full names
 * - Positions
 * - Departments
 * - Staff IDs
 * - Roles
 * - Email addresses (auto-generated)
 * - STRONG passwords (12+ characters with symbols)
 */

const staffData = {
  // ============================================
  // ADMINISTRATION
  // ============================================
  administration: [
    {
      fullName: 'Dr. Daniel Bekele',
      position: 'Hospital Administrator',
      department: 'Administration',
      role: 'admin',
      staffId: 'GAH-ADM-001',
      email: 'daniel.bekele@gimbiehospital.com',
      phone: '+251 91 111 1111',
      password: 'Admin@2026#Secure$Gimbie'
    },
    {
      fullName: 'Hana Tadesse',
      position: 'Deputy Administrator',
      department: 'Administration',
      role: 'admin',
      staffId: 'GAH-ADM-002',
      email: 'hana.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1112',
      password: 'Hana#Admin@2026!Gimbie'
    },
    {
      fullName: 'Samuel Worku',
      position: 'Finance Manager',
      department: 'Administration',
      role: 'admin',
      staffId: 'GAH-ADM-003',
      email: 'samuel.worku@gimbiehospital.com',
      phone: '+251 91 111 1113',
      password: 'Sam@Finance2026#Gimbie'
    },
    {
      fullName: 'Meron Alemu',
      position: 'Human Resources Manager',
      department: 'Administration',
      role: 'admin',
      staffId: 'GAH-ADM-004',
      email: 'meron.alemu@gimbiehospital.com',
      phone: '+251 91 111 1114',
      password: 'Meron@HR2026$Secure!'
    }
  ],

  // ============================================
  // MEDICAL DEPARTMENT
  // ============================================
  medical: [
    {
      fullName: 'Dr. Michael Abebe',
      position: 'General Practitioner',
      department: 'Medical',
      role: 'doctor',
      specialty: 'General Practice',
      staffId: 'GAH-DR-001',
      email: 'michael.abebe@gimbiehospital.com',
      phone: '+251 91 111 1115',
      password: 'DrMike@GP2026#Gimbie!'
    },
    {
      fullName: 'Dr. Daniel Kebede',
      position: 'Internal Medicine',
      department: 'Medical',
      role: 'doctor',
      specialty: 'Internal Medicine',
      staffId: 'GAH-DR-002',
      email: 'daniel.kebede@gimbiehospital.com',
      phone: '+251 91 111 1116',
      password: 'DrDan@IM2026$Gimbie'
    },
    {
      fullName: 'Dr. Sarah Gemechu',
      position: 'Pediatrics',
      department: 'Medical',
      role: 'doctor',
      specialty: 'Pediatrics',
      staffId: 'GAH-DR-003',
      email: 'sarah.gemechu@gimbiehospital.com',
      phone: '+251 91 111 1117',
      password: 'DrSarah@Peds2026!Gimbie'
    },
    {
      fullName: 'Dr. Elias Tadesse',
      position: 'General Surgery',
      department: 'Medical',
      role: 'doctor',
      specialty: 'Surgery',
      staffId: 'GAH-DR-004',
      email: 'elias.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1118',
      password: 'DrElias@Surg2026#Gimbie'
    },
    {
      fullName: 'Dr. Ruth Bekele',
      position: 'Obstetrics & Gynecology',
      department: 'Medical',
      role: 'doctor',
      specialty: 'Obstetrics & Gynecology',
      staffId: 'GAH-DR-005',
      email: 'ruth.bekele@gimbiehospital.com',
      phone: '+251 91 111 1119',
      password: 'DrRuth@OBG2026$Gimbie'
    }
  ],

  // ============================================
  // EMERGENCY DEPARTMENT
  // ============================================
  emergency: [
    {
      fullName: 'Dr. Samuel Girma',
      position: 'Emergency Physician',
      department: 'Emergency',
      role: 'doctor',
      specialty: 'Emergency Medicine',
      staffId: 'GAH-DR-006',
      email: 'samuel.girma@gimbiehospital.com',
      phone: '+251 91 111 1120',
      password: 'DrSam@EM2026#Gimbie!'
    },
    {
      fullName: 'Hana Worku',
      position: 'Emergency Nurse',
      department: 'Emergency',
      role: 'nurse',
      staffId: 'GAH-NUR-003',
      email: 'hana.worku@gimbiehospital.com',
      phone: '+251 91 111 1121',
      password: 'Hana@EMNurse2026$Gimbie'
    },
    {
      fullName: 'Meron Abate',
      position: 'Emergency Nurse',
      department: 'Emergency',
      role: 'nurse',
      staffId: 'GAH-NUR-004',
      email: 'meron.abate@gimbiehospital.com',
      phone: '+251 91 111 1122',
      password: 'Meron@EM2026#Gimbie!'
    },
    {
      fullName: 'Daniel Fikadu',
      position: 'Emergency Nurse',
      department: 'Emergency',
      role: 'nurse',
      staffId: 'GAH-NUR-005',
      email: 'daniel.fikadu@gimbiehospital.com',
      phone: '+251 91 111 1123',
      password: 'Dan@EMNurse2026$Gimbie'
    }
  ],

  // ============================================
  // NURSING DEPARTMENT
  // ============================================
  nursing: [
    {
      fullName: 'Almaz Tesfaye',
      position: 'Nurse Manager',
      department: 'Nursing',
      role: 'nurse',
      staffId: 'GAH-NUR-001',
      email: 'almaz.tesfaye@gimbiehospital.com',
      phone: '+251 91 111 1124',
      password: 'Almaz@NurseMgr2026#Gimbie'
    },
    {
      fullName: 'Bethlehem Worku',
      position: 'Senior Nurse',
      department: 'Nursing',
      role: 'nurse',
      staffId: 'GAH-NUR-002',
      email: 'bethlehem.worku@gimbiehospital.com',
      phone: '+251 91 111 1125',
      password: 'Beth@SrNurse2026$Gimbie'
    },
    {
      fullName: 'Selamawit Kebede',
      position: 'Nurse',
      department: 'Nursing',
      role: 'nurse',
      staffId: 'GAH-NUR-006',
      email: 'selamawit.kebede@gimbiehospital.com',
      phone: '+251 91 111 1126',
      password: 'Selam@Nurse2026#Gimbie!'
    },
    {
      fullName: 'Rahel Gemechu',
      position: 'Nurse',
      department: 'Nursing',
      role: 'nurse',
      staffId: 'GAH-NUR-007',
      email: 'rahel.gemechu@gimbiehospital.com',
      phone: '+251 91 111 1127',
      password: 'Rahel@Nurse2026$Gimbie'
    },
    {
      fullName: 'Tigist Abebe',
      position: 'Nurse',
      department: 'Nursing',
      role: 'nurse',
      staffId: 'GAH-NUR-008',
      email: 'tigist.abebe@gimbiehospital.com',
      phone: '+251 91 111 1128',
      password: 'Tigist@Nurse2026#Gimbie!'
    },
    {
      fullName: 'Eden Tadesse',
      position: 'Nurse',
      department: 'Nursing',
      role: 'nurse',
      staffId: 'GAH-NUR-009',
      email: 'eden.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1129',
      password: 'Eden@Nurse2026$Gimbie'
    }
  ],

  // ============================================
  // MATERNITY & OBSTETRICS
  // ============================================
  maternity: [
    {
      fullName: 'Hanna Girma',
      position: 'Midwife',
      department: 'Obstetrics & Gynecology',
      role: 'nurse',
      staffId: 'GAH-NUR-010',
      email: 'hanna.girma@gimbiehospital.com',
      phone: '+251 91 111 1130',
      password: 'Hanna@Midwife2026#Gimbie'
    },
    {
      fullName: 'Rahel Tadesse',
      position: 'Midwife',
      department: 'Obstetrics & Gynecology',
      role: 'nurse',
      staffId: 'GAH-NUR-011',
      email: 'rahel.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1131',
      password: 'Rahel@Midwife2026$Gimbie'
    },
    {
      fullName: 'Selam Abebe',
      position: 'Midwife',
      department: 'Obstetrics & Gynecology',
      role: 'nurse',
      staffId: 'GAH-NUR-012',
      email: 'selam.abebe@gimbiehospital.com',
      phone: '+251 91 111 1132',
      password: 'Selam@Midwife2026#Gimbie!'
    }
  ],

  // ============================================
  // PEDIATRICS
  // ============================================
  pediatrics: [
    {
      fullName: 'Meron Kebede',
      position: 'Pediatric Nurse',
      department: 'Pediatrics',
      role: 'nurse',
      staffId: 'GAH-NUR-013',
      email: 'meron.kebede@gimbiehospital.com',
      phone: '+251 91 111 1133',
      password: 'Meron@PedsNurse2026$Gimbie'
    },
    {
      fullName: 'Hana Alemu',
      position: 'Pediatric Nurse',
      department: 'Pediatrics',
      role: 'nurse',
      staffId: 'GAH-NUR-014',
      email: 'hana.alemu@gimbiehospital.com',
      phone: '+251 91 111 1134',
      password: 'Hana@PedsNurse2026#Gimbie'
    }
  ],

  // ============================================
  // SURGERY
  // ============================================
  surgery: [
    {
      fullName: 'Samuel Abebe',
      position: 'Surgical Nurse',
      department: 'Surgery',
      role: 'nurse',
      staffId: 'GAH-NUR-015',
      email: 'samuel.abebe@gimbiehospital.com',
      phone: '+251 91 111 1135',
      password: 'Sam@SurgNurse2026$Gimbie'
    },
    {
      fullName: 'Bethlehem Girma',
      position: 'Surgical Nurse',
      department: 'Surgery',
      role: 'nurse',
      staffId: 'GAH-NUR-016',
      email: 'bethlehem.girma@gimbiehospital.com',
      phone: '+251 91 111 1136',
      password: 'Beth@SurgNurse2026#Gimbie!'
    },
    {
      fullName: 'Daniel Worku',
      position: 'Anesthesia Professional',
      department: 'Surgery',
      role: 'nurse',
      staffId: 'GAH-NUR-017',
      email: 'daniel.worku@gimbiehospital.com',
      phone: '+251 91 111 1137',
      password: 'Dan@Anesthesia2026$Gimbie'
    }
  ],

  // ============================================
  // LABORATORY
  // ============================================
  laboratory: [
    {
      fullName: 'Fitsum Bekele',
      position: 'Lab Manager',
      department: 'Laboratory',
      role: 'lab_technician',
      staffId: 'GAH-LAB-001',
      email: 'fitsum.bekele@gimbiehospital.com',
      phone: '+251 91 111 1138',
      password: 'Fitsum@LabMgr2026#Gimbie'
    },
    {
      fullName: 'Abel Tadesse',
      position: 'Laboratory Technologist',
      department: 'Laboratory',
      role: 'lab_technician',
      staffId: 'GAH-LAB-002',
      email: 'abel.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1139',
      password: 'Abel@LabTech2026$Gimbie'
    },
    {
      fullName: 'Meron Girma',
      position: 'Laboratory Technologist',
      department: 'Laboratory',
      role: 'lab_technician',
      staffId: 'GAH-LAB-003',
      email: 'meron.girma@gimbiehospital.com',
      phone: '+251 91 111 1140',
      password: 'Meron@LabTech2026#Gimbie!'
    },
    {
      fullName: 'Hana Worku',
      position: 'Laboratory Technician',
      department: 'Laboratory',
      role: 'lab_technician',
      staffId: 'GAH-LAB-004',
      email: 'hana.worku@gimbiehospital.com',
      phone: '+251 91 111 1141',
      password: 'Hana@LabTech2026$Gimbie'
    }
  ],

  // ============================================
  // RADIOLOGY
  // ============================================
  radiology: [
    {
      fullName: 'Dawit Kebede',
      position: 'Radiology Manager',
      department: 'Radiology',
      role: 'radiologist',
      staffId: 'GAH-RAD-001',
      email: 'dawit.kebede@gimbiehospital.com',
      phone: '+251 91 111 1142',
      password: 'Dawit@RadMgr2026#Gimbie'
    },
    {
      fullName: 'Samuel Tadesse',
      position: 'Radiographer',
      department: 'Radiology',
      role: 'radiologist',
      staffId: 'GAH-RAD-002',
      email: 'samuel.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1143',
      password: 'Sam@Radiograph2026$Gimbie'
    },
    {
      fullName: 'Ruth Alemu',
      position: 'Radiographer',
      department: 'Radiology',
      role: 'radiologist',
      staffId: 'GAH-RAD-003',
      email: 'ruth.alemu@gimbiehospital.com',
      phone: '+251 91 111 1144',
      password: 'Ruth@Radiograph2026#Gimbie!'
    }
  ],

  // ============================================
  // PHARMACY
  // ============================================
  pharmacy: [
    {
      fullName: 'Elias Bekele',
      position: 'Chief Pharmacist',
      department: 'Pharmacy',
      role: 'pharmacist',
      staffId: 'GAH-PHA-001',
      email: 'elias.bekele@gimbiehospital.com',
      phone: '+251 91 111 1145',
      password: 'Elias@Pharm2026$Gimbie'
    },
    {
      fullName: 'Hana Gemechu',
      position: 'Pharmacist',
      department: 'Pharmacy',
      role: 'pharmacist',
      staffId: 'GAH-PHA-002',
      email: 'hana.gemechu@gimbiehospital.com',
      phone: '+251 91 111 1146',
      password: 'Hana@Pharm2026#Gimbie!'
    },
    {
      fullName: 'Meron Tadesse',
      position: 'Pharmacy Technician',
      department: 'Pharmacy',
      role: 'pharmacist',
      staffId: 'GAH-PHA-003',
      email: 'meron.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1147',
      password: 'Meron@PharmTech2026$Gimbie'
    },
    {
      fullName: 'Selam Worku',
      position: 'Pharmacy Technician',
      department: 'Pharmacy',
      role: 'pharmacist',
      staffId: 'GAH-PHA-004',
      email: 'selam.worku@gimbiehospital.com',
      phone: '+251 91 111 1148',
      password: 'Selam@PharmTech2026#Gimbie'
    }
  ],

  // ============================================
  // OPD
  // ============================================
  opd: [
    {
      fullName: 'Daniel Girma',
      position: 'OPD Coordinator',
      department: 'OPD',
      role: 'receptionist',
      staffId: 'GAH-OPD-001',
      email: 'daniel.girma@gimbiehospital.com',
      phone: '+251 91 111 1149',
      password: 'Daniel@OPD2026$Gimbie'
    },
    {
      fullName: 'Rahel Bekele',
      position: 'Receptionist',
      department: 'OPD',
      role: 'receptionist',
      staffId: 'GAH-OPD-002',
      email: 'rahel.bekele@gimbiehospital.com',
      phone: '+251 91 111 1150',
      password: 'Rahel@Recep2026#Gimbie!'
    },
    {
      fullName: 'Eden Worku',
      position: 'Receptionist',
      department: 'OPD',
      role: 'receptionist',
      staffId: 'GAH-OPD-003',
      email: 'eden.worku@gimbiehospital.com',
      phone: '+251 91 111 1151',
      password: 'Eden@Recep2026$Gimbie'
    }
  ],

  // ============================================
  // INPATIENT / WARD
  // ============================================
  inpatient: [
    {
      fullName: 'Almaz Kebede',
      position: 'Ward Manager',
      department: 'Inpatient',
      role: 'nurse',
      staffId: 'GAH-NUR-018',
      email: 'almaz.kebede@gimbiehospital.com',
      phone: '+251 91 111 1152',
      password: 'Almaz@WardMgr2026#Gimbie'
    },
    {
      fullName: 'Hanna Abebe',
      position: 'Senior Nurse',
      department: 'Inpatient',
      role: 'nurse',
      staffId: 'GAH-NUR-019',
      email: 'hanna.abebe@gimbiehospital.com',
      phone: '+251 91 111 1153',
      password: 'Hanna@SrNurse2026$Gimbie'
    },
    {
      fullName: 'Selam Girma',
      position: 'Nurse',
      department: 'Inpatient',
      role: 'nurse',
      staffId: 'GAH-NUR-020',
      email: 'selam.girma@gimbiehospital.com',
      phone: '+251 91 111 1154',
      password: 'Selam@Nurse2026#Gimbie!'
    },
    {
      fullName: 'Bethlehem Tadesse',
      position: 'Nurse',
      department: 'Inpatient',
      role: 'nurse',
      staffId: 'GAH-NUR-021',
      email: 'bethlehem.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1155',
      password: 'Beth@Nurse2026$Gimbie'
    },
    {
      fullName: 'Rahel Worku',
      position: 'Nurse',
      department: 'Inpatient',
      role: 'nurse',
      staffId: 'GAH-NUR-022',
      email: 'rahel.worku@gimbiehospital.com',
      phone: '+251 91 111 1156',
      password: 'Rahel@Nurse2026#Gimbie'
    }
  ],

  // ============================================
  // FINANCE
  // ============================================
  finance: [
    {
      fullName: 'Meron Abebe',
      position: 'Accountant',
      department: 'Finance',
      role: 'accountant',
      staffId: 'GAH-FIN-001',
      email: 'meron.abebe@gimbiehospital.com',
      phone: '+251 91 111 1157',
      password: 'Meron@Acc2026$Gimbie'
    },
    {
      fullName: 'Hana Tadesse',
      position: 'Cashier',
      department: 'Finance',
      role: 'accountant',
      staffId: 'GAH-FIN-002',
      email: 'hana.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1158',
      password: 'Hana@Cash2026#Gimbie!'
    },
    {
      fullName: 'Daniel Kebede',
      position: 'Billing Officer',
      department: 'Finance',
      role: 'accountant',
      staffId: 'GAH-FIN-003',
      email: 'daniel.kebede@gimbiehospital.com',
      phone: '+251 91 111 1159',
      password: 'Daniel@Bill2026$Gimbie'
    }
  ],

  // ============================================
  // HUMAN RESOURCES
  // ============================================
  hr: [
    {
      fullName: 'Selam Bekele',
      position: 'HR Officer',
      department: 'HR',
      role: 'hr_manager',
      staffId: 'GAH-HR-001',
      email: 'selam.bekele@gimbiehospital.com',
      phone: '+251 91 111 1160',
      password: 'Selam@HR2026#Gimbie!'
    },
    {
      fullName: 'Eden Gemechu',
      position: 'HR Assistant',
      department: 'HR',
      role: 'hr_manager',
      staffId: 'GAH-HR-002',
      email: 'eden.gemechu@gimbiehospital.com',
      phone: '+251 91 111 1161',
      password: 'Eden@HR2026$Gimbie'
    }
  ],

  // ============================================
  // HEALTH INFORMATION
  // ============================================
  healthInfo: [
    {
      fullName: 'Dawit Abebe',
      position: 'Health Information Manager',
      department: 'Health Information',
      role: 'admin',
      staffId: 'GAH-HIS-001',
      email: 'dawit.abebe@gimbiehospital.com',
      phone: '+251 91 111 1162',
      password: 'Dawit@HIM2026#Gimbie'
    },
    {
      fullName: 'Rahel Tadesse',
      position: 'Medical Records Officer',
      department: 'Health Information',
      role: 'admin',
      staffId: 'GAH-HIS-002',
      email: 'rahel.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1163',
      password: 'Rahel@MRO2026$Gimbie'
    },
    {
      fullName: 'Samuel Girma',
      position: 'Data Clerk',
      department: 'Health Information',
      role: 'admin',
      staffId: 'GAH-HIS-003',
      email: 'samuel.girma@gimbiehospital.com',
      phone: '+251 91 111 1164',
      password: 'Samuel@Data2026#Gimbie!'
    }
  ],

  // ============================================
  // INVENTORY & PROCUREMENT
  // ============================================
  inventory: [
    {
      fullName: 'Elias Worku',
      position: 'Procurement Manager',
      department: 'Procurement',
      role: 'procurement_manager',
      staffId: 'GAH-PRO-001',
      email: 'elias.worku@gimbiehospital.com',
      phone: '+251 91 111 1165',
      password: 'Elias@Proc2026$Gimbie'
    },
    {
      fullName: 'Fitsum Tadesse',
      position: 'Inventory Manager',
      department: 'Inventory',
      role: 'inventory_manager',
      staffId: 'GAH-INV-001',
      email: 'fitsum.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1166',
      password: 'Fitsum@Inv2026#Gimbie!'
    },
    {
      fullName: 'Daniel Alemu',
      position: 'Storekeeper',
      department: 'Inventory',
      role: 'inventory_manager',
      staffId: 'GAH-INV-002',
      email: 'daniel.alemu@gimbiehospital.com',
      phone: '+251 91 111 1167',
      password: 'Daniel@Store2026$Gimbie'
    },
    {
      fullName: 'Hana Kebede',
      position: 'Procurement Officer',
      department: 'Procurement',
      role: 'procurement_manager',
      staffId: 'GAH-PRO-002',
      email: 'hana.kebede@gimbiehospital.com',
      phone: '+251 91 111 1168',
      password: 'Hana@Proc2026#Gimbie'
    }
  ],

  // ============================================
  // IT DEPARTMENT
  // ============================================
  it: [
    {
      fullName: 'Abel Gemechu',
      position: 'IT Manager',
      department: 'IT',
      role: 'admin',
      staffId: 'GAH-IT-001',
      email: 'abel.gemechu@gimbiehospital.com',
      phone: '+251 91 111 1169',
      password: 'Abel@ITMgr2026$Gimbie'
    },
    {
      fullName: 'Michael Tadesse',
      position: 'System Administrator',
      department: 'IT',
      role: 'admin',
      staffId: 'GAH-IT-002',
      email: 'michael.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1170',
      password: 'Michael@SysAdmin2026#Gimbie'
    },
    {
      fullName: 'Ruth Worku',
      position: 'IT Support Officer',
      department: 'IT',
      role: 'admin',
      staffId: 'GAH-IT-003',
      email: 'ruth.worku@gimbiehospital.com',
      phone: '+251 91 111 1171',
      password: 'Ruth@ITSupport2026$Gimbie'
    }
  ],

  // ============================================
  // MAINTENANCE
  // ============================================
  maintenance: [
    {
      fullName: 'Tesfaye Bekele',
      position: 'Maintenance Manager',
      department: 'Maintenance',
      role: 'admin',
      staffId: 'GAH-MNT-001',
      email: 'tesfaye.bekele@gimbiehospital.com',
      phone: '+251 91 111 1172',
      password: 'Tesfaye@Maint2026#Gimbie'
    },
    {
      fullName: 'Daniel Abate',
      position: 'Maintenance Technician',
      department: 'Maintenance',
      role: 'admin',
      staffId: 'GAH-MNT-002',
      email: 'daniel.abate@gimbiehospital.com',
      phone: '+251 91 111 1173',
      password: 'Daniel@MaintTech2026$Gimbie'
    },
    {
      fullName: 'Samuel Alemu',
      position: 'Electrician',
      department: 'Maintenance',
      role: 'admin',
      staffId: 'GAH-MNT-003',
      email: 'samuel.alemu@gimbiehospital.com',
      phone: '+251 91 111 1174',
      password: 'Samuel@Elec2026#Gimbie!'
    },
    {
      fullName: 'Elias Girma',
      position: 'General Technician',
      department: 'Maintenance',
      role: 'admin',
      staffId: 'GAH-MNT-004',
      email: 'elias.girma@gimbiehospital.com',
      phone: '+251 91 111 1175',
      password: 'Elias@Tech2026$Gimbie'
    }
  ],

  // ============================================
  // CLEANING & SUPPORT SERVICES
  // ============================================
  cleaning: [
    {
      fullName: 'Hana Abebe',
      position: 'Cleaning Supervisor',
      department: 'Cleaning & Support',
      role: 'admin',
      staffId: 'GAH-CLN-001',
      email: 'hana.abebe@gimbiehospital.com',
      phone: '+251 91 111 1176',
      password: 'Hana@Clean2026#Gimbie'
    },
    {
      fullName: 'Selam Tadesse',
      position: 'Cleaner',
      department: 'Cleaning & Support',
      role: 'admin',
      staffId: 'GAH-CLN-002',
      email: 'selam.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1177',
      password: 'Selam@Clean2026$Gimbie'
    },
    {
      fullName: 'Rahel Alemu',
      position: 'Cleaner',
      department: 'Cleaning & Support',
      role: 'admin',
      staffId: 'GAH-CLN-003',
      email: 'rahel.alemu@gimbiehospital.com',
      phone: '+251 91 111 1178',
      password: 'Rahel@Clean2026#Gimbie!'
    },
    {
      fullName: 'Bethlehem Worku',
      position: 'Support Staff',
      department: 'Cleaning & Support',
      role: 'admin',
      staffId: 'GAH-CLN-004',
      email: 'bethlehem.worku@gimbiehospital.com',
      phone: '+251 91 111 1179',
      password: 'Beth@Support2026$Gimbie'
    }
  ],

  // ============================================
  // SECURITY
  // ============================================
  security: [
    {
      fullName: 'Gemechu Bekele',
      position: 'Security Supervisor',
      department: 'Security',
      role: 'admin',
      staffId: 'GAH-SEC-001',
      email: 'gemechu.bekele@gimbiehospital.com',
      phone: '+251 91 111 1180',
      password: 'Gemechu@Sec2026#Gimbie'
    },
    {
      fullName: 'Daniel Tadesse',
      position: 'Security Officer',
      department: 'Security',
      role: 'admin',
      staffId: 'GAH-SEC-002',
      email: 'daniel.tadesse@gimbiehospital.com',
      phone: '+251 91 111 1181',
      password: 'Daniel@Sec2026$Gimbie'
    },
    {
      fullName: 'Samuel Abebe',
      position: 'Security Officer',
      department: 'Security',
      role: 'admin',
      staffId: 'GAH-SEC-003',
      email: 'samuel.abebe@gimbiehospital.com',
      phone: '+251 91 111 1182',
      password: 'Samuel@Sec2026#Gimbie!'
    },
    {
      fullName: 'Elias Worku',
      position: 'Security Officer',
      department: 'Security',
      role: 'admin',
      staffId: 'GAH-SEC-004',
      email: 'elias.worku@gimbiehospital.com',
      phone: '+251 91 111 1183',
      password: 'Elias@Sec2026$Gimbie'
    }
  ]
};

// ============================================
// STAFF ID MAPPING
// ============================================
const staffIdMapping = {
  'GAH-ADM-001': 'Dr. Daniel Bekele',
  'GAH-ADM-002': 'Hana Tadesse',
  'GAH-ADM-003': 'Samuel Worku',
  'GAH-ADM-004': 'Meron Alemu',
  'GAH-DR-001': 'Dr. Michael Abebe',
  'GAH-DR-002': 'Dr. Daniel Kebede',
  'GAH-DR-003': 'Dr. Sarah Gemechu',
  'GAH-DR-004': 'Dr. Elias Tadesse',
  'GAH-DR-005': 'Dr. Ruth Bekele',
  'GAH-DR-006': 'Dr. Samuel Girma',
  'GAH-NUR-001': 'Almaz Tesfaye',
  'GAH-NUR-002': 'Bethlehem Worku',
  'GAH-NUR-003': 'Hana Worku',
  'GAH-NUR-004': 'Meron Abate',
  'GAH-NUR-005': 'Daniel Fikadu',
  'GAH-NUR-006': 'Selamawit Kebede',
  'GAH-NUR-007': 'Rahel Gemechu',
  'GAH-NUR-008': 'Tigist Abebe',
  'GAH-NUR-009': 'Eden Tadesse',
  'GAH-NUR-010': 'Hanna Girma',
  'GAH-NUR-011': 'Rahel Tadesse',
  'GAH-NUR-012': 'Selam Abebe',
  'GAH-NUR-013': 'Meron Kebede',
  'GAH-NUR-014': 'Hana Alemu',
  'GAH-NUR-015': 'Samuel Abebe',
  'GAH-NUR-016': 'Bethlehem Girma',
  'GAH-NUR-017': 'Daniel Worku',
  'GAH-NUR-018': 'Almaz Kebede',
  'GAH-NUR-019': 'Hanna Abebe',
  'GAH-NUR-020': 'Selam Girma',
  'GAH-NUR-021': 'Bethlehem Tadesse',
  'GAH-NUR-022': 'Rahel Worku',
  'GAH-LAB-001': 'Fitsum Bekele',
  'GAH-LAB-002': 'Abel Tadesse',
  'GAH-LAB-003': 'Meron Girma',
  'GAH-LAB-004': 'Hana Worku',
  'GAH-RAD-001': 'Dawit Kebede',
  'GAH-RAD-002': 'Samuel Tadesse',
  'GAH-RAD-003': 'Ruth Alemu',
  'GAH-PHA-001': 'Elias Bekele',
  'GAH-PHA-002': 'Hana Gemechu',
  'GAH-PHA-003': 'Meron Tadesse',
  'GAH-PHA-004': 'Selam Worku',
  'GAH-OPD-001': 'Daniel Girma',
  'GAH-OPD-002': 'Rahel Bekele',
  'GAH-OPD-003': 'Eden Worku',
  'GAH-FIN-001': 'Meron Abebe',
  'GAH-FIN-002': 'Hana Tadesse',
  'GAH-FIN-003': 'Daniel Kebede',
  'GAH-HR-001': 'Selam Bekele',
  'GAH-HR-002': 'Eden Gemechu',
  'GAH-HIS-001': 'Dawit Abebe',
  'GAH-HIS-002': 'Rahel Tadesse',
  'GAH-HIS-003': 'Samuel Girma',
  'GAH-PRO-001': 'Elias Worku',
  'GAH-PRO-002': 'Hana Kebede',
  'GAH-INV-001': 'Fitsum Tadesse',
  'GAH-INV-002': 'Daniel Alemu',
  'GAH-IT-001': 'Abel Gemechu',
  'GAH-IT-002': 'Michael Tadesse',
  'GAH-IT-003': 'Ruth Worku',
  'GAH-MNT-001': 'Tesfaye Bekele',
  'GAH-MNT-002': 'Daniel Abate',
  'GAH-MNT-003': 'Samuel Alemu',
  'GAH-MNT-004': 'Elias Girma',
  'GAH-CLN-001': 'Hana Abebe',
  'GAH-CLN-002': 'Selam Tadesse',
  'GAH-CLN-003': 'Rahel Alemu',
  'GAH-CLN-004': 'Bethlehem Worku',
  'GAH-SEC-001': 'Gemechu Bekele',
  'GAH-SEC-002': 'Daniel Tadesse',
  'GAH-SEC-003': 'Samuel Abebe',
  'GAH-SEC-004': 'Elias Worku'
};

// Export for use in seed script
module.exports = {
  staffData,
  staffIdMapping,
  getAllStaff: () => {
    const allStaff = [];
    Object.values(staffData).forEach(department => {
      department.forEach(staff => {
        allStaff.push(staff);
      });
    });
    return allStaff;
  },
  getStaffByDepartment: (department) => {
    const deptMap = {
      'Administration': staffData.administration,
      'Medical': staffData.medical,
      'Emergency': staffData.emergency,
      'Nursing': staffData.nursing,
      'Maternity': staffData.maternity,
      'Pediatrics': staffData.pediatrics,
      'Surgery': staffData.surgery,
      'Laboratory': staffData.laboratory,
      'Radiology': staffData.radiology,
      'Pharmacy': staffData.pharmacy,
      'OPD': staffData.opd,
      'Inpatient': staffData.inpatient,
      'Finance': staffData.finance,
      'HR': staffData.hr,
      'Health Information': staffData.healthInfo,
      'Inventory': staffData.inventory,
      'IT': staffData.it,
      'Maintenance': staffData.maintenance,
      'Cleaning & Support': staffData.cleaning,
      'Security': staffData.security
    };
    return deptMap[department] || [];
  },
  getStaffByRole: (role) => {
    const allStaff = [];
    Object.values(staffData).forEach(department => {
      department.forEach(staff => {
        if (staff.role === role) {
          allStaff.push(staff);
        }
      });
    });
    return allStaff;
  },
  getStaffById: (staffId) => {
    const allStaff = [];
    Object.values(staffData).forEach(department => {
      department.forEach(staff => {
        allStaff.push(staff);
      });
    });
    return allStaff.find(staff => staff.staffId === staffId) || null;
  }
};
