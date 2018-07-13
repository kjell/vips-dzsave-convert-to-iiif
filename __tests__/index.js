/** @format
 */
const { zyxToIIIF, getMaxZoom } = require('../transform-zyx-to-iiif')

const imageSize = { x: 25616, y: 12341 }

test('getMaxZoom', () => {
  expect(getMaxZoom(imageSize)).toBe(6)
})

test('at the highest zoom level its ez', () => {
  expect(zyxToIIIF(6, 0, 0, imageSize)).toBe('/0,0,512,512/512,/0/default.jpg')
  expect(zyxToIIIF(6, 20, 40, imageSize)).toBe(
    '/20480,10240,512,512/512,/0/default.jpg'
  )
})

test('at lowest zoom level?', () => {
  expect(zyxToIIIF(0, 0, 0, imageSize)).toBe(
    '/0,0,25616,12341/401,/0/default.jpg'
  )
})

test('and in the middle?', () => {
  expect(zyxToIIIF(2, 0, 0, imageSize)).toBe(
    '/0,0,8192,8192/512,/0/default.jpg'
  )

  expect(zyxToIIIF(2, 1, 1, imageSize)).toBe(
    '/8192,8192,8192,4149/512,/0/default.jpg'
  )

  expect(zyxToIIIF(3, 2, 1, imageSize)).toBe(
    '/4096,8192,4096,4096/512,/0/default.jpg'
  )
})
