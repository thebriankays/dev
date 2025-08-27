import type { Payload } from 'payload'

const commonReligions = [
  // Christianity and denominations
  { name: 'Christianity', description: 'Abrahamic religion based on the teachings of Jesus Christ' },
  { name: 'Catholic', description: 'Largest denomination of Christianity', parentReligion: 'Christianity' },
  { name: 'Roman Catholic', description: 'Catholic Church led by the Pope in Rome', parentReligion: 'Catholic' },
  { name: 'Protestant', description: 'Christian denominations originating from the Reformation', parentReligion: 'Christianity' },
  { name: 'Orthodox', description: 'Eastern Orthodox Christianity', parentReligion: 'Christianity' },
  { name: 'Eastern Orthodox', description: 'Orthodox Christianity primarily in Eastern Europe', parentReligion: 'Orthodox' },
  { name: 'Greek Orthodox', description: 'Orthodox Christianity in Greece', parentReligion: 'Orthodox' },
  { name: 'Russian Orthodox', description: 'Orthodox Christianity in Russia', parentReligion: 'Orthodox' },
  { name: 'Anglican', description: 'Church of England and related churches', parentReligion: 'Protestant' },
  { name: 'Baptist', description: 'Protestant denomination emphasizing baptism', parentReligion: 'Protestant' },
  { name: 'Methodist', description: 'Protestant denomination founded by John Wesley', parentReligion: 'Protestant' },
  { name: 'Lutheran', description: 'Protestant denomination following Martin Luther', parentReligion: 'Protestant' },
  { name: 'Presbyterian', description: 'Reformed Protestant tradition', parentReligion: 'Protestant' },
  { name: 'Pentecostal', description: 'Protestant movement emphasizing Holy Spirit', parentReligion: 'Protestant' },
  { name: 'Evangelical', description: 'Protestant movement emphasizing personal conversion', parentReligion: 'Protestant' },
  { name: 'Coptic', description: 'Egyptian Christian tradition', parentReligion: 'Christianity' },
  { name: 'Maronite', description: 'Eastern Catholic Church primarily in Lebanon', parentReligion: 'Catholic' },
  
  // Islam and denominations
  { name: 'Islam', description: 'Abrahamic religion based on teachings of Muhammad' },
  { name: 'Muslim', description: 'Follower of Islam', parentReligion: 'Islam' },
  { name: 'Sunni', description: 'Largest denomination of Islam', parentReligion: 'Islam' },
  { name: 'Shia', description: 'Second largest denomination of Islam', parentReligion: 'Islam' },
  { name: 'Sufi', description: 'Mystical tradition within Islam', parentReligion: 'Islam' },
  { name: 'Ibadi', description: 'Branch of Islam dominant in Oman', parentReligion: 'Islam' },
  { name: 'Ahmadiyya', description: 'Islamic revival movement', parentReligion: 'Islam' },
  
  // Judaism
  { name: 'Judaism', description: 'Abrahamic religion of the Jewish people' },
  { name: 'Jewish', description: 'Follower of Judaism', parentReligion: 'Judaism' },
  { name: 'Orthodox Judaism', description: 'Traditional Judaism', parentReligion: 'Judaism' },
  { name: 'Reform Judaism', description: 'Liberal Judaism', parentReligion: 'Judaism' },
  { name: 'Conservative Judaism', description: 'Moderate Judaism', parentReligion: 'Judaism' },
  
  // Eastern religions
  { name: 'Hinduism', description: 'Ancient religion originating in India' },
  { name: 'Hindu', description: 'Follower of Hinduism', parentReligion: 'Hinduism' },
  { name: 'Buddhism', description: 'Religion based on teachings of Buddha' },
  { name: 'Buddhist', description: 'Follower of Buddhism', parentReligion: 'Buddhism' },
  { name: 'Theravada', description: 'School of Buddhism', parentReligion: 'Buddhism' },
  { name: 'Mahayana', description: 'School of Buddhism', parentReligion: 'Buddhism' },
  { name: 'Zen', description: 'Japanese school of Buddhism', parentReligion: 'Buddhism' },
  { name: 'Tibetan Buddhism', description: 'Buddhism practiced in Tibet', parentReligion: 'Buddhism' },
  { name: 'Sikhism', description: 'Religion founded by Guru Nanak', },
  { name: 'Sikh', description: 'Follower of Sikhism', parentReligion: 'Sikhism' },
  { name: 'Jainism', description: 'Ancient Indian religion' },
  { name: 'Jain', description: 'Follower of Jainism', parentReligion: 'Jainism' },
  { name: 'Taoism', description: 'Chinese philosophical religion' },
  { name: 'Taoist', description: 'Follower of Taoism', parentReligion: 'Taoism' },
  { name: 'Confucianism', description: 'Chinese ethical and philosophical system' },
  { name: 'Shinto', description: 'Indigenous religion of Japan' },
  
  // Other religions
  { name: 'Baha\'i', description: 'Religion emphasizing unity of all religions' },
  { name: 'Zoroastrianism', description: 'Ancient Persian religion' },
  { name: 'Druze', description: 'Monotheistic religion in Middle East' },
  { name: 'Yazidi', description: 'Ancient religion primarily in Iraq' },
  { name: 'Traditional African Religions', description: 'Indigenous African spiritual practices' },
  { name: 'Indigenous', description: 'Indigenous spiritual practices' },
  { name: 'Animism', description: 'Belief that natural objects have spirits' },
  { name: 'Shamanism', description: 'Practice involving shamans as intermediaries' },
  { name: 'Vodou', description: 'Religion practiced in Haiti' },
  { name: 'Santeria', description: 'Afro-Caribbean religion' },
  { name: 'Cao Dai', description: 'Vietnamese religion' },
  
  // Non-religious
  { name: 'None', description: 'No religious affiliation' },
  { name: 'Atheist', description: 'Does not believe in deities' },
  { name: 'Agnostic', description: 'Uncertain about existence of deities' },
  { name: 'Secular', description: 'Not religious' },
  { name: 'Unaffiliated', description: 'No specific religious affiliation' },
  
  // General/Other
  { name: 'Other', description: 'Other religious beliefs' },
  { name: 'Unknown', description: 'Religious affiliation unknown' },
  { name: 'Folk Religion', description: 'Traditional folk beliefs' },
  { name: 'Chinese Folk Religion', description: 'Traditional Chinese religious practices' },
]

