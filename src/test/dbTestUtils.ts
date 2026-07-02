import Dexie from 'dexie'
import { DisneyCommandDB } from '@/infrastructure/local/db'

/**
 * fake-indexeddb keeps its in-memory store alive for the lifetime of the test
 * process, keyed by database name — so instantiating `new DisneyCommandDB()`
 * in each test's `beforeEach` does NOT give a clean slate on its own. This
 * deletes the underlying database first so every test starts isolated.
 */
export async function freshDb(): Promise<DisneyCommandDB> {
  await Dexie.delete('disney-command')
  return new DisneyCommandDB()
}
