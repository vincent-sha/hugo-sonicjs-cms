import { createDb, users } from '@sonicjs-cms/core'
import { eq } from 'drizzle-orm'
import * as crypto from 'crypto'
import { getPlatformProxy } from 'wrangler'

/**
 * Reset admin/user password script
 *
 * Usage:
 * npm run reset:admin -- --email user@example.com --password 'newPassword'
 *
 * Notes:
 * - Password hashing follows the same scheme as SonicJS (sha256 of password + salt)
 * - The salt is hard-coded here as 'salt-change-in-production'; change before production use.
 */

function parseArgs(): { email?: string; password?: string } {
  const argv = process.argv.slice(2)
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) {
        args[key] = 'true'
      } else {
        args[key] = next
        i++
      }
    }
  }
  return { email: args.email, password: args.password }
}

async function run() {
  const { email, password } = parseArgs()
  if (!email || !password) {
    console.error('Usage: npm run reset:admin -- --email user@example.com --password newPassword')
    process.exit(1)
  }

  const { env, dispose } = await getPlatformProxy()
  if (!env?.DB) {
    console.error('❌ Error: DB binding not found. Make sure wrangler.toml DB binding is configured and run with `wrangler dev`.')
    process.exit(1)
  }

  const db = createDb(env.DB)

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get()

    if (!existingUser) {
      console.error(`❌ No user found with email ${email}`)
      await dispose()
      process.exit(1)
    }

    // Hash password using SHA-256 consistent with seed script
    const data = password + 'salt-change-in-production'
    const passwordHash = crypto.createHash('sha256').update(data).digest('hex')

    await db
      .update(users)
      .set({ passwordHash: passwordHash, updatedAt: Date.now() })
      .where(eq(users.email, email))
      .run()

    console.log(`✓ Password updated for ${email}`)
    await dispose()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting password:', error)
    await dispose()
    process.exit(1)
  }
}

run()
  .then(() => {})
  .catch((err) => {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  })
