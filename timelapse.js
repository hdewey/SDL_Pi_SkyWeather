// start at 5am...
const fs = require('fs');
const fsExtra = require('fs-extra')

const videoshow = require('videoshow')
const { Storage } = require('@google-cloud/storage');

const photoPath = './static/timelapse/';
const bucketName = 'sstx-timelapse';

const projectId = 'skyweatherv3'
const keyFilename = 'service-key.json'
const storage = new Storage({projectId, keyFilename});

const moment = require('moment')

const clean = () => {

  try {
    fs.unlinkSync('./static/timelapse.mp4')
    //file removed
  } catch(err) {
    console.error(err)
  }
  
  fsExtra.emptyDirSync(photoPath)
}
const uploadGCP = async (filename) => {

  const yesterday = moment().format('M-D-YYYY')

  await storage.bucket(bucketName).upload(filename, {
    gzip: true,
    destination: `${yesterday}.mp4`,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  console.log(`${filename} uploaded to ${bucketName} as ${yesterday}.mp4`);

  clean();

}

const run = (images) => {
  var videoOptions = {
    fps: 25,
    loop: .1, // seconds
    transition: false,
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '1920x1080',
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }

  videoshow(images, videoOptions)
    .save('static/timelapse.mp4')
    .on('start', function (command) {
      console.log('ffmpeg process started:', command)
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err)
      console.error('ffmpeg stderr:', stderr)
    })
    .on('end', function (output) {
      console.error('Video created in:', output)
      uploadGCP('static/timelapse.mp4');
    })
}

const start = async () => {

  console.log('starting timelapse generation')

  fs.readdir(photoPath, (err, files) => {
    let arr = [];

    files.forEach(file => {
      arr.push(photoPath + file)
    })

    const final = arr;

    run(final);

  })
}

start();