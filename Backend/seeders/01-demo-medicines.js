'use strict'

const { v4: uuidv4 } = require('uuid')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date()
    const addDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const rows = [
      {
        id: uuidv4(),
        name: 'Paracetamol 500mg',
        category: 'Analgesic',
        quantity: 150,
        unit: 'pcs',
        batchNumber: 'PCM-500-2025A',
        expiryDate: addDays(365),
        price: 1.50,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Amoxicillin 250mg',
        category: 'Antibiotic',
        quantity: 12,
        unit: 'pcs',
        batchNumber: 'AMX-250-2025B',
        expiryDate: addDays(45),
        price: 2.20,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Aspirin 75mg',
        category: 'Antiplatelet',
        quantity: 8,
        unit: 'pcs',
        batchNumber: 'ASP-075-2025C',
        expiryDate: addDays(25),
        price: 0.80,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Metformin 500mg',
        category: 'Antidiabetic',
        quantity: 200,
        unit: 'pcs',
        batchNumber: 'MET-500-2025D',
        expiryDate: addDays(540),
        price: 0.65,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Omeprazole 20mg',
        category: 'PPI',
        quantity: 5,
        unit: 'pcs',
        batchNumber: 'OMP-020-2025E',
        expiryDate: addDays(10),
        price: 1.10,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Cough Syrup 100ml',
        category: 'Antitussive',
        quantity: 32,
        unit: 'bottles',
        batchNumber: 'CS-100-2025F',
        expiryDate: addDays(120),
        price: 3.99,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Vitamin C 500mg',
        category: 'Supplement',
        quantity: 0,
        unit: 'pcs',
        batchNumber: 'VTC-500-2025G',
        expiryDate: addDays(365),
        price: 0.45,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Ibuprofen 200mg',
        category: 'NSAID',
        quantity: 78,
        unit: 'pcs',
        batchNumber: 'IBU-200-2025H',
        expiryDate: addDays(400),
        price: 0.90,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Cetirizine 10mg',
        category: 'Antihistamine',
        quantity: 14,
        unit: 'pcs',
        batchNumber: 'CET-010-2025I',
        expiryDate: addDays(60),
        price: 0.55,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Azithromycin 500mg',
        category: 'Antibiotic',
        quantity: 6,
        unit: 'pcs',
        batchNumber: 'AZI-500-2025J',
        expiryDate: addDays(20),
        price: 2.75,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Insulin 10ml',
        category: 'Antidiabetic',
        quantity: 18,
        unit: 'vials',
        batchNumber: 'INS-010-2025K',
        expiryDate: addDays(90),
        price: 18.50,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Betadine 50ml',
        category: 'Antiseptic',
        quantity: 3,
        unit: 'bottles',
        batchNumber: 'BET-050-2025L',
        expiryDate: addDays(15),
        price: 2.30,
        createdAt: now,
        updatedAt: now
      }
    ]

    await queryInterface.bulkInsert('Medicines', rows)
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Medicines', null, {})
  }
}
