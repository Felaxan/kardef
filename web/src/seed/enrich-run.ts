/* Örnek içeriği tamamlar (yalnızca boş alanlar). Kullanım: npm run seed:enrich */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { enrich } from './enrich'

const payload = await getPayload({ config })
await enrich(payload)
process.exit(0)