export const seedReligions = async (payload: Payload): Promise<void> => {
  const log = payload.logger ?? console
  log.info('— Seeding religions...')

  // First create religions without parent relationships
  const religionMap = new Map<string, number>()
  
  for (const religion of commonReligions) {
    try {
      // Check if already exists
      const existing = await payload.find({
        collection: 'religions',
        where: {
          name: {
            equals: religion.name,
          },
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'religions',
          data: {
            name: religion.name,
            description: religion.description,
          },
        })
        religionMap.set(religion.name, created.id)
      } else {
        religionMap.set(religion.name, existing.docs[0].id)
      }
    } catch (error) {
      log.error(`Failed to create religion ${religion.name}: ${(error as any).message}`)
    }
  }

  // Now update parent relationships
  for (const religion of commonReligions) {
    if (religion.parentReligion) {
      try {
        const religionId = religionMap.get(religion.name)
        const parentId = religionMap.get(religion.parentReligion)
        
        if (religionId && parentId) {
          await payload.update({
            collection: 'religions',
            id: religionId,
            data: {
              parentReligion: parentId,
            },
          })
        }
      } catch (error) {
        log.error(`Failed to update parent for ${religion.name}: ${(error as any).message}`)
      }
    }
  }

  log.info(`✓ Seeded ${religionMap.size} religions`)
}
