import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  /** Only matters on narrow screens, where the properties panel is a drawer. */
  const propertiesOpen = ref(false)
  const imageSizeOpen = ref(false)
  const newImageOpen = ref(false)
  const saveOpen = ref(false)

  return { propertiesOpen, imageSizeOpen, newImageOpen, saveOpen }
})
