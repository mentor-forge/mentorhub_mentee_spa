import { bootstrapAuthFromUrl } from '@mentor-forge/mentorhub_spa_utils'
import { syncAuthFromStorage } from '@/composables/useAuth'

bootstrapAuthFromUrl()
syncAuthFromStorage()
