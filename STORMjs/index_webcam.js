// Tensorflow.JS file to test cellSTORM in the browser
// Create local server:  python -m http. server 8000
let model;
let webcam;

// Some parameters
const square_x = 1;
const square_y = 2;
const N_time = 30;
const N_x = 256;
const N_y = 256;
const N_mag = 2;

const webcamElement = document.getElementById('webcam');
webcamElement.width = N_x/2;
webcamElement.height = N_y/2;


// Creating HTML5 canvas elements to display stuff
function createCanvases() {
  const canvas = document.createElement('canvas');
  canvas.width = N_x;
  canvas.height = N_y;
  canvas.id = `output`;
  document.body.appendChild(canvas);
  document.body.appendChild(
    document.createElement('br'),
);
}


// Loaded the TensorFlow.js model
// (which was converted from a Keras model.h5)
async function loadModel() {
    //model = await tf.loadLayersModel(
    //'https://storage.googleapis.com/tfjs-models/tfjs/iris_v1/model.json');
    //model.summary();
    //model = await tf.loadLayersModel('./converted_model128_25_keras/model.json', strict=false);
    model = await tf.loadLayersModel('./converted_model128_30_keras/model.json', strict=false);
    //console.log(model);
    model.summary();

}

// Initializing the application
async function init() {

      createCanvases();

      // Create an object from Tensorflow.js data API which could capture image
      // from the web camera as Tensor.
      webcam = await tf.data.webcam(webcamElement);

      console.log('Loading Model...');
      await loadModel();
      console.log('Successfully loaded model');

      computeFrames();

}


async function computeFrames() {
  // Initialize model and camera

  let iframe = 0

  // Get the first frame, extract and crop info
  const img = await webcam.capture();
  let img_stack = (img.slice([0, 0, 0], [img.shape[0], img.shape[1], 1]))
  //img_stack = tf.image.cropAndResize(img_stack.expandDims(0), [[0, 0, N_x, N_x]], [0], [N_x, N_y])


  while (true) {

    const img = await webcam.capture();
    const img_gray = (img.slice([0, 0, 0], [img.shape[0], img.shape[1], 1]))

    // concatenate frames
    img_stack = tf.concat([img_stack, img_gray], 2);
    //const result = await model.classify(img);



    if(img_stack.size==(N_x/N_mag*N_y/N_mag*N_time)){
      console.log("Predicting result...");

      // reshape and predict (from Android convention..)
      const img_stack_1d = img_stack.reshape([1,N_x/2*N_y/2*N_time]);
      const myresult = model.predict(img_stack_1d);
      const myresult_2d = myresult.reshape([N_x,N_y]);
      
      // Display result
      const canvas = document.getElementById(`output`);
      await tf.browser.toPixels(myresult_2d.clipByValue(0, 1).mul(tf.scalar(255)).cast('int32'), canvas);
      
      // Free Memory
      myresult.dispose();
      myresult_2d.dispose();
  
      // append images
      img_stack = img_gray;
    }
    //if(iframe==0){
      // save the initial frame as
    //  const img_stack = img_gray
    //}



    //document.getElementById('console').innerText = `
    //  prediction: ${result[0].className}\n
    //  probability: ${result[0].probability}
    //;
    //document.getElementById('console').innerHTML =
    // '<img src="imageName.png" />';


    // Dispose the tensor to release the memory.
    img.dispose();

    // Give some breathing room by waiting for the next animation frame to
    // fire.
    await tf.nextFrame();
  }
}

init();


/*
//if local exists
var dir = getlocalDir(url)
var img = fs.readFileSync(dir);
var tensor = tf.node.decodeJpeg(img, 3);
//if not exists - ctx still there at the moment
var tensor = tf.browser.fromPixels(ctx.canvas);
// then doing normalization
tensor = tensor.toFloat();
tensor = tensor.div(255.0);
tensor = tf.image.cropAndResize(tensor.expandDims(0), [[15, 15, 30, 30]], [0], [15, 15], 'nearest').reshape([15, 15, 3]);
imageTensorArray.push(tensor);
*/