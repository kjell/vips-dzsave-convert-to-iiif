/** @format
 */

function getMaxZoom(imageSize, tileSize) {
  let { x, y } = imageSize

  return Math.ceil(Math.log(Math.max(x, y) / tileSize) / Math.LN2)
}

function zyxToIIIF(z, y, x, imageSize, tileSize = 512) {
  let { x: imageWidth, y: imageHeight } = imageSize
  let maxZoom = getMaxZoom(imageSize, tileSize)

  let scale = Math.pow(2, maxZoom - z)
  let tileBaseSize = tileSize * scale

  let minx = x * tileBaseSize,
    miny = y * tileBaseSize,
    maxx = Math.min(minx + tileBaseSize, imageWidth),
    maxy = Math.min(miny + tileBaseSize, imageHeight)

  let xDiff = maxx - minx
  let yDiff = maxy - miny
  let size = Math.ceil(xDiff / scale)

  let region = [minx, miny, xDiff, yDiff].join(',')
  let iiif = `/${region}/${size},/0/default.jpg`
  if (false)
    // prettier-ignore
    console.info({
      coords: [z, y, x],
      scale,
      tileBaseSize,
      minx, miny, maxx, maxy,
      xDiff, yDiff,
      size,
      region,
      iiif,
    })

  return iiif
}

module.exports = {
  zyxToIIIF,
  getMaxZoom,
}

// If this is being run directly and not `require()`d,
// do some cool stuff
if (!module.parent) {
  const fs = require('fs-extra')

  function getNumericDirs(src) {
    return fs
      .readdirSync(src)
      .filter(dir => dir === '0' || dir === '0.jpg' || parseInt(dir))
      .sort((a, b) => a.replace('.jpg', '') - b.replace('.jpg', ''))
  }

  // TODO don't hardcode these?
  const src = '111219'
  const imageSize = { x: 25616, y: 12341 }
  /* TODO
   * should this generate an info.json?
   * start with a source image file and manage the `dzsave` and conversion to iiif?
   */

  const zooms = getNumericDirs(src)

  zooms.map((z, zoomIndex) => {
    getNumericDirs(`./${src}/${z}`).map(y => {
      getNumericDirs(`./${src}/${z}/${y}`).map(xFile => {
        const [x, ext] = xFile.split('.')
        const iiif = zyxToIIIF(z, y, x, imageSize)
        const _src = `${src}/${z}/${y}/${x}.jpg`
        const dest = `${src}-iiif${iiif}`

        fs.ensureDir(dest.replace('/default.jpg', ''), err => {
          err
            ? console.error(err)
            : fs.copy(_src, dest, err => {
                err ? console.error(err) : console.info('.')
              })
        })
      })
    })
  })
}
