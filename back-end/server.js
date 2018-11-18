'use strict';

// THIS IS JUST A TEST TO DEAL WITH BACK-END-SERVER
// T: SAMULI

while ( true ) {

 Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 4000);
 console.log('..');

}