'use strict';
const sharp = require('sharp');

const createThumb = (sourceFile, width, destinationFile, next) => {
  sharp(sourceFile)
    .resize(width)
    .toFile(destinationFile)
    .then(() => {
      console.log('Resize OK');
      next();
    }).catch(err => {
      console.log(err)
      next();
    });
};

const createOnePixel = (sourceFile, destinationFile, next) => {
    sharp(sourceFile)
      .resize(1,1)
      .toFile(destinationFile)
      .then(() => {
        console.log('1x1 Resize OK');
        next();
      }).catch(err => {
        console.log(err)
        next();
      });
  };
  

module.exports = { createThumb, createOnePixel };