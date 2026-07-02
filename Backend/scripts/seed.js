import '../config/env.js'
import mongoose from 'mongoose'
import Medicine from '../models/medicine.js'

async function run() {
  const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/pharmacy_db'
  await mongoose.connect(MONGO_URL)

  const now = new Date()
  const addDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)

  const rows = [
    { name: 'Paracetamol 500mg', category: 'Analgesic', quantity: 150, batchNo: 'PCM-500-2025A', manufacturer: 'GlaxoSmithKline', expiryDate: addDays(365), price: 1.50 },
    { name: 'Amoxicillin 250mg', category: 'Antibiotic', quantity: 12, batchNo: 'AMX-250-2025B', manufacturer: 'Cipla Ltd', expiryDate: addDays(45), price: 2.20 },
    { name: 'Aspirin 75mg', category: 'Antiplatelet', quantity: 8, batchNo: 'ASP-075-2025C', manufacturer: 'Bayer AG', expiryDate: addDays(25), price: 0.80 },
    { name: 'Metformin 500mg', category: 'Antidiabetic', quantity: 200, batchNo: 'MET-500-2025D', manufacturer: 'Sun Pharma', expiryDate: addDays(540), price: 0.65 },
    { name: 'Omeprazole 20mg', category: 'PPI', quantity: 5, batchNo: 'OMP-020-2025E', manufacturer: 'Dr. Reddys Lab', expiryDate: addDays(10), price: 1.10 },
    { name: 'Cough Syrup 100ml', category: 'Antitussive', quantity: 32, batchNo: 'CS-100-2025F', manufacturer: 'Pfizer Inc', expiryDate: addDays(120), price: 3.99 },
    { name: 'Vitamin C 500mg', category: 'Supplement', quantity: 0, batchNo: 'VTC-500-2025G', manufacturer: 'Nature Made', expiryDate: addDays(365), price: 0.45 },
    { name: 'Ibuprofen 200mg', category: 'NSAID', quantity: 78, batchNo: 'IBU-200-2025H', manufacturer: 'Johnson & Johnson', expiryDate: addDays(400), price: 0.90 },
    { name: 'Cetirizine 10mg', category: 'Antihistamine', quantity: 14, batchNo: 'CET-010-2025I', manufacturer: 'Ranbaxy', expiryDate: addDays(60), price: 0.55 },
    { name: 'Azithromycin 500mg', category: 'Antibiotic', quantity: 6, batchNo: 'AZI-500-2025J', manufacturer: 'Lupin Pharma', expiryDate: addDays(20), price: 2.75 },
    { name: 'Insulin 10ml', category: 'Antidiabetic', quantity: 18, batchNo: 'INS-010-2025K', manufacturer: 'Novo Nordisk', expiryDate: addDays(90), price: 18.50 },
    { name: 'Betadine 50ml', category: 'Antiseptic', quantity: 3, batchNo: 'BET-050-2025L', manufacturer: 'Alkem Labs', expiryDate: addDays(15), price: 2.30 }
  ]

  await Medicine.deleteMany({})
  await Medicine.insertMany(rows)
  console.log(`✅ Seeded ${rows.length} medicines`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
