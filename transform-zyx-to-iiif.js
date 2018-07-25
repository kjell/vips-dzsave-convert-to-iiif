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

if (!module.parent) {
  // If this is being run directly and not `require()`d…
  const fs = require('fs-extra')
  const sharp = require('sharp')

  function getNumericDirs(src) {
    return fs
      .readdirSync(src)
      .filter(dir => dir === '0' || dir === '0.jpg' || parseInt(dir))
      .sort((a, b) => a.replace('.jpg', '') - b.replace('.jpg', ''))
  }

  const src = process.argv[2]

  /* TODO
   * generate `info.json`
   * how to get image dimensions for an existing directory of tiles?
   * what to do when created files exist already: error?
   * split this into smaller files
   */

  function convertZyxTilesToIIIF(dir) {
    const imageSize = { x: 25616, y: 12341 } // TODO dont hardcode
    const zooms = getNumericDirs(dir)

    zooms.map((z, zoomIndex) => {
      getNumericDirs(`./${dir}/${z}`).map(y => {
        getNumericDirs(`./${dir}/${z}/${y}`).map(xFile => {
          const [x, ext] = xFile.split('.')
          const iiif = zyxToIIIF(z, y, x, imageSize)
          const _src = `${dir}/${z}/${y}/${x}.jpg`
          const dest = `${dir}-iiif${iiif}`

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

  function tileImageAndConvert(src) {
    const output = 'out'
    const image = sharp(src)
    const metadata = image
      .metadata()
      .then(meta => {
        const imageSize = { x: meta.width, y: meta.height }
        image
          .limitInputPixels(false)
          .tile({ layout: 'google', size: 512 })
          .toFile(output, (err, info) => {
            console.info('tiled', { err, info })
            convertZyxTilesToIIIF(output)
          })
      })
      .catch(err => console.error(err))
  }

  src.match(/.jpg/) ? tileImageAndConvert(src) : convertZyxTilesToIIIF(src)
}
