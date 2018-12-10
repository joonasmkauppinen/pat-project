'use strict';
const sharp = require('sharp');

const createThumb = (sourceFile, width, destinationFile, next) => {
  sharp(sourceFile)
    .resize(width)
    .toFile(destinationFile)
    .then(() => {
      console.log(`---  INFO   --- Resize OK`);
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
        console.log(`---  INFO   --- Resize OK (1x1)`);
        next();
      }).catch(err => {
        console.log(err)
        next();
      });
  };
  

module.exports = { createThumb, createOnePixel };