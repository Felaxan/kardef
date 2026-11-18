/* Yeni özelliklerin örnek verileri. Kullanım: npm run seed:features */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { seedFeatures } from './features'

const payload = await getPayload({ config })
await seedFeatures(payload)
process.exit(0)
