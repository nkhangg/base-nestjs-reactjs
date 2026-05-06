export { ConfigPage } from './components/ConfigPage'
export { PageConfigEditor } from './components/PageConfigEditor'
export {
  useConfigs,
  useConfig,
  useCreateConfig,
  useUpdateConfig,
  useToggleConfig,
  useDeleteConfig,
} from './hooks/useConfigs'
export type { AppConfig, ConfigScope, CreateConfigDto, UpdateConfigDto } from './types'
