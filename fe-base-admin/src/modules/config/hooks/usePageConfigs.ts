import { useQuery } from '@tanstack/react-query'
import { configService } from '../services/config.service'
import { CONFIGS_QUERY_KEY } from './useConfigs'
import type { PageSection } from '../types'

export function usePageConfigs() {
  const query = useQuery({
    queryKey: [...CONFIGS_QUERY_KEY, 'pages'],
    queryFn: () => configService.listPageConfigs(),
  })

  const sections: PageSection[] = []
  if (query.data) {
    const map = new Map<string, PageSection>()
    for (const config of query.data) {
      // key format: pages.<section>.<item...>
      const parts = config.key.split('.')
      const section = parts[1] ?? 'other'
      if (!map.has(section)) map.set(section, { section, items: [] })
      map.get(section)!.items.push(config)
    }
    sections.push(...map.values())
  }

  return { ...query, sections }
}
