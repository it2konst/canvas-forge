import { describe, expect, it } from 'vitest'
import { upgradeDraft } from '../autosave'

const blob = () => new Blob(['x'], { type: 'image/png' })

describe('upgradeDraft', () => {
  it('turns a single-image draft from before layers into one background layer', () => {
    const image = blob()
    const draft = upgradeDraft(
      { image, width: 300, height: 200, name: 'old', savedAt: 5 },
      'Background',
    )
    expect(draft).toEqual({
      version: 2,
      layers: [{ name: 'Background', visible: true, opacity: 1, image }],
      active: 0,
      width: 300,
      height: 200,
      name: 'old',
      savedAt: 5,
    })
  })

  it('keeps a current draft as it is', () => {
    const current = {
      version: 2,
      layers: [
        { name: 'Background', visible: true, opacity: 1, image: blob() },
        { name: 'Ink', visible: false, opacity: 0.5, image: blob() },
      ],
      active: 1,
      width: 10,
      height: 10,
      name: null,
      savedAt: 1,
    }
    expect(upgradeDraft(current, 'Background')).toBe(current)
  })

  it('rejects anything damaged or empty', () => {
    expect(upgradeDraft(undefined, 'Background')).toBeNull()
    expect(upgradeDraft({ image: 'not a blob' }, 'Background')).toBeNull()
    expect(upgradeDraft({ version: 2, layers: [] }, 'Background')).toBeNull()
    expect(upgradeDraft({ version: 2, layers: [{ image: 42 }] }, 'Background')).toBeNull()
  })
})
